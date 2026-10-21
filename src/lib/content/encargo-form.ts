// Pure helpers for the content admin forms: explicit, allowlisted FormData reads (never Object.fromEntries),
// candidate building, default pruning, path removal, diffs and zod-issue -> field-error mapping.
import { adminEncargo as copy } from '@/content/admin-encargo';
import { fillTemplate } from '@/lib/format';
import { PROJECT_FORM_FIELDS } from './encargo-schema';
import type { SectionKey } from './encargo-schema';

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
    ...range(3).flatMap((i) => [`stats.${i}.value`, `stats.${i}.label`]),
  ],
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
        stats: slots(3, (i) => compactObj({ value: t(`stats.${i}.value`), label: t(`stats.${i}.label`) })),
      });
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

function flatten(v: unknown, prefix: string, out: Map<string, string>) {
  if (Array.isArray(v)) {
    v.forEach((el, i) => flatten(el, prefix ? `${prefix}.${i}` : String(i), out));
  } else if (v && typeof v === 'object') {
    for (const [k, val] of Object.entries(v as Obj)) flatten(val, prefix ? `${prefix}.${k}` : k, out);
  } else if (v !== undefined && v !== null) {
    out.set(prefix, JSON.stringify(v));
  }
}

/** Leaf paths whose value changed (added, removed or different). Values themselves are never returned. */
export function diffPaths(before: unknown, after: unknown): string[] {
  const a = new Map<string, string>();
  const b = new Map<string, string>();
  flatten(before, '', a);
  flatten(after, '', b);
  const keys = new Set([...a.keys(), ...b.keys()]);
  return [...keys].filter((k) => a.get(k) !== b.get(k)).sort();
}

// ---- Errors ---------------------------------------------------------------------------------------------

type Issue = { code: string; path: PropertyKey[]; message: string; maximum?: unknown; minimum?: unknown };

/** One Spanish message per failing field (first issue wins), keyed by the form field name. */
export function issuesToErrors(issues: readonly Issue[]): Record<string, string> {
  const e = copy.errors;
  const out: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path.map(String).join('.') || 'form';
    if (out[key]) continue;
    let msg: string = e.generic;
    if (issue.message === 'image_url') msg = e.image;
    else if (issue.message === 'alt_required') msg = e.altRequired;
    else if (issue.message === 'template') msg = /teamQuote/.test(key) ? e.templateNone : e.template;
    else if (issue.message === 'date') msg = e.date;
    else if (issue.message === 'date_order') msg = e.dateOrder;
    else if (issue.message === 'marquee_text_required') msg = e.marqueeText;
    else if (issue.message === 'plain_text') msg = e.text;
    else if (issue.code === 'too_big') msg = fillTemplate(e.tooLong, { max: Number(issue.maximum) });
    else if (issue.code === 'too_small') msg = /\.alt$|^imageAlt$/.test(key) ? e.altRequired : e.required;
    else if (issue.code === 'invalid_value' && key === 'technique') msg = e.technique;
    out[key] = msg;
  }
  return out;
}
