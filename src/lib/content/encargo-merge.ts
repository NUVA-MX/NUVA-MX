// Pure merge logic: hard-coded defaults + stored overrides -> the content the page renders.
// No server imports: the marquee part also runs in the browser (PromoMarquee guard).
import type { encargo as defaultsConst } from '@/content/encargo';
import type { EncargoOverrides, SectionKey } from './encargo-schema';
import { mxDayEndUtc, mxDayStartUtc } from './mx-date';

type Widen<T> = T extends string
  ? string
  : T extends number
    ? number
    : T extends boolean
      ? boolean
      : T extends object
        ? { -readonly [K in keyof T]: Widen<T[K]> }
        : T;

export type EncargoDefaults = typeof defaultsConst;
/** Same shape as `encargo`, with literal types widened so values can be replaced. */
export type EncargoContent = Widen<EncargoDefaults>;

type ImageOverride = { url: string; alt: string };

function withImage<T extends { image: string | null; imageAlt: string }>(base: T, ov: ImageOverride | null | undefined): T {
  return ov ? { ...base, image: ov.url, imageAlt: ov.alt } : base;
}

/** Returns `base[i]` merged with `fn(ov[i])` for each index within the fixed length of `base`. */
function byIndex<T, O>(base: readonly T[], ov: readonly (O | null)[] | undefined, fn: (b: T, o: O) => T): T[] {
  return base.map((b, i) => {
    const o = ov?.[i];
    return o === null || o === undefined ? b : fn(b, o);
  });
}

/** Default values in the shape of each section override (used to drop overrides equal to the default). */
export function overrideDefaults(d: EncargoDefaults): { [K in SectionKey]: unknown } {
  return {
    announcement: { text: d.announcement },
    hero: { title: d.hero.title },
    marquee: { enabled: false },
    queHacemos: { eyebrow: d.queHacemos.eyebrow, title: d.queHacemos.title, body: d.queHacemos.body },
    tecnicas: {
      eyebrow: d.tecnicas.eyebrow,
      title: d.tecnicas.title,
      items: d.tecnicas.items.map((i) => ({ name: i.name, fact: i.fact })),
    },
    projectsIntro: { eyebrow: d.projects.eyebrow, title: d.projects.title, lead: d.projects.lead },
    equipos: { eyebrow: d.equipos.eyebrow, title: d.equipos.title, lines: [...d.equipos.lines] },
    taller: {
      eyebrow: d.taller.eyebrow,
      title: d.taller.title,
      paragraph: d.taller.paragraph,
      stats: d.taller.stats.map((s) => ({ value: s.value, label: s.label })),
    },
    crossLink: { eyebrow: d.crossLink.eyebrow, title: d.crossLink.title, body: d.crossLink.body },
    whatsapp: {
      projectOrder: d.projects.whatsappTemplate,
      bulkQuote: d.projects.quoteTemplate,
      teamQuote: d.equipos.ctaMessage,
    },
  };
}

