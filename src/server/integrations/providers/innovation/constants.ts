import 'server-only';
import { PROVIDER_HOSTS } from '@/server/env';

export const INNOVATION_ALLOWED_HOSTS: readonly string[] = PROVIDER_HOSTS.innovation;

const [PRODUCTS_HOST, LIGHT_HOST, COLORS_HOST] = PROVIDER_HOSTS.innovation;

/** Fixed endpoint URLs (one gateway host per endpoint), so no environment value can redirect outbound calls. */
export const ENDPOINTS = {
  products: `https://${PRODUCTS_HOST}/default/Innovation_GetAllProductos`,
  stock: `https://${LIGHT_HOST}/default/Innovation_GetAll_ProducLight`,
  colors: `https://${COLORS_HOST}/default/Innovation_GetAllColores`,
} as const;

export const AUTH_HEADER = 'auth-token';
export const PAGE_LIMIT = 100;
/** The stock list took ~7.6 s in the samples, so it gets a longer timeout than the default 8 s. */
export const TIMEOUTS_MS = { colors: 12_000, stock: 25_000, products: 15_000 } as const;
export const RETRIES = { colors: 1, stock: 1, products: 1 } as const;
