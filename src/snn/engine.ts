/**
 * Software copy of the capstone SNN accelerator (SNN_verilog/snn_multi).
 *
 * Encoders and layers 1-2 follow snn_multi/demo/encoder_model.py and snn_model.py
 * (themselves checked bit-exact against the RTL). Layer 3 and the decoders follow
 * fc_outcome.sv, rate_decoder.sv and temp_decoder.sv, including the early exit.
 * Checked against the board: same class and same number of timesteps on all
 * 20 test digits x 4 modes and on every logged board run (tools/verify_snn.ts).
 *
 * Plain TypeScript, no dependencies: runs in the browser and in Node.
 */

export const MODES = ['TEMP', 'RATE', 'DELTA_RATE', 'DELTA_TEMP'] as const;
export type Mode = (typeof MODES)[number];

/** Rate-structure network (beta 0.5) vs temporal/TTFS structure (beta 1, fire once). */
export const isRateStructure = (m: Mode) => m === 'RATE' || m === 'DELTA_RATE';
export const layer1Channels = (m: Mode) => (isRateStructure(m) ? 16 : 32);

const PIX = 784;

export interface ModeWeights {
  c1: number;
  k1: Int8Array; // [c1][9]
  b1: Int8Array; // [c1]
  k2: Int8Array; // [64][c1][9]
  b2: Int8Array; // [64]
  w3: Int8Array; // [64][49][10]
  b3: Int8Array; // [10]
}

export interface Model {
  weights: Record<Mode, ModeWeights>;
  testImages: Uint8Array[];
}

/** Parse public/snn/model.bin (layout: tools/export_snn_data.py). */
export function parseModel(buf: ArrayBuffer): Model {
  const all = new Int8Array(buf);
  let off = 0;
  const take = (n: number) => {
    const a = all.subarray(off, off + n);
    off += n;
    return a;
  };
  const weights = {} as Record<Mode, ModeWeights>;
  for (const m of MODES) {
    const c1 = layer1Channels(m);
    weights[m] = {
      c1,
      k1: take(c1 * 9),
      b1: take(c1),
      k2: take(64 * c1 * 9),
      b2: take(64),
      w3: take(64 * 49 * 10),
      b3: take(10),
    };
  }
  const bytes = new Uint8Array(buf);
  const testImages: Uint8Array[] = [];
  while (off + PIX <= bytes.length) {
    testImages.push(bytes.slice(off, off + PIX));
    off += PIX;
  }
  return { weights, testImages };
}

const wrap16 = (x: number) => (((x + 32768) & 0xffff) - 32768);

// ------------------------------------------------------------------ encoders

// rate_encoder.sv: five 8-bit LFSRs (one per timestep), reset seeds and taps
const LFSR_SEEDS = [0b0000_0001, 0b0010_1101, 0b0101_1011, 0b1001_0111, 0b1110_0011];
const LFSR_TAPS = [
  [7, 5, 4, 3],
  [6, 4, 1, 0],
  [6, 5, 4, 3],
  [7, 6, 5, 2],
  [7, 3, 2, 1],
];

const bitrev8 = (v: number) => {
  let r = 0;
  for (let i = 0; i < 8; i++) r |= ((v >> i) & 1) << (7 - i);
  return r;
};

/** Random thresholds per timestep; the board soft-resets before every image, so always the same. */
const RATE_THR: Uint8Array[] = LFSR_SEEDS.map((seed, i) => {
  const out = new Uint8Array(PIX);
  let r = seed;
  for (let k = 0; k < PIX; k++) {
    out[k] = bitrev8(r);
    let fb = 0;
    for (const t of LFSR_TAPS[i]) fb ^= (r >> t) & 1;
    r = ((r << 1) & 0xff) | fb;
  }
  return out;
});