/** Field-by-field merge. Arrays merge by index and only indexes within the fixed length count. */
export function resolveEncargo(d: EncargoDefaults, o: EncargoOverrides): EncargoContent {
  const c = structuredClone(d) as unknown as EncargoContent;
  if (o.announcement?.text) c.announcement = o.announcement.text;

  if (o.hero) {
    if (o.hero.title) c.hero.title = o.hero.title;
    c.hero = withImage(c.hero, o.hero.image);
  }

  if (o.queHacemos) {
    const q = o.queHacemos;
    if (q.eyebrow) c.queHacemos.eyebrow = q.eyebrow;
    if (q.title) c.queHacemos.title = q.title;
    if (q.body) c.queHacemos.body = q.body;
    c.queHacemos.images = byIndex(c.queHacemos.images, q.images, withImage) as typeof c.queHacemos.images;
  }

  if (o.tecnicas) {
    const t = o.tecnicas;
    if (t.eyebrow) c.tecnicas.eyebrow = t.eyebrow;
    if (t.title) c.tecnicas.title = t.title;
    c.tecnicas.items = byIndex(c.tecnicas.items, t.items, (b, item) => {
      const next = { ...b };
      if (item.name) next.name = item.name;
      if (item.fact) next.fact = item.fact;
      return withImage(next, item.image);
    }) as typeof c.tecnicas.items;
  }

  if (o.projectsIntro) {
    const p = o.projectsIntro;
    if (p.eyebrow) c.projects.eyebrow = p.eyebrow;
    if (p.title) c.projects.title = p.title;
    if (p.lead) c.projects.lead = p.lead;
  }

  if (o.equipos) {
    const e = o.equipos;
    if (e.eyebrow) c.equipos.eyebrow = e.eyebrow;
    if (e.title) c.equipos.title = e.title;
    c.equipos.lines = byIndex(c.equipos.lines, e.lines, (_b, line: string) => line) as typeof c.equipos.lines;
    c.equipos.slides = byIndex(c.equipos.slides, e.slides, withImage) as typeof c.equipos.slides;
  }

  if (o.taller) {
    const t = o.taller;
    if (t.eyebrow) c.taller.eyebrow = t.eyebrow;
    if (t.title) c.taller.title = t.title;
    if (t.paragraph) c.taller.paragraph = t.paragraph;
    c.taller = withImage(c.taller, t.image);
    c.taller.stats = byIndex(c.taller.stats, t.stats, (b, s) => ({
      value: s.value ?? b.value,
      label: s.label ?? b.label,
    }));
  }

  if (o.crossLink) {
    const x = o.crossLink;
    if (x.eyebrow) c.crossLink.eyebrow = x.eyebrow;
    if (x.title) c.crossLink.title = x.title;
    if (x.body) c.crossLink.body = x.body;
    c.crossLink = withImage(c.crossLink, x.image);
  }

  if (o.whatsapp) {
    if (o.whatsapp.projectOrder) c.projects.whatsappTemplate = o.whatsapp.projectOrder;
    if (o.whatsapp.bulkQuote) c.projects.quoteTemplate = o.whatsapp.bulkQuote;
    if (o.whatsapp.teamQuote) c.equipos.ctaMessage = o.whatsapp.teamQuote;
  }
  return c;
}

// ---- Marquee --------------------------------------------------------------------------------------------

/** A promo window as instants. `null` ends mean open-ended. `endsAt` is exclusive. */
export type PromoWindow = { text: string; startsAt: Date | null; endsAt: Date | null };

export type MarqueeState = {
  text: string;
  isPromo: boolean;
  /** Next instant at which `text` changes, or null when it never will. */
  nextBoundary: Date | null;
};

/** A promo that starts within this many ms is included in the page (so the client guard can switch on time). */
export const PROMO_LEAD_MS = 10 * 60 * 1000;

/** Text for `now`: the promo inside its window, the default text otherwise. */
export function marqueeAt(defaultText: string, promo: PromoWindow | null, now: Date): MarqueeState {
  if (!promo) return { text: defaultText, isPromo: false, nextBoundary: null };
  const t = now.getTime();
  const start = promo.startsAt?.getTime() ?? null;
  const end = promo.endsAt?.getTime() ?? null;
  if (start !== null && t < start) return { text: defaultText, isPromo: false, nextBoundary: promo.startsAt };
  if (end !== null && t >= end) return { text: defaultText, isPromo: false, nextBoundary: null };
  return { text: promo.text, isPromo: true, nextBoundary: promo.endsAt };
}

export type MarqueeResolution = MarqueeState & {
  /** Present only when active now or starting within PROMO_LEAD_MS: future promos never leak into the HTML. */
  promo: PromoWindow | null;
};

export function resolveMarquee(
  defaultText: string,
  override: { enabled?: boolean; text?: string; startsOn?: string; endsOn?: string } | undefined,
  now: Date,
): MarqueeResolution {
  if (!override?.enabled || !override.text) return { ...marqueeAt(defaultText, null, now), promo: null };
  const window: PromoWindow = {
    text: override.text,
    startsAt: override.startsOn ? mxDayStartUtc(override.startsOn) : null,
    endsAt: override.endsOn ? mxDayEndUtc(override.endsOn) : null,
  };
  const state = marqueeAt(defaultText, window, now);
  const t = now.getTime();
  const ended = window.endsAt !== null && t >= window.endsAt.getTime();
  const startsSoon = window.startsAt !== null && window.startsAt.getTime() - t <= PROMO_LEAD_MS;
  const include = !ended && (state.isPromo || startsSoon);
  return { ...state, promo: include ? window : null };
}
