// Pure description of the admin form for each section (labels, current values, defaults, restore paths).
// The admin page builds it on the server; the client form just renders it.
import { adminEncargo as copy } from '@/content/admin-encargo';
import { fillTemplate } from '@/lib/format';
import { marqueeAt, type EncargoDefaults, type PromoWindow } from './encargo-merge';
import { SECTION_KEYS, type EncargoOverrides, type SectionKey } from './encargo-schema';
import { TEXT_LIMITS } from './limits';
import { mxDayEndUtc, mxDayStartUtc } from './mx-date';

export type TextFieldSpec = {
  kind: 'text' | 'textarea' | 'date';
  name: string;
  label: string;
  /** What the input shows: the override, or the default when not overridden. */
  value: string;
  /** Default shown in the "Predeterminado" hint; null when there is no text default (promo fields). */
  defaultValue: string | null;
  overridden: boolean;
  /** Path for the restore action. */
  restore: string;
  maxLength: number;
  hint?: string;
};
export type CheckboxFieldSpec = { kind: 'checkbox'; name: string; label: string; checked: boolean; overridden: boolean; restore: string };
export type ImageFieldSpec = {
  kind: 'image';
  /** Prefix of the form fields: `<name>.url` and `<name>.alt`. */
  name: string;
  label: string;
  url: string;
  alt: string;
  overridden: boolean;
  restore: string;
  ratio: string;
};
export type HeadingSpec = { kind: 'heading'; label: string };
export type FieldSpec = TextFieldSpec | CheckboxFieldSpec | ImageFieldSpec | HeadingSpec;

export type SectionSpec = {
  key: SectionKey;
  title: string;
  fields: FieldSpec[];
  notes: string[];
  /** True when the section has any stored override (enables "Restaurar sección"). */
  overridden: boolean;
};

type Img = { url: string; alt: string } | null | undefined;

const text = (
  name: string,
  label: string,
  current: string | undefined,
  def: string,
  max: number,
  kind: 'text' | 'textarea' = 'text',
  restore = name,
): TextFieldSpec => ({ kind, name, label, value: current ?? def, defaultValue: def, overridden: current !== undefined, restore, maxLength: max });

const image = (name: string, label: string, ov: Img, ratio: string): ImageFieldSpec => ({
  kind: 'image',
  name,
  label,
  url: ov?.url ?? '',
  alt: ov?.alt ?? '',
  overridden: Boolean(ov),
  restore: name,
  ratio,
});

const n = (i: number) => ({ n: i + 1 });

