/**
 * NUVA breakpoints. CSS does not allow variables in @media, so the
 * .module.css files use exactly these numbers with the comment
 * "see src/styles/breakpoints.ts".
 */
export const breakpoints = { sm: 640, md: 900, tablet: 1024, lg: 1180 } as const;

/** `sizes` strings for next/image, derived from the breakpoints. */
export const imageSizes = {
  full: '100vw',
  half: `(max-width: ${breakpoints.sm}px) 100vw, 50vw`,
  card: `(max-width: ${breakpoints.sm}px) 85vw, 340px`,
  grid: `(max-width: ${breakpoints.sm}px) 100vw, (max-width: ${breakpoints.md}px) 50vw, 300px`,
  third: `(max-width: ${breakpoints.sm}px) 100vw, (max-width: ${breakpoints.md}px) 50vw, 400px`,
  modal: `(max-width: ${breakpoints.sm}px) 100vw, 490px`,
  thumb: '64px',
  projectTaller: `(max-width: ${breakpoints.sm}px) 82vw, 360px`,
  tecnica: `(max-width: ${breakpoints.sm}px) 100vw, (max-width: ${breakpoints.tablet - 1}px) 50vw, 400px`,
  equipos: '(max-width: 1240px) 100vw, 1160px',
} as const;

export type ImageSizeKey = keyof typeof imageSizes;
