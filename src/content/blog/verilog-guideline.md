---
title: "Verilog Guideline"
date: 2025-10-01
category: research
section: curiosity
keyword: "VERILOG"
summary: "Things I learned throughout the capstone project learning process. These are notes that were taken while watching an online class about the protocol for safe and good Verilog coding style."
---

> These notes were derived from the [2024 NYCU DCS](https://youtube.com/playlist?list=PLCUEmRsKEgZ6HZP-DewnCO5YVBPjmXS8_) course.
>
> 1. This is a learning note, and it may have some errors.
> 2. HDL is hardware coding, so please do not think like a software engineer!

## Note to self

### Casez vs. casex

When using "don't care" in your case statement, we prefer **casez** over **casex**, because it is less problematic than the latter. **Casez** only treats "z" as "don't care" and "x" as unknown, which is normally what we want.

### Mixed blocking and non-blocking

Although mixing blocking and non-blocking assignments is a runnable coding style, we do not recommend it. Please note these:

1. Flip-flops should use non-blocking **"<="**
2. Latches should use non-blocking **"<="**
3. Combinational logic should use blocking **"="**
4. Mixed sequential and combinational logic should use non-blocking **"<="**

> **Note:** the first two rules are sequential logic.

### Unwanted latches

We normally do not want latches to appear in our design. Most of the time, they come from unintentional latching problems. This may happen because of:

1. **if** but no **else**
2. **case** is not full (no **default** condition)
3. using **y = y** as a condition

> **Note:** you can set the variable at the very start; then, even without **else** or **default**, synthesis will not create latches. But personally, I still set the case's **default**.

### For loops are not recommended

SystemVerilog unrolls your **for loop** into multiple rows of Verilog code. Therefore, we only use constants.

Do not use a normal coding mindset to think about the behavior of a **for loop** in Verilog. When checking whether your **for loop** will work properly, unroll it yourself and see what happens. Thus, we do not recommend using **for loops** when designing circuits.

**For loops** also drastically decrease the speed of synthesis and simulation.

```verilog
always @(posedge clk) begin
    for(i=0; i<10; i=i+1) num <= num + 1;
end

//it will expand to:
//num <= num + 1;
//num <= num + 1;
//...
//num <= num + 1;

//which is probably not what you want to happen
```

### Use the logic data type

**Logic** is a newer type of declaration that comes with SystemVerilog. It is a cleaner and easier substitute for **reg** and **wire**, although there are still cases where we need **wire**, like multi-driven buses and bi-directional buses.

### Race conditions

Multi-driven ports are caused by multiple **always blocks** writing values at the same instant. Although simulation is possible, the final value depends on how the simulator runs, which makes the values you get unpredictable. Therefore, place the outputs in the same **always block**.

## Combinational logic

### Case is better

From some perspective, **case** is another version of **if... else**, but it is easier to understand, faster, and cleaner. Therefore, we normally do not use **if... else** when there are multiple conditions: it slows down the run time and gets messy when checking your code.

### Auto sensitivity list

We do not recommend typing out your own sensitivity list for combinational logic. Normally, we just use **always @(\*)** / **always_comb** to include every variable that is needed.

### Combinational loop

When using **always_comb**, we do not use **x = x + 1**, because this causes a dead loop. Please note that you also should not write this kind of loop in **assign**.

## Sequential logic

### Unwanted latches

Sequential logic also has a chance of creating latches during synthesis. Even though **@(clk)** looks like **@(posedge clk, negedge clk)**, it creates a very different circuit.

Using **@(clk)... if (clk)** will create a latch on your DFF. Therefore, just using **@(posedge clk)** is enough.

### Only for DFFs

Almost all of the registers in IC design are DFFs. We only use sequential logic for the **clk** signal in our DFFs; for arithmetic output control, we prefer data-flow **assign** or combinational logic **always @(\*)** / **always_comb**.

The difference between sequential logic and combinational logic comes down to this when there are large amounts of arithmetic equations: if you write **y = a + b**, it should be combinational; **x <= y** should be sequential. Remember, sequential logic is only used when making DFFs.

### Mixed reset and non-reset

When we write DFFs, we separate the variables that are affected by **rst** from the ones that are not. Putting them in separate **always_ff** blocks prevents unwanted latches and design errors.

### Mixed posedge and negedge clk DFFs

Connecting a posedge DFF to a negedge DFF is not recommended. It leaves only half a clock cycle for processing the data, which may cause errors when the DFF receives the data.

## Finite state machine

### Typical FSM

```systemverilog
module fsm(output logic rd, ds,
           input go, ws, clk, rst_n);

    parameter   IDLE = 2'b00,
                READ = 2'b01,
                DLY = 2'b11,
                DONE = 2'b10;
    //we do not use `define, because it is a global variable

    logic [1:0] state, next_state;
    //"logic" is more general, less error-prone type of data type
    //this should be "reg"

    always_ff @(posedge clk, negedge rst_n) begin
        if(!rst_n) state <= IDLE;
        else state <= next_state;
    end
    //remember to use non-blocking in sequential logic
    //using "always_ff" will give you warning if you use blocking

    always_comb begin
        next_state = 'bx;
        //use 'bx for logic minimize, or you can use IDLE instead
        //auto fill the same bit size "z"
        rd = 1'b0;
        ds = 1'b0;
        //this set variable defaults to not create latches
        case(state)
            IDLE: begin
                if(go) next_state = READ;
                else next_state = state;
            end
            READ: begin
                rd = 1'b1;
                next_state = DLY;
            end
            DLY: begin
                rd = 1'b1;
                if(!ws) next_state = DONE;
                else next_state = READ;
            end
            DONE: begin
                ds = 2'b1;
                next_state = IDLE;
            end
            default: next_state = state;
            //using "next_state = state" will make your design smaller
        endcase
    end

    //we use 2~3 always block to create our FSM
    //1. state for DFF (sequential)
    //2. next state (combinational)
    //3. output logic (combinational)

endmodule
```

### Divide and conquer

When the finite state machine is too large, we divide it into multiple always blocks (FSMs). Divide it into different parts when there are consecutive operating logics or more independent sections. A hierarchical FSM like this is easier, cleaner, and takes up less hardware.

## Area reduction

### Gate count

When we talk about the size of transistors, we use "gate count" as the unit. The size is compared to a NAND2, which is one unit. With it, we can estimate how much area a design needs and find ways to minimize it.

1. **+** is 7 ~ 8 gate count
2. **DFF** is 7 gate count
3. **MUX** is 2 gate count
4. **N×N** is N<sup>2</sup> × 7 gate count

### Sharing transistors

When adding multiple values that have similar inputs, we can design them to share one adder using **assign**. Although this reduces the design area, it may create more wire nodes, causing a higher R<sub>C</sub>. As IC designers, we add a buffer at the output to decrease R<sub>C</sub>.

```verilog
sum1 = a + b + c;
sum2 = a + b + d;
sum3 = a + b + e;

/////////////////////

assign temp = a + b;
sum1 = temp + c;
sum2 = temp + d;
sum3 = temp + e;
```

### Timing violation

Timing and area are a trade-off: when you design a smaller circuit, the timing constraint is harder to reach. The compiler will try to increase the area, choosing faster cells from the library. When the compiler has chosen the fastest cells and still misses the timing constraint, it reports a timing violation.

We can solve this by splitting up our combinational logic. Between two stages of DFFs, we can try to distribute the logic evenly across the sections.

### Rule of thumb

The controller takes 5 to 10% of the area. The data path takes 40 to 70%. Memory or buffers take up the rest.

## Power consumption

### Clock gating

We add **en** to our DFFs so they don't consume **clk** signals when not needed, decreasing the power consumption of our IC chip. Clock gating is very important, because 50% ~ 70% of the power is consumed by the clock network.

There are also EDA tools that can create clock gating at the output of the clock, using latches for a low-activity clock signal.

```systemverilog
always_ff @(posedge clk) begin
    if(en) y = y_nxt;
end
```