/** Returns T spike maps of 784 (0/1). */
export function encode(pix: Uint8Array, mode: Mode): Uint8Array[] {
  if (mode === 'RATE') {
    return RATE_THR.map((thr) => pix.map((p, k) => (p > thr[k] ? 1 : 0)));
  }
  if (mode === 'TEMP') {
    // one spike per pixel, brighter fires earlier
    const out = Array.from({ length: 5 }, () => new Uint8Array(PIX));
    pix.forEach((p, k) => {
      const t = p >= 204 ? 0 : p >= 153 ? 1 : p >= 102 ? 2 : p >= 51 ? 3 : 4;
      out[t][k] = 1;
    });
    return out;
  }
  // delta_encoder.sv (DELTA_RATE and DELTA_TEMP share it)
  const out = Array.from({ length: 3 }, () => new Uint8Array(PIX));
  for (let y = 0; y < 28; y++) {
    for (let x = 0; x < 28; x++) {
      const k = y * 28 + x;
      const img = pix[k];
      const left = x > 0 ? pix[k - 1] : 0;
      const above = y > 0 ? pix[k - 28] : 0;
      const up0 = img >= 64 ? 1 : 0;
      const up1 = (up0 ? left >= 128 : left >= 64) ? 1 : 0;
      const cal = [img, left, above];
      const lvl = [0, up0, up0 + up1];
      for (let t = 0; t < 3; t++) {
        const d = cal[t] - (lvl[t] << 6);
        out[t][k] = d >= 64 || d <= -65 ? 1 : 0;
      }
    }
  }
  return out;
}

// ------------------------------------------------------------------ layers

/** 3x3 conv (zero pad 1) of spikes `inp` [cin][H][W] -> 2x2 max-pool of the wrapped sums -> [cout][H/2][W/2]. */
function convPool(
  inp: Uint8Array,
  cin: number,
  H: number,
  k: Int8Array,
  b: Int8Array,
  cout: number,
): Int32Array {
  const HW = H * H;
  const sums = new Int32Array(cout * HW);
  for (let o = 0; o < cout; o++) sums.fill(b[o], o * HW, (o + 1) * HW);
  // event driven: only input spikes contribute
  for (let c = 0; c < cin; c++) {
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < H; x++) {
        if (!inp[c * HW + y * H + x]) continue;
        // this spike is tap i of the window centred at (y - dy, x - dx)
        for (let i = 0; i < 9; i++) {
          const cy = y - (Math.floor(i / 3) - 1);
          const cx = x - ((i % 3) - 1);
          if (cy < 0 || cy >= H || cx < 0 || cx >= H) continue;
          const pos = cy * H + cx;
          for (let o = 0; o < cout; o++) sums[o * HW + pos] += k[(o * cin + c) * 9 + i];
        }
      }
    }
  }
  const h = H / 2;
  const out = new Int32Array(cout * h * h);
  for (let o = 0; o < cout; o++) {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < h; x++) {
        const base = o * HW + 2 * y * H + 2 * x;
        out[o * h * h + y * h + x] = Math.max(
          wrap16(sums[base]),
          wrap16(sums[base + 1]),
          wrap16(sums[base + H]),
          wrap16(sums[base + H + 1]),
        );
      }
    }
  }
  return out;
}

/** LIF neurons as in neuron.sv / TTFS_blocking.sv. */
class Neurons {
  pot: Int32Array;
  fired: Uint8Array;
  rate: boolean;
  constructor(n: number, rate: boolean) {
    this.rate = rate;
    this.pot = new Int32Array(n);
    this.fired = new Uint8Array(n);
  }
  step(inp: Int32Array): Uint8Array {
    const s = new Uint8Array(inp.length);
    for (let i = 0; i < inp.length; i++) {
      if (this.rate) {
        const cal = wrap16((this.pot[i] >> 1) + inp[i]); // beta = 0.5, threshold 1.0 (Q1.7)
        s[i] = cal >= 128 ? 1 : 0;
        this.pot[i] = s[i] ? 0 : cal;
      } else {
        if (this.fired[i]) continue; // fires at most once
        const cal = wrap16(this.pot[i] + inp[i]); // beta = 1, threshold 0.5
        s[i] = cal >= 64 ? 1 : 0;
        this.pot[i] = s[i] ? 0 : cal;
        if (s[i]) this.fired[i] = 1;
      }
    }
    return s;
  }
}

