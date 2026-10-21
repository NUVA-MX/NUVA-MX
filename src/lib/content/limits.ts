// Shared limits for the editable /encargo content. Pure: imported by the DB schema (CHECK constraints),
// the zod schemas and the admin forms, so all three always agree.

export const PROJECT_TECHNIQUES = ['Bordado', 'Estampado', 'Serigrafía', 'Accesorios'] as const;
export type ProjectTechnique = (typeof PROJECT_TECHNIQUES)[number];

/** Max characters per project text column. */
export const PROJECT_LIMITS = {
  name: 60,
  tag: 30,
  meta: 80,
  description: 400,
  techniqueDetail: 60,
  minimum: 40,
  colors: 60,
  delivery: 40,
  imageAlt: 160,
} as const;

/** Max characters per editable section field. */
export const TEXT_LIMITS = {
  eyebrow: 40,
  title: 90,
  body: 400,
  announcement: 140,
  marqueeText: 80,
  alt: 160,
  statValue: 12,
  statLabel: 30,
  techniqueName: 30,
  fact: 60,
  line: 120,
  template: 300,
} as const;

/** Hard cap on projects (the admin shows "N de 24"; the 25th create is rejected). */
export const MAX_PROJECTS = 24;
