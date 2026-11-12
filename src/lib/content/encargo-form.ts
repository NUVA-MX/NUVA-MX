// Pure helpers for the content admin forms: explicit, allowlisted FormData reads (never Object.fromEntries),
// candidate building, default pruning, path removal, diffs and zod-issue -> field-error mapping.
import { buildPromoCarouselCandidate, PROMO_CAROUSEL_FIELD_NAMES } from './encargo-promo-carousel';
import { PROJECT_FORM_FIELDS } from './encargo-project-schema';
import type { SectionKey } from './encargo-schema';

export { issuesToErrors } from './encargo-form-errors';
export { diffPaths } from './encargo-diff';

/** Shared result of every content/project action. */
export type EncargoActionState = {
  ok?: boolean;
  /** Form-level error message. */
  error?: string;
  /** Field errors keyed by form field name (e.g. `images.0.alt`). */
  errors?: Record<string, string>;
  /** Submitted values, echoed back so the form keeps them after a validation error. */
  values?: Record<string, string>;
};

const range = (n: number) => Array.from({ length: n }, (_, i) => i);
const imageNames = (p: string) => [`${p}.url`, `${p}.alt`];

/** The only form field names each section reads. Anything else in the FormData is ignored. */
export const SECTION_FIELD_NAMES: Record<SectionKey, readonly string[]> = {
  announcement: ['text'],
  hero: ['title', ...imageNames('image')],
  marquee: ['enabled', 'text', 'startsOn', 'endsOn'],
  queHacemos: ['eyebrow', 'title', 'body', ...range(3).flatMap((i) => imageNames(`images.${i}`))],
  tecnicas: [
    'eyebrow',
    'title',
    ...range(4).flatMap((i) => [`items.${i}.name`, `items.${i}.fact`, ...imageNames(`items.${i}.image`)]),
  ],
  projectsIntro: ['eyebrow', 'title', 'lead'],
  equipos: ['eyebrow', 'title', 'lines.0', 'lines.1', ...range(4).flatMap((i) => imageNames(`slides.${i}`))],
  taller: [
    'eyebrow',
    'title',
    'paragraph',
    ...imageNames('image'),
    ...imageNames('image2'),
    ...range(3).flatMap((i) => [`stats.${i}.value`, `stats.${i}.label`]),
  ],
  proceso: ['ctaImage.url'],
  promoCarousel: PROMO_CAROUSEL_FIELD_NAMES,
  crossLink: ['eyebrow', 'title', 'body', ...imageNames('image')],
  whatsapp: ['projectOrder', 'bulkQuote', 'teamQuote'],
};

const RAW_MAX = 2600;

function readFields(names: readonly string[], formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const name of names) {
    const v = formData.get(name);
    out[name] = typeof v === 'string' ? v.slice(0, RAW_MAX) : '';
  }
  return out;
}

/** Reads exactly the allowlisted fields of a section. */
export function readSectionRaw(section: SectionKey, formData: FormData): Record<string, string> {
  return readFields(SECTION_FIELD_NAMES[section], formData);
}

type Obj = Record<string, unknown>;

const text = (raw: Record<string, string>, k: string): string | undefined => {
  const v = raw[k];
  return v === undefined || v.trim() === '' ? undefined : v;
};

const image = (raw: Record<string, string>, p: string): { url: string; alt: string } | undefined => {
  const url = raw[`${p}.url`]?.trim();
  return url ? { url, alt: raw[`${p}.alt`] ?? '' } : undefined;
};

const compactObj = (o: Obj): Obj | undefined => {
  const out: Obj = {};
  for (const [k, v] of Object.entries(o)) if (v !== undefined) out[k] = v;
  return Object.keys(out).length ? out : undefined;
};

/** n slots: each slot is an override or null ("use the default"); trailing nulls are dropped. */
function slots<T>(n: number, read: (i: number) => T | undefined): (T | null)[] | undefined {
  const a = range(n).map((i) => read(i) ?? null);
  while (a.length && a[a.length - 1] === null) a.pop();
  return a.length ? a : undefined;
}