export function buildSectionSpecs(d: EncargoDefaults, o: EncargoOverrides, now: Date): SectionSpec[] {
  const s = copy.sections;
  const r = copy.image.ratios;
  const L = TEXT_LIMITS;
  const eyebrowTitle = (sec: { eyebrow?: string; title?: string } | undefined, e: string, t: string): FieldSpec[] => [
    text('eyebrow', s.queHacemos.fields.eyebrow, sec?.eyebrow, e, L.eyebrow),
    text('title', s.queHacemos.fields.title, sec?.title, t, L.title),
  ];

  const build = (key: SectionKey): Omit<SectionSpec, 'key' | 'title' | 'overridden'> => {
    switch (key) {
      case 'announcement':
        return { fields: [text('text', s.announcement.fields.text, o.announcement?.text, d.announcement, L.announcement)], notes: [] };
      case 'hero':
        return {
          fields: [
            text('title', s.hero.fields.title, o.hero?.title, d.hero.title, L.title),
            image('image', s.hero.fields.image, o.hero?.image, r.hero),
          ],
          notes: [],
        };
      case 'marquee': {
        const m = o.marquee;
        const window: PromoWindow | null =
          m?.enabled && m.text
            ? { text: m.text, startsAt: m.startsOn ? mxDayStartUtc(m.startsOn) : null, endsAt: m.endsOn ? mxDayEndUtc(m.endsOn) : null }
            : null;
        const state = marqueeAt(d.marquee, window, now);
        const status = !window
          ? s.marquee.status.off
          : state.isPromo
            ? s.marquee.status.active
            : state.nextBoundary
              ? s.marquee.status.scheduled
              : s.marquee.status.ended;
        const f = s.marquee.fields;
        return {
          fields: [
            { kind: 'checkbox', name: 'enabled', label: f.enabled, checked: m?.enabled === true, overridden: m?.enabled !== undefined, restore: 'enabled' },
            { kind: 'text', name: 'text', label: f.text, value: m?.text ?? '', defaultValue: null, overridden: m?.text !== undefined, restore: 'text', maxLength: L.marqueeText },
            { kind: 'date', name: 'startsOn', label: f.startsOn, value: m?.startsOn ?? '', defaultValue: null, overridden: m?.startsOn !== undefined, restore: 'startsOn', maxLength: 10 },
            { kind: 'date', name: 'endsOn', label: f.endsOn, value: m?.endsOn ?? '', defaultValue: null, overridden: m?.endsOn !== undefined, restore: 'endsOn', maxLength: 10 },
          ],
          notes: [status, fillTemplate(s.marquee.defaultText, { text: d.marquee }), s.marquee.hint],
        };
      }
      case 'queHacemos': {
        const q = o.queHacemos;
        return {
          fields: [
            ...eyebrowTitle(q, d.queHacemos.eyebrow, d.queHacemos.title),
            text('body', s.queHacemos.fields.body, q?.body, d.queHacemos.body, L.body, 'textarea'),
            ...[r.square, r.portrait, r.portrait].map((ratio, i) =>
              image(`images.${i}`, s.queHacemos.images[i]!, q?.images?.[i], ratio),
            ),
          ],
          notes: [],
        };
      }
      case 'tecnicas': {
        const t = o.tecnicas;
        return {
          fields: [
            ...eyebrowTitle(t, d.tecnicas.eyebrow, d.tecnicas.title),
            ...d.tecnicas.items.flatMap((item, i): FieldSpec[] => {
              const ov = t?.items?.[i];
              const f = s.tecnicas.itemFields;
              return [
                { kind: 'heading', label: fillTemplate(s.tecnicas.item, n(i)) },
                text(`items.${i}.name`, f.name, ov?.name, item.name, L.techniqueName),
                text(`items.${i}.fact`, f.fact, ov?.fact, item.fact, L.fact),
                image(`items.${i}.image`, f.image, ov?.image, r.portrait),
              ];
            }),
          ],
          notes: [],
        };
      }
      case 'projectsIntro': {
        const p = o.projectsIntro;
        const f = s.projectsIntro.fields;
        return {
          fields: [
            text('eyebrow', f.eyebrow, p?.eyebrow, d.projects.eyebrow, L.eyebrow),
            text('title', f.title, p?.title, d.projects.title, L.title),
            text('lead', f.lead, p?.lead, d.projects.lead, L.body, 'textarea'),
          ],
          notes: [],
        };
      }
      case 'equipos': {
        const e = o.equipos;
        return {
          fields: [
            ...eyebrowTitle(e, d.equipos.eyebrow, d.equipos.title),
            ...d.equipos.lines.map((line, i) =>
              text(`lines.${i}`, fillTemplate(s.equipos.line, n(i)), e?.lines?.[i] ?? undefined, line, L.line),
            ),
            ...d.equipos.slides.map((_, i) => image(`slides.${i}`, fillTemplate(s.equipos.slide, n(i)), e?.slides?.[i], r.wide)),
          ],
          notes: [],
        };
      }
      case 'taller': {
        const t = o.taller;
        const f = s.taller.fields;
        return {
          fields: [
            text('eyebrow', f.eyebrow, t?.eyebrow, d.taller.eyebrow, L.eyebrow),
            text('title', f.title, t?.title, d.taller.title, L.title),
            text('paragraph', f.paragraph, t?.paragraph, d.taller.paragraph, L.body, 'textarea'),
            image('image', f.image, t?.image, r.portrait),
            ...d.taller.stats.flatMap((stat, i): FieldSpec[] => {
              const ov = t?.stats?.[i];
              return [
                { kind: 'heading', label: fillTemplate(s.taller.stat, n(i)) },
                text(`stats.${i}.value`, s.taller.statFields.value, ov?.value, stat.value, L.statValue),
                text(`stats.${i}.label`, s.taller.statFields.label, ov?.label, stat.label, L.statLabel),
              ];
            }),
          ],
          notes: [],
        };
      }
      case 'crossLink': {
        const x = o.crossLink;
        const f = s.crossLink.fields;
        return {
          fields: [
            text('eyebrow', f.eyebrow, x?.eyebrow, d.crossLink.eyebrow, L.eyebrow),
            text('title', f.title, x?.title, d.crossLink.title, L.title),
            text('body', f.body, x?.body, d.crossLink.body, L.body, 'textarea'),
            image('image', f.image, x?.image, r.fill),
          ],
          notes: [],
        };
      }
      case 'whatsapp': {
        const w = o.whatsapp;
        const f = s.whatsapp.fields;
        return {
          fields: [
            text('projectOrder', f.projectOrder, w?.projectOrder, d.projects.whatsappTemplate, L.template, 'textarea'),
            text('bulkQuote', f.bulkQuote, w?.bulkQuote, d.projects.quoteTemplate, L.template, 'textarea'),
            text('teamQuote', f.teamQuote, w?.teamQuote, d.equipos.ctaMessage, L.template, 'textarea'),
          ],
          notes: [s.whatsapp.hint],
        };
      }
    }
  };

  return SECTION_KEYS.map((key) => ({
    key,
    title: s[key].title,
    overridden: Object.keys(o[key] ?? {}).length > 0,
    ...build(key),
  }));
}
