import { z } from 'zod';
import { isValidDay } from './mx-date';
import { PROJECT_LIMITS, PROJECT_TECHNIQUES, TEXT_LIMITS } from './limits';
import { plainText } from './text';
import { isAllowedImageUrl } from '@/lib/products/validation';

/** Closed allowlist of editable sections. */
export const SECTION_KEYS = [
  'announcement',
  'hero',
  'marquee',
  'queHacemos',
  'tecnicas',
  'projectsIntro',
  'equipos',
  'taller',
  'crossLink',
  'whatsapp',
] as const;
export type SectionKey = (typeof SECTION_KEYS)[number];
export const sectionKeySchema = z.enum(SECTION_KEYS);

export const ENCARGO_IMAGE_PREFIX = '/encargo/';

/** Pathname of an uploaded encargo image: one safe segment under /encargo/ (Blob adds a random suffix). */
const IMAGE_PATH = /^\/encargo\/[A-Za-z0-9][A-Za-z0-9._-]{0,199}$/;

/** True for https://<our blob host>/encargo/<name> with no query, hash, userinfo, port or traversal. */
export function isEncargoImageUrl(value: string, host?: string | null): boolean {
  // No configured Blob store (no token) means no trusted host: accept nothing instead of any store.
  if (typeof value !== 'string' || value.length > 2048 || !host) return false;
  if (/[?#\\]|\.\./.test(value) || /%(2e|2f|5c)/i.test(value)) return false;
  if (!isAllowedImageUrl(value, host)) return false;
  try {
    const url = new URL(value);
    // Canonical only: the stored string must equal what the URL parser produces, so every later comparison
    // (and the blob delete call) refers to exactly one blob. Rejects whitespace, upper-case host, :443, etc.
    return url.href === value && IMAGE_PATH.test(url.pathname);
  } catch {
    return false;
  }
}

const text = (max: number, opts?: { multiline?: boolean }) => plainText(1, max, opts);

export function imageSchema(host?: string | null) {
  return z.strictObject({
    url: z.string().max(2048).refine((v) => isEncargoImageUrl(v, host), { message: 'image_url' }),
    alt: plainText(3, TEXT_LIMITS.alt),
  });
}

const dayString = z.string().refine(isValidDay, { message: 'date' });

/** Placeholders other than {name}: rejected so a template cannot smuggle tokens we do not fill. */
function placeholderCount(template: string): { name: number; other: number } {
  let name = 0;
  let other = 0;
  for (const m of template.matchAll(/\{([^{}]*)\}/g)) {
    if (m[1] === 'name') name += 1;
    else other += 1;
  }
  return { name, other };
}

/** Template must contain `{name}` exactly once and no other `{...}` placeholder. */
const nameTemplate = text(TEXT_LIMITS.template).refine(
  (v) => {
    const c = placeholderCount(v);
    return c.name === 1 && c.other === 0 && !/[{}]/.test(v.replace(/\{name\}/, ''));
  },
  { message: 'template' },
);
const plainTemplate = text(TEXT_LIMITS.template).refine((v) => !/[{}]/.test(v), { message: 'template' });

/** Arrays merge by index: a `null` entry means "use the default for this slot". */
const slots = <T extends z.ZodType>(item: T, max: number) => z.array(item.nullable()).max(max);

/** One strict, all-optional schema per section: each is a partial override. */
export function sectionSchemas(host?: string | null) {
  const image = imageSchema(host);
  return {
    announcement: z.strictObject({ text: text(TEXT_LIMITS.announcement).optional() }),
    hero: z.strictObject({ title: text(TEXT_LIMITS.title).optional(), image: image.optional() }),
    marquee: z
      .strictObject({
        enabled: z.boolean().optional(),
        text: text(TEXT_LIMITS.marqueeText).optional(),
        startsOn: dayString.optional(),
        endsOn: dayString.optional(),
      })
      .superRefine((v, ctx) => {
        if (v.enabled && !v.text) ctx.addIssue({ code: 'custom', path: ['text'], message: 'marquee_text_required' });
        if (v.startsOn && v.endsOn && v.endsOn < v.startsOn) {
          ctx.addIssue({ code: 'custom', path: ['endsOn'], message: 'date_order' });
        }
      }),
    queHacemos: z.strictObject({
      eyebrow: text(TEXT_LIMITS.eyebrow).optional(),
      title: text(TEXT_LIMITS.title).optional(),
      body: text(TEXT_LIMITS.body, { multiline: true }).optional(),
      images: slots(image, 3).optional(),
    }),
    tecnicas: z.strictObject({
      eyebrow: text(TEXT_LIMITS.eyebrow).optional(),
      title: text(TEXT_LIMITS.title).optional(),
      items: slots(
        z.strictObject({
          name: text(TEXT_LIMITS.techniqueName).optional(),
          fact: text(TEXT_LIMITS.fact).optional(),
          image: image.optional(),
        }),
        4,
      ).optional(),
    }),
    projectsIntro: z.strictObject({
      eyebrow: text(TEXT_LIMITS.eyebrow).optional(),
      title: text(TEXT_LIMITS.title).optional(),
      lead: text(TEXT_LIMITS.body, { multiline: true }).optional(),
    }),
    equipos: z.strictObject({
      eyebrow: text(TEXT_LIMITS.eyebrow).optional(),
      title: text(TEXT_LIMITS.title).optional(),
      lines: slots(text(TEXT_LIMITS.line), 2).optional(),
      slides: slots(image, 4).optional(),
    }),
    taller: z.strictObject({
      eyebrow: text(TEXT_LIMITS.eyebrow).optional(),
      title: text(TEXT_LIMITS.title).optional(),
      paragraph: text(TEXT_LIMITS.body, { multiline: true }).optional(),
      image: image.optional(),
      stats: slots(
        z.strictObject({
          value: text(TEXT_LIMITS.statValue).optional(),
          label: text(TEXT_LIMITS.statLabel).optional(),
        }),
        3,
      ).optional(),
    }),
    crossLink: z.strictObject({
      eyebrow: text(TEXT_LIMITS.eyebrow).optional(),
      title: text(TEXT_LIMITS.title).optional(),
      body: text(TEXT_LIMITS.body, { multiline: true }).optional(),
      image: image.optional(),
    }),
    whatsapp: z.strictObject({
      projectOrder: nameTemplate.optional(),
      bulkQuote: nameTemplate.optional(),
      teamQuote: plainTemplate.optional(),
    }),
  } as const;
}

export type SectionOverrides = {
  [K in SectionKey]: z.output<ReturnType<typeof sectionSchemas>[K]>;
};
/** Stored document: only the sections that have overrides. */
export type EncargoOverrides = { [K in SectionKey]?: SectionOverrides[K] };

/** Strict object of all sections (used on write for the whole document). */
export function encargoOverridesSchema(host?: string | null) {
  const s = sectionSchemas(host);
  return z.strictObject({
    announcement: s.announcement.optional(),
    hero: s.hero.optional(),
    marquee: s.marquee.optional(),
    queHacemos: s.queHacemos.optional(),
    tecnicas: s.tecnicas.optional(),
    projectsIntro: s.projectsIntro.optional(),
    equipos: s.equipos.optional(),
    taller: s.taller.optional(),
    crossLink: s.crossLink.optional(),
    whatsapp: s.whatsapp.optional(),
  });
}

/**
 * Validates each stored section independently. Invalid sections are dropped and reported, so one corrupted
 * section only loses its own overrides. Unknown top-level keys are ignored and reported as invalid.
 */
export function sanitizeOverrides(
  raw: unknown,
  host?: string | null,
): { overrides: EncargoOverrides; invalid: string[] } {
  const overrides: Record<string, unknown> = {};
  const invalid: string[] = [];
  if (raw === null || raw === undefined) return { overrides, invalid };
  if (typeof raw !== 'object' || Array.isArray(raw)) return { overrides, invalid: ['$root'] };
  const schemas = sectionSchemas(host);
  for (const key of Object.keys(raw)) {
    if (!(SECTION_KEYS as readonly string[]).includes(key)) {
      invalid.push(key);
      continue;
    }
    const k = key as SectionKey;
    const parsed = schemas[k].safeParse((raw as Record<string, unknown>)[key]);
    if (parsed.success) overrides[k] = parsed.data;
    else invalid.push(k);
  }
  return { overrides: overrides as EncargoOverrides, invalid };
}

/** Every image URL referenced by an overrides document. */
export function collectImageUrls(overrides: EncargoOverrides): string[] {
  const out: string[] = [];
  const walk = (v: unknown) => {
    if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === 'object') {
      const o = v as Record<string, unknown>;
      if (typeof o.url === 'string') out.push(o.url);
      for (const val of Object.values(o)) if (typeof val === 'object') walk(val);
    }
  };
  walk(overrides);
  return out;
}

/** Fields the restore action accepts per section: the closed allowlist of override paths. */
export const RESTORE_PATHS: Record<SectionKey, readonly string[]> = {
  announcement: ['text'],
  hero: ['title', 'image'],
  marquee: ['enabled', 'text', 'startsOn', 'endsOn'],
  queHacemos: ['eyebrow', 'title', 'body', 'images.0', 'images.1', 'images.2'],
  tecnicas: [
    'eyebrow',
    'title',
    ...[0, 1, 2, 3].flatMap((i) => [`items.${i}`, `items.${i}.name`, `items.${i}.fact`, `items.${i}.image`]),
  ],
  projectsIntro: ['eyebrow', 'title', 'lead'],
  equipos: ['eyebrow', 'title', 'lines.0', 'lines.1', 'slides.0', 'slides.1', 'slides.2', 'slides.3'],
  taller: [
    'eyebrow',
    'title',
    'paragraph',
    'image',
    ...[0, 1, 2].flatMap((i) => [`stats.${i}`, `stats.${i}.value`, `stats.${i}.label`]),
  ],
  crossLink: ['eyebrow', 'title', 'body', 'image'],
  whatsapp: ['projectOrder', 'bulkQuote', 'teamQuote'],
};

export function isRestorePath(section: SectionKey, field: string): boolean {
  return RESTORE_PATHS[section].includes(field);
}

// ---- Projects -------------------------------------------------------------------------------------------

const PROJECT_FIELDS = [
  'name',
  'technique',
  'tag',
  'meta',
  'description',
  'techniqueDetail',
  'minimum',
  'colors',
  'delivery',
  'imageUrl',
  'imageAlt',
  'visible',
] as const;
export type ProjectField = (typeof PROJECT_FIELDS)[number];
export const PROJECT_FORM_FIELDS = PROJECT_FIELDS;

const projectAlt = z
  .string()
  .max(PROJECT_LIMITS.imageAlt * 4)
  .transform((v) => v.trim())
  .pipe(z.union([z.literal(''), plainText(3, PROJECT_LIMITS.imageAlt)]));

/**
 * Editable project fields only. `sortOrder`, `id` and timestamps are not accepted (strict object).
 * Alt text is required whenever an image is set.
 */
export function projectSchema(host?: string | null) {
  return z
    .strictObject({
      name: text(PROJECT_LIMITS.name),
      technique: z.enum(PROJECT_TECHNIQUES),
      tag: text(PROJECT_LIMITS.tag),
      meta: text(PROJECT_LIMITS.meta),
      description: text(PROJECT_LIMITS.description, { multiline: true }),
      techniqueDetail: text(PROJECT_LIMITS.techniqueDetail),
      minimum: text(PROJECT_LIMITS.minimum),
      colors: text(PROJECT_LIMITS.colors),
      delivery: text(PROJECT_LIMITS.delivery),
      imageUrl: z
        .string()
        .max(2048)
        .refine((v) => v === '' || isEncargoImageUrl(v, host), { message: 'image_url' })
        .transform((v) => (v === '' ? null : v)),
      imageAlt: projectAlt,
      visible: z.boolean(),
    })
    .superRefine((v, ctx) => {
      if (v.imageUrl && v.imageAlt.length < 3) ctx.addIssue({ code: 'custom', path: ['imageAlt'], message: 'alt_required' });
    });
}
export type ProjectValues = z.output<ReturnType<typeof projectSchema>>;

export const projectIdSchema = z.uuid();
