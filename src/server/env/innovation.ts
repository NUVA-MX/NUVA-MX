import 'server-only';
import { isProductionEnv, isTrue, opt, optFlag, optSecret, SECRET_MIN } from './fields';

export type InnovationEnv = {
  enabled: boolean;
  apiKey?: string;
  apiKeyNext?: string;
  user?: string;
  password?: string;
  /** When false the public catalog routes answer { enabled: false } (kill switch for the public section). */
  catalogPublic: boolean;
  /** Skip the supplier query-window guard. Never allowed in production. */
  ignoreWindow: boolean;
};

export const innovationShape = {
  INTEGRATION_INNOVATION_ENABLED: optFlag,
  INTEGRATION_INNOVATION_API_KEY: opt,
  INTEGRATION_INNOVATION_API_KEY_NEXT: opt,
  INTEGRATION_INNOVATION_USER: opt,
  INTEGRATION_INNOVATION_PASSWORD: opt,
  INTEGRATION_INNOVATION_CATALOG_PUBLIC: optFlag,
  INTEGRATION_INNOVATION_IGNORE_WINDOW: optFlag,
  CRON_SECRET: optSecret,
};

type Vars = Partial<Record<keyof typeof innovationShape | 'VERCEL_ENV' | 'NODE_ENV', string>>;

/** Supplier catalog provider. Names only in errors, never values. */
export function parseInnovationEnv(v: Vars, errors: string[]): { innovation: InnovationEnv; cronSecret?: string } {
  const enabled = isTrue(v.INTEGRATION_INNOVATION_ENABLED);
  const ignoreWindow = isTrue(v.INTEGRATION_INNOVATION_IGNORE_WINDOW);
  const production = isProductionEnv(v);
  const flag = v.INTEGRATION_INNOVATION_CATALOG_PUBLIC;
  if (ignoreWindow && production) {
    errors.push('INTEGRATION_INNOVATION_IGNORE_WINDOW: cannot be enabled in production');
  }
  if (enabled) {
    const need = ['API_KEY', 'USER', 'PASSWORD'] as const;
    for (const name of need) {
      if (!v[`INTEGRATION_INNOVATION_${name}`]) {
        errors.push(`INTEGRATION_INNOVATION_${name}: required when INTEGRATION_INNOVATION_ENABLED is true`);
      }
    }
    if (production && !v.CRON_SECRET) {
      errors.push(`CRON_SECRET: required (min ${SECRET_MIN} characters) when INTEGRATION_INNOVATION_ENABLED is true in production`);
    }
  }
  return {
    cronSecret: v.CRON_SECRET,
    innovation: {
      enabled,
      apiKey: v.INTEGRATION_INNOVATION_API_KEY,
      apiKeyNext: v.INTEGRATION_INNOVATION_API_KEY_NEXT,
      user: v.INTEGRATION_INNOVATION_USER,
      password: v.INTEGRATION_INNOVATION_PASSWORD,
      catalogPublic: flag === undefined ? true : isTrue(flag),
      ignoreWindow,
    },
  };
}
