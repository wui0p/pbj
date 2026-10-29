# Jeffrey Wu — Portfolio & Blogs

My personal portfolio and blog: research, teaching, thoughts and travel. Live at **https://wui0p.github.io/pbj/**.

Built with [Astro](https://astro.build) as a static site and deployed to GitHub Pages by
`.github/workflows/static.yml` on every push to `main`.

## Write a post

Add a markdown file to `src/content/blog/`. If it has pictures, use a folder instead:
`src/content/blog/my-post/index.md` with the pictures next to it (`![alt text](./photo.jpg)`).

```yaml
---
title: "..."
date: 2026-10-04     # optional; only the month and year are shown ("Oct 2026")
until: 2026-06-01    # optional end date: shown as a range ("Jan – Jun 2026")
category: research   # research | teaching | thoughts | travel  (Misc questions live in src/content/misc/)
section: curiosity   # the heading it sits under on the category page:
                     #   research: academic | curiosity | old-essay
                     #   teaching: jobs | others
                     #   thoughts: memo | recommendations
summary: "One or two sentences."   # optional
pinned: false        # true = shows in Pinned Items
label: "5 books"     # optional: shown instead of the date
link: "https://..."  # optional: the block opens this link; no page is made on the site
buttons:             # optional: a big flat block with 3D buttons
  - label: "View full report"
    href: "https://..."
order: 1             # undated items are listed in this order
placeholder: false   # true = can't be clicked yet ("under construction"), no page
---
```

- A line in *italics* right after a picture becomes its caption.
- Code blocks: use ` ```verilog ` or ` ```systemverilog `.
- Edit a file right on GitHub (pencil icon) and commit: the site rebuilds by itself in about two minutes.

## Run it on your own computer

Needs [Node.js](https://nodejs.org) 22 or newer.

```bash
npm ci
npm run dev      # http://localhost:4321
npm run build    # the finished site goes to dist/
```

## Where things are

| What | Where |
| --- | --- |
| Colors, fonts, shared styles | `src/styles/global.css` |
| Hero (stretched title, painting, falling boards) | `src/components/Hero.astro`, `Boards.astro` |
| The message, AI & BRAIN, Education, Story = Art | `src/components/Message.astro`, `Portfolio.astro`, `Education.astro`, `Story.astro` |
| Menu + Pinned Items | `src/components/MenuPinned.astro` |
| Painting descriptions on hover | `src/components/ArtNotes.astro` |
| Category pages | `src/pages/category/[category].astro` |
| Post pages + side bar | `src/pages/blog/[...id].astro`, `src/components/PostDrawer.astro` |
| Teaching jobs | `src/components/TeachingJobs.astro` |
| Misc page + questions | `src/components/MiscPage.astro`, `src/content/misc/` |
| Bravo Songs albums | `src/components/Albums.astro` |
| Japan 2026 photo album | `src/components/TripStory.astro`, `src/trips/japan-2026.ts` |
| SNN accelerator demo (UI / simulator) | `src/components/SnnDemo.astro` / `src/snn/engine.ts` |
| Top bar + PB&J logo | `src/components/SiteBar.astro`, `Logo.astro` |
| Information | `src/components/Information.astro` |
| Categories and their sections | `src/consts.ts` |

The famous paintings on the site are public domain; *Lonely Ocean* is my own.
