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
      // the one important word shown on the post's tile in Newest News (e.g. AI, JAPAN)
      keyword: z.string().max(14).optional(),
      // shown instead of the date, e.g. "5 books"
      label: z.string().optional(),
      // the block opens this page instead of a post on this site (no post page is made)
      link: z.url().optional(),
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
      // travel: the country's symbol drawn beside its name on the trip block
      flag: z.enum(['japan']).optional(),
      // undated items are listed in this order
      order: z.number().default(0),
      // placeholder content: never shown in Newest News
      placeholder: z.boolean().default(false),
      cover: image().optional(),
    }),
});

export const collections = { blog };