export interface RunResult {
  mode: Mode;
  /** predicted digit */
  cls: number;
  /** timesteps actually executed (early exit) */
  ts: number;
  /** maximum timesteps for this mode */
  T: number;
  input: Uint8Array[]; // [T] of 784
  l1: Uint8Array[]; // [ts] (or [T] with `full`) of c1*196
  l2: Uint8Array[]; // [ts] (or [T] with `full`) of 64*49
  out: Uint8Array[]; // [ts] (or [T] with `full`) of 10 output spikes
}

export interface RunOptions {
  /**
   * Keep running every timestep after the decision (for showing all timesteps).
   * `cls` and `ts` are still the board's answer and the timestep where it stopped.
   */
  full?: boolean;
}

export function run(pix: Uint8Array, mode: Mode, w: ModeWeights, opts: RunOptions = {}): RunResult {
  const rate = isRateStructure(mode);
  const input = encode(pix, mode);
  const T = input.length;
  const maxTs = T - 1;
  const n1 = new Neurons(w.c1 * 196, rate);
  const n2 = new Neurons(64 * 49, rate);
  const thr3 = rate ? 64 : 32; // Q2.6
  const pot3 = Int32Array.from(w.b3);
  const counts = new Int32Array(10);
  const l1: Uint8Array[] = [];
  const l2: Uint8Array[] = [];
  const out: Uint8Array[] = [];
  let decided: { cls: number; ts: number } | null = null;
  const done = () => ({ mode, cls: decided!.cls, ts: decided!.ts, T, input, l1, l2, out });

  for (let t = 0; t < T; t++) {
    const s1 = n1.step(convPool(input[t], 1, 28, w.k1, w.b1, w.c1));
    const s2 = n2.step(convPool(s1, w.c1, 14, w.k2, w.b2, 64));
    l1.push(s1);
    l2.push(s2);

    // layer 3: fully connected 64*49 -> 10, zero-skipping (only spikes add their weights)
    for (let i = 0; i < 64 * 49; i++) {
      if (!s2[i]) continue;
      for (let c = 0; c < 10; c++) pot3[c] += w.w3[i * 10 + c];
    }
    const spk = new Uint8Array(10);
    for (let c = 0; c < 10; c++) {
      const p = wrap16(pot3[c]);
      spk[c] = p >= thr3 ? 1 : 0;
      pot3[c] = wrap16((spk[c] ? 0 : rate ? p >> 1 : p) + w.b3[c]);
      counts[c] += spk[c];
    }
    out.push(spk);

    if (!decided) {
      const cls = decide(t);
      if (cls !== null) {
        decided = { cls, ts: t + 1 };
        if (!opts.full) return done();
      }
    }
  }
  if (!decided) throw new Error('no decision'); // unreachable: the last timestep always decides
  return done();

  /** the hardware's decoder after timestep t: the answer, or null to keep going (early exit) */
  function decide(t: number): number | null {
    const spk = out[t];
    if (!rate) {
      // temp_decoder: the first neuron to spike is the answer
      const first = spk.indexOf(1);
      if (first >= 0) return first;
      return t === maxTs ? 0 : null;
    }
    if (t < Math.floor(maxTs / 2)) return null;
    // rate_decoder
    if (t === maxTs) {
      let best = 0;
      let cls = 0;
      counts.forEach((n, c) => {
        if (n > best) {
          best = n;
          cls = c;
        }
      });
      return cls;
    }
    // early exit: exactly one neuron spiked every timestep, the rest are far enough behind
    const over = t - Math.floor(maxTs / 2);
    let confirmed = -1;
    let overConfirm = false;
    for (let c = 0; c < 10; c++) {
      if (counts[c] === t + 1 && confirmed < 0) confirmed = c;
      else if (counts[c] > over) overConfirm = true;
    }
    return confirmed >= 0 && !overConfirm ? confirmed : null;
  }
}

