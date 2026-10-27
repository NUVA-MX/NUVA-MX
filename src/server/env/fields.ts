import 'server-only';
import { z } from 'zod';

export const SECRET_MIN = 32;

/** Blank or whitespace-only values count as unset. */
export const opt = z.preprocess(
  (v) => (typeof v === 'string' && v.trim() !== '' ? v.trim() : undefined),
  z.string().optional(),
);

/** Optional "true" | "false" | "1" | "0" flag. */
export const optFlag = opt.refine((v) => v === undefined || ['true', 'false', '1', '0'].includes(v.toLowerCase()), {
  message: 'must be true or false',
});

/** Optional secret with a minimum length. */
export const optSecret = opt.refine((v) => v === undefined || v.length >= SECRET_MIN, {
  message: `must be at least ${SECRET_MIN} characters`,
});

export function isTrue(value: string | undefined): boolean {
  return ['true', '1'].includes((value ?? '').toLowerCase());
}

/** Production = Vercel production, or (off Vercel) NODE_ENV=production. Preview deployments are not production. */
export function isProductionEnv(vars: { VERCEL_ENV?: string; NODE_ENV?: string }): boolean {
  return vars.VERCEL_ENV === 'production' || (vars.VERCEL_ENV === undefined && vars.NODE_ENV === 'production');
}
