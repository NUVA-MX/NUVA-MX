// The Promocionales carousel section: 8 fixed photo slots, each `{ url, alt }` (see equipos.slides).
import { z } from 'zod';
import { PROMO_CAROUSEL_SLOTS } from '@/content/promo-carousel';
import type { FieldSpec, ImageFieldSpec } from './encargo-spec-types';

type Img = { url: string; alt: string };
type Raw = Record<string, string>;

const range = Array.from({ length: PROMO_CAROUSEL_SLOTS }, (_, i) => i);

/** Strict section schema: `slides` is an array of up to 8 nullable images (null = use the default). */
export function promoCarouselSchema<T extends z.ZodType>(image: T) {
  return z.strictObject({ slides: z.array(image.nullable()).max(PROMO_CAROUSEL_SLOTS).optional() });
}

export const PROMO_CAROUSEL_RESTORE_PATHS = range.map((i) => `slides.${i}`);
export const PROMO_CAROUSEL_FIELD_NAMES = range.flatMap((i) => [`slides.${i}.url`, `slides.${i}.alt`]);

/** Override candidate from the raw form strings: blank url = no override; trailing blanks are dropped. */
export function buildPromoCarouselCandidate(raw: Raw): Record<string, unknown> {
  const slides: (Img | null)[] = range.map((i) => {
    const url = raw[`slides.${i}.url`]?.trim();
    return url ? { url, alt: raw[`slides.${i}.alt`] ?? '' } : null;
  });
  while (slides.length && slides[slides.length - 1] === null) slides.pop();
  return slides.length ? { slides } : {};
}

/** Admin fields: one image field per slot. */
export function promoCarouselFields(
  overrides: readonly (Img | null)[] | undefined,
  label: (n: number) => string,
  ratio: string,
): FieldSpec[] {
  return range.map((i): ImageFieldSpec => {
    const ov = overrides?.[i];
    return {
      kind: 'image',
      name: `slides.${i}`,
      label: label(i + 1),
      url: ov?.url ?? '',
      alt: ov?.alt ?? '',
      overridden: Boolean(ov),
      restore: `slides.${i}`,
      ratio,
    };
  });
}