// ------------------------------------------------------------------ drawing -> MNIST

/** Python's round() / numpy's rint(): halves go to the even neighbour (0.5 -> 0, 1.5 -> 2). */
function roundHalfEven(v: number): number {
  const f = Math.floor(v);
  const d = v - f;
  if (Math.abs(d - 0.5) < 1e-9) return f % 2 === 0 ? f : f + 1;
  return Math.round(v);
}

/**
 * preprocess.py: ink box -> centred square -> 20x20 area average -> 28x28 with the
 * centre of mass in the middle -> brightest ink = 255.
 * `ink` is a size x size array of 0..255.
 */
export function toMnist(ink: Uint8ClampedArray | Uint8Array, size: number): Uint8Array {
  let x0 = size;
  let y0 = size;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (ink[y * size + x] > 10) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  const out = new Uint8Array(PIX);
  if (x1 < 0) return out;
  x1 += 1;
  y1 += 1;
  const side = Math.max(x1 - x0, y1 - y0);
  const sx0 = roundHalfEven((x0 + x1) / 2 - side / 2);
  const sy0 = roundHalfEven((y0 + y1) / 2 - side / 2);
  const at = (x: number, y: number) => {
    const ax = sx0 + x;
    const ay = sy0 + y;
    return ax < 0 || ay < 0 || ax >= size || ay >= size ? 0 : ink[ay * size + ax];
  };

  // area-average the side x side square down to 20 x 20
  const small = new Float64Array(400);
  const scale = side / 20;
  for (let oy = 0; oy < 20; oy++) {
    const fy0 = oy * scale;
    const fy1 = fy0 + scale;
    for (let ox = 0; ox < 20; ox++) {
      const fx0 = ox * scale;
      const fx1 = fx0 + scale;
      let acc = 0;
      for (let y = Math.floor(fy0); y < Math.ceil(fy1); y++) {
        const wy = Math.min(y + 1, fy1) - Math.max(y, fy0);
        for (let x = Math.floor(fx0); x < Math.ceil(fx1); x++) {
          const wx = Math.min(x + 1, fx1) - Math.max(x, fx0);
          acc += at(x, y) * wx * wy;
        }
      }
      small[oy * 20 + ox] = acc / (scale * scale);
    }
  }

  // place in 28x28, then shift the centre of mass to (14, 14), at most 4 px
  const img = new Float64Array(PIX);
  let tot = 0;
  let my = 0;
  let mx = 0;
  for (let y = 0; y < 20; y++) {
    for (let x = 0; x < 20; x++) {
      const v = small[y * 20 + x];
      img[(y + 4) * 28 + x + 4] = v;
      tot += v;
      my += (y + 4) * v;
      mx += (x + 4) * v;
    }
  }
  if (tot <= 0) return out;
  const clamp4 = (v: number) => Math.max(-4, Math.min(4, v));
  const dy = clamp4(roundHalfEven(14 - my / tot));
  const dx = clamp4(roundHalfEven(14 - mx / tot));
  const shifted = new Float64Array(PIX);
  let peak = 0;
  for (let y = 0; y < 28; y++) {
    for (let x = 0; x < 28; x++) {
      const v = img[y * 28 + x];
      const ny = (y + dy + 28) % 28;
      const nx = (x + dx + 28) % 28;
      shifted[ny * 28 + nx] = v;
      if (v > peak) peak = v;
    }
  }
  for (let k = 0; k < PIX; k++) out[k] = Math.max(0, Math.min(255, roundHalfEven((shifted[k] * 255) / peak)));
  return out;
}
