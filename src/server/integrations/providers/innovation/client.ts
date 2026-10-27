import 'server-only';
import type { Env } from '@/server/env';
import { IntegrationError } from '../../core/errors';
import type { CallOptions, HttpClient } from '../../core/types';
import { AUTH_HEADER, ENDPOINTS, INNOVATION_ALLOWED_HOSTS, PAGE_LIMIT, RETRIES, TIMEOUTS_MS } from './constants';
import {
  colorsEnvelopeSchema,
  productSchema,
  productsEnvelopeSchema,
  stockEnvelopeSchema,
  stockProductSchema,
  type InnovationProduct,
  type InnovationStockProduct,
  type KeyResponse,
} from './schemas';

export type InnovationColors = { tones: { name: string; rgb: string }[] };
export type InnovationStockList = { products: InnovationStockProduct[]; rejected: number };
export type InnovationProductsPage = { page: number; totalPages: number; products: InnovationProduct[]; rejected: number };

export type InnovationClient = {
  getColors(): Promise<InnovationColors>;
  getStockList(): Promise<InnovationStockList>;
  getProductsPage(page: number): Promise<InnovationProductsPage>;
};

const PROVIDER = { name: 'innovation', allowedHosts: INNOVATION_ALLOWED_HOSTS };

/** The supplier answers HTTP 200 with a status block inside the body; anything but a valid, active key is an auth failure. */
function assertKeyAccepted(body: { respuesta_llave?: KeyResponse['respuesta_llave'] }, required: boolean): void {
  if (!body.respuesta_llave && !required) return;
  const r = body.respuesta_llave?.response;
  if (!r) throw new IntegrationError('auth', 'supplier response has no key status', { provider: 'innovation' });
  if (r.Correct_Datos !== true || r.Activo === false) {
    throw new IntegrationError('auth', 'supplier rejected the credentials', { provider: 'innovation' });
  }
}

function isAuthFailure(err: unknown): boolean {
  return err instanceof IntegrationError && (err.kind === 'auth' || (err.kind === 'http' && (err.status === 401 || err.status === 403)));
}

function pickRows<T>(rows: unknown[], parse: (row: unknown) => T | null): { rows: T[]; rejected: number } {
  const out: T[] = [];
  let rejected = 0;
  for (const row of rows) {
    const parsed = parse(row);
    if (parsed) out.push(parsed);
    else rejected++;
  }
  return { rows: out, rejected };
}

export function createInnovationClient(deps: { http: HttpClient; env: Env }): InnovationClient {
  const cfg = deps.env.integrations.innovation;

  function buildUrl(base: string, extra: Record<string, string> = {}): string {
    const url = new URL(base);
    url.searchParams.set('User', cfg.user ?? '');
    url.searchParams.set('Clave', cfg.password ?? '');
    for (const [k, v] of Object.entries(extra)) url.searchParams.set(k, v);
    return url.href;
  }

  /** GET with the primary key; on an auth failure retries once with the rotation key, if one is set. */
  async function call<T extends { respuesta_llave?: KeyResponse['respuesta_llave'] }>(
    options: Omit<CallOptions<T>, 'provider' | 'method' | 'headers'>,
    keyRequired = true,
  ): Promise<T> {
    if (!cfg.enabled || !cfg.apiKey || !cfg.user || !cfg.password) {
      throw new IntegrationError('config', 'innovation provider is not configured', { provider: 'innovation' });
    }
    const keys = [cfg.apiKey, ...(cfg.apiKeyNext ? [cfg.apiKeyNext] : [])];
    let lastError: unknown;
    for (const key of keys) {
      try {
        const body = await deps.http.request<T>({ ...options, provider: PROVIDER, method: 'GET', headers: { [AUTH_HEADER]: key } });
        assertKeyAccepted(body, keyRequired);
        return body;
      } catch (err) {
        lastError = err;
        if (!isAuthFailure(err)) throw err;
      }
    }
    throw lastError;
  }

  return {
    async getColors() {
      const body = await call({
        url: buildUrl(ENDPOINTS.colors),
        schema: colorsEnvelopeSchema,
        timeoutMs: TIMEOUTS_MS.colors,
        retries: RETRIES.colors,
      });
      const tones = body.colores.flatMap((c) => c.Tonos).flatMap((t) => (t.Nombre && t.RGB ? [{ name: t.Nombre, rgb: t.RGB }] : []));
      return { tones };
    },
    async getStockList() {
      const body = await call({
        url: buildUrl(ENDPOINTS.stock),
        schema: stockEnvelopeSchema,
        timeoutMs: TIMEOUTS_MS.stock,
        retries: RETRIES.stock,
      });
      const { rows, rejected } = pickRows(body.productos, (row) => {
        const r = stockProductSchema.safeParse(row);
        return r.success ? r.data : null;
      });
      return { products: rows, rejected };
    },
    async getProductsPage(page) {
      if (!Number.isInteger(page) || page < 1) throw new IntegrationError('config', 'invalid page', { provider: 'innovation' });
      const body = await call({
        url: buildUrl(ENDPOINTS.products, { page: String(page), limit: String(PAGE_LIMIT) }),
        schema: productsEnvelopeSchema,
        timeoutMs: TIMEOUTS_MS.products,
        retries: RETRIES.products,
      }, false);
      const { rows, rejected } = pickRows(body.productos, (row) => {
        const r = productSchema.safeParse(row);
        return r.success ? r.data : null;
      });
      return { page, totalPages: body.paginas_totales ?? 1, products: rows, rejected };
    },
  };
}
