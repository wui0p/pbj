export const SITE_TITLE = 'Jeffrey Wu — Portfolio & Blogs';
export const SITE_DESCRIPTION =
  'Portfolio and blogs of Jeffrey Wu, EE undergraduate at NCHU: IC design, spiking neural network accelerators, Verilog/FPGA, essays and travel.';

export const LINKS = {
  github: 'https://github.com/wui0p',
  linkedin: 'https://www.linkedin.com/in/jeffrey-wu-42278b301',
};

export const CATEGORY_SLUGS = ['research', 'teaching', 'thoughts', 'misc', 'travel'] as const;
export type CategorySlug = (typeof CATEGORY_SLUGS)[number];

export const CATEGORIES: Record<CategorySlug, { label: string; blurb: string }> = {
  research: { label: 'Research', blurb: 'Work, projects, and results' },
  teaching: { label: 'Teaching', blurb: 'My work and jobs for teaching' },
  thoughts: { label: 'Thoughts', blurb: 'Things I want to share' },
  misc: { label: 'Misc', blurb: 'Random things about me' },
  travel: { label: 'Travel', blurb: 'Fly away from my problems' },
};

/**
 * My teaching in numbers, in this order. Shown on the home page (EDUCATION, the 3D bars) and beside
 * the Teaching page's painting — edit them here and both follow.
 */
export const TEACHING_STATS: { num: string; label: string }[] = [
  { num: '370+', label: 'hours of teaching' },
  { num: '90+', label: 'students taught' },
  { num: '1020+', label: 'solutions written' },
  { num: '21', label: 'original problems written' },
];

/** The headed groups on each category page, in page order (a post picks one with `section:`). */
export const SECTIONS: Record<CategorySlug, { id: string; label: string }[]> = {
  research: [
    { id: 'academic', label: 'Academic Studies' },
    { id: 'curiosity', label: 'Side Curiosity' },
    { id: 'old-essay', label: 'Old Essay' },
  ],
  teaching: [
    { id: 'jobs', label: 'Teaching Job' },
    { id: 'others', label: 'Others' },
  ],
  thoughts: [
    { id: 'memo', label: 'My Take' },
    { id: 'recommendations', label: 'Recommendations' },
  ],
  misc: [], // questions, not posts (src/content/misc)
  travel: [],
};
