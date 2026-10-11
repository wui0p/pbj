export const SITE_TITLE = 'Jeffrey Wu — Portfolio & Blogs';
export const SITE_DESCRIPTION =
  'Portfolio and blogs of Jeffrey Wu, EE undergraduate at NCHU: IC design, spiking neural network accelerators, Verilog/FPGA, essays and travel.';

export const LINKS = {
  github: 'https://github.com/wui0p',
  linkedin: 'https://www.linkedin.com/in/jeffrey-wu-42278b301',
};

// Verilog and Old Work were folded into Research on 2026-10-10 (mockup v10).
export const CATEGORY_SLUGS = ['research', 'thoughts', 'travel'] as const;
export type CategorySlug = (typeof CATEGORY_SLUGS)[number];

export const CATEGORIES: Record<CategorySlug, { label: string; blurb: string }> = {
  research: { label: 'Research', blurb: 'Work, projects, and results' },
  thoughts: { label: 'Thoughts', blurb: 'Things I want to share' },
  travel: { label: 'Travel', blurb: 'Fly away from my problems' },
};

/** The headed groups on each category page, in page order (a post picks one with `section:`). */
export const SECTIONS: Record<CategorySlug, { id: string; label: string }[]> = {
  research: [
    { id: 'academic', label: 'Academic Studies' },
    { id: 'curiosity', label: 'Side Curiosity' },
    { id: 'old-essay', label: 'Old Essay' },
  ],
  thoughts: [
    { id: 'recommendations', label: 'Recommendations' },
    { id: 'memo', label: 'Random Memo' },
  ],
  travel: [],
};