/** Override-shaped candidate from the raw strings (blank = no override). Validated afterwards by zod. */
export function buildSectionCandidate(section: SectionKey, raw: Record<string, string>): Obj {
  const t = (k: string) => text(raw, k);
  const strip = (o: Obj) => compactObj(o) ?? {};
  switch (section) {
    case 'announcement':
      return strip({ text: t('text') });
    case 'hero':
      return strip({ title: t('title'), image: image(raw, 'image') });
    case 'marquee':
      return strip({
        enabled: raw.enabled === 'on',
        text: t('text'),
        startsOn: t('startsOn')?.trim(),
        endsOn: t('endsOn')?.trim(),
      });
    case 'queHacemos':
      return strip({
        eyebrow: t('eyebrow'),
        title: t('title'),
        body: t('body'),
        images: slots(3, (i) => image(raw, `images.${i}`)),
      });
    case 'tecnicas':
      return strip({
        eyebrow: t('eyebrow'),
        title: t('title'),
        items: slots(4, (i) =>
          compactObj({
            name: t(`items.${i}.name`),
            fact: t(`items.${i}.fact`),
            image: image(raw, `items.${i}.image`),
          }),
        ),
      });
    case 'projectsIntro':
      return strip({ eyebrow: t('eyebrow'), title: t('title'), lead: t('lead') });
    case 'equipos':
      return strip({
        eyebrow: t('eyebrow'),
        title: t('title'),
        lines: slots(2, (i) => t(`lines.${i}`)),
        slides: slots(4, (i) => image(raw, `slides.${i}`)),
      });
    case 'taller':
      return strip({
        eyebrow: t('eyebrow'),
        title: t('title'),
        paragraph: t('paragraph'),
        image: image(raw, 'image'),
        image2: image(raw, 'image2'),
        stats: slots(3, (i) => compactObj({ value: t(`stats.${i}.value`), label: t(`stats.${i}.label`) })),
      });
    case 'proceso': {
      const url = raw['ctaImage.url']?.trim();
      return strip({ ctaImage: url ? { url } : undefined });
    }
    case 'promoCarousel':
      return buildPromoCarouselCandidate(raw);
    case 'crossLink':
      return strip({ eyebrow: t('eyebrow'), title: t('title'), body: t('body'), image: image(raw, 'image') });
    case 'whatsapp':
      return strip({ projectOrder: t('projectOrder'), bulkQuote: t('bulkQuote'), teamQuote: t('teamQuote') });
  }
}

/** Project form: exactly the editable fields (plus the visible checkbox). `id` is read separately. */
export function readProjectRaw(formData: FormData): Record<string, string> {
  const names = PROJECT_FORM_FIELDS.filter((n) => n !== 'visible');
  const raw = readFields(names, formData);
  raw.visible = formData.get('visible') === 'on' ? 'on' : '';
  return raw;
}

export function buildProjectCandidate(raw: Record<string, string>): Obj {
  const out: Obj = {};
  for (const n of PROJECT_FORM_FIELDS) {
    if (n === 'visible') out.visible = raw.visible === 'on';
    else out[n] = raw[n] ?? '';
  }
  return out;
}

// ---- Defaults, restore, diff ----------------------------------------------------------------------------

/** Empty objects/arrays collapse; arrays lose trailing nulls; nested empties become null in arrays. */
export function compact(v: unknown): unknown {
  if (Array.isArray(v)) {
    const a = v.map((el) => (el === null || el === undefined ? null : (compact(el) ?? null)));
    while (a.length && a[a.length - 1] === null) a.pop();
    return a.length ? a : undefined;
  }
  if (v && typeof v === 'object') {
    const out: Obj = {};
    for (const [k, val] of Object.entries(v as Obj)) {
      const c = compact(val);
      if (c !== undefined) out[k] = c;
    }
    return Object.keys(out).length ? out : undefined;
  }
  return v;
}

/** Drops every value equal to its default so only true overrides are stored. Returns undefined when nothing remains. */
export function pruneDefaults(v: unknown, d: unknown): unknown {
  if (Array.isArray(v)) {
    const dArr = Array.isArray(d) ? d : [];
    return compact(v.map((el, i) => (el === null ? null : pruneDefaults(el, dArr[i]))));
  }
  if (v && typeof v === 'object') {
    const dObj = d && typeof d === 'object' && !Array.isArray(d) ? (d as Obj) : {};
    const out: Obj = {};
    for (const [k, val] of Object.entries(v as Obj)) {
      const r = pruneDefaults(val, dObj[k]);
      if (r !== undefined) out[k] = r;
    }
    return Object.keys(out).length ? out : undefined;
  }
  return v === d ? undefined : v;
}

function removeAt(node: unknown, parts: string[]): unknown {
  const [head, ...rest] = parts;
  if (Array.isArray(node)) {
    const copy = [...node];
    const i = Number(head);
    if (!Number.isInteger(i) || i < 0 || i >= copy.length) return node;
    copy[i] = rest.length === 0 || copy[i] === null ? null : removeAt(copy[i], rest);
    return copy;
  }
  if (node && typeof node === 'object') {
    const copy: Obj = { ...(node as Obj) };
    if (!Object.prototype.hasOwnProperty.call(copy, head)) return node;
    if (rest.length === 0) delete copy[head];
    else copy[head] = removeAt(copy[head], rest);
    return copy;
  }
  return node;
}

/** Removes one override path (`title`, `images.1`, `items.0.image`, ...). The path must already be allowlisted. */
export function removeOverridePath(section: unknown, path: string): unknown {
  return compact(removeAt(section, path.split('.')));
}
