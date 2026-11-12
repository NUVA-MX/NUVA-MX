// Pure helpers for the admin image pipeline (size math and upload naming). No DOM access.

export const MAX_EDGE = 2400;
export const WEBP_QUALITY = 0.82;
export const WEBP_TYPE = 'image/webp';

const MAX_SECTION_LENGTH = 20;
const MAX_STEM_LENGTH = 70;

export type Size = { width: number; height: number };

/** Fits (width, height) inside maxEdge on the long edge, keeping the aspect ratio. Never upscales. */
export function targetSize(width: number, height: number, maxEdge: number = MAX_EDGE): Size {
  const long = Math.max(width, height);
  if (!(long > maxEdge)) return { width, height };
  const scale = maxEdge / long;
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

function slug(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Section slug: lowercase letters and digits only, capped in length. Empty when nothing usable remains. */
export function sectionSlug(section: string | undefined): string {
  return (section ?? '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, MAX_SECTION_LENGTH);
}

/**
 * Upload pathname `<prefix><section>-<safe-name>` (single segment, at most 100 chars after the prefix),
 * so it passes isSafeUploadPath(). With asWebp the original extension is replaced by .webp.
 */
export function buildUploadName(prefix: string, fileName: string, section?: string, asWebp = false): string {
  const dot = fileName.lastIndexOf('.');
  const rawStem = dot > 0 ? fileName.slice(0, dot) : fileName;
  const rawExt = dot > 0 ? slug(fileName.slice(dot + 1)).slice(0, 8) : '';
  const ext = asWebp ? 'webp' : rawExt;
  const stem = slug(rawStem).slice(0, MAX_STEM_LENGTH).replace(/-+$/, '') || 'foto';
  const sec = sectionSlug(section);
  return `${prefix}${sec ? `${sec}-` : ''}${stem}${ext ? `.${ext}` : ''}`;
}
