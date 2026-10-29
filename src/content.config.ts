import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { CATEGORY_SLUGS } from './consts';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      // only the month and year are ever shown; lists without dates (e.g. a book list) leave it out
      date: z.coerce.date().optional(),
      // for things that lasted a while: shown as "Jan – Jun 2026" (sorted by this end date)
      until: z.coerce.date().optional(),
      category: z.enum(CATEGORY_SLUGS),
      // which headed group of the category page it sits in (see SECTIONS in consts.ts)
      section: z.string().optional(),
      summary: z.string().optional(),
      pinned: z.boolean().default(false),
      // shown instead of the date, e.g. "5 books"
      label: z.string().optional(),
      // the block opens this page instead of a post on this site (no post page is made)
      link: z.url().optional(),
      // an outside-link block that is also listed in the post side bar (opening its link); never in
      // Previous / Next
      sidebar: z.boolean().default(false),
      // a big block with its own buttons: the block itself isn't a link, only the buttons are.
      // href: opens that page · action "demo": opens the SNN demo under the section ·
      // neither: shown but does nothing yet (`note` is shown beside it on hover)
      buttons: z
        .array(
          z.object({
            label: z.string(),
            href: z.string().optional(),
            action: z.enum(['demo']).optional(),
            note: z.string().optional(),
          }),
        )
        .optional(),
      // teaching jobs: clicking the block opens this right under it (the post's text is the description);
      // no page is made
      popup: z
        .object({
          image: image(),
          alt: z.string(),
          caption: z.string().optional(),
          stats: z.array(z.tuple([z.string(), z.string()])).default([]),
        })
        .optional(),
      // travel: this post's page is a trip's photo album (photos + notes per day, src/trips/<trip>.ts)
      trip: z.enum(['japan-2026']).optional(),
      // travel: the country's symbol drawn beside its name on the trip block
      flag: z.enum(['japan']).optional(),
      // undated items are listed in this order
      order: z.number().default(0),
      // placeholder content: can't be clicked, gets no page, never in Previous / Next
      placeholder: z.boolean().default(false),
      cover: image().optional(),
      // news: the post page reads like a news report (serif headline and text, byline, no summary under the
      // title, the ## headings hidden in the text but still listed in the side bar)
      layout: z.enum(['news']).optional(),
      // music posts (Bravo Songs): one section per album, its cover beside the title and text, then a
      // Greek-pattern strip that opens `link` (`call` is the line the strip shows when it parts)
      albums: z
        .array(
          z.object({
            title: z.string(),
            // shown under the title: "by …"
            by: z.string().optional(),
            cover: image(),
            alt: z.string(),
            // a second picture, on the right under the text
            photo: image().optional(),
            photoAlt: z.string().optional(),
            // credit shown under the second picture (licensed photos, e.g. CC BY): who took it, where it's from,
            // and its licence
            photoCredit: z
              .object({ author: z.string(), source: z.url(), license: z.string(), licenseUrl: z.url() })
              .optional(),
            // without a link the strip still parts, but isn't a link yet
            link: z.url().optional(),
            call: z.string(),
            // the strip's patterns: greek (key, waves, bars), meadow (wheat, hills, grass) or
            // hardsoft (sharp zigzag, bubbles, round scallops)
            strip: z.enum(['greek', 'meadow', 'hardsoft']).default('greek'),
            text: z.array(z.string()),
          }),
        )
        .optional(),
    }),
});

// Misc page: small questions about me, each answer hidden until its question is clicked.
// One file per question; the file's text is the answer.
const misc = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/misc' }),
  schema: ({ image }) =>
    z.object({
      question: z.string(),
      // listed in this order
      order: z.number().default(0),
      // a picture with a small caption under it: on the left of the answer ("side"), or across its full width
      // under the text ("below"); or two pictures side by side under the text (with `photo2`): two tall ones kept
      // short, the caption beside them ("pair"), or two wide ones across the full width, the caption under them
      // ("row"). A "pair" with a `photo3` too puts the three in one row filling the width, the caption under them
      photo: image().optional(),
      photoAlt: z.string().optional(),
      photo2: image().optional(),
      photo2Alt: z.string().optional(),
      photo3: image().optional(),
      photo3Alt: z.string().optional(),
      photoCaption: z.string().optional(),
      photoAt: z.enum(['side', 'below', 'pair', 'row']).default('side'),
    }),
});

export const collections = { blog, misc };
