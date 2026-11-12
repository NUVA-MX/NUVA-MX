import { z } from 'zod';
import { isEncargoImageUrl } from './encargo-schema';
import { PROJECT_LIMITS, PROJECT_TECHNIQUES } from './limits';
import { plainText } from './text';

const text = (max: number, opts?: { multiline?: boolean }) => plainText(1, max, opts);

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
