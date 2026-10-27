import { describe, expect, it, vi } from 'vitest';
import { parseEnv, type Env } from '@/server/env';
import { createLogger, setLogSink } from '@/server/log/logger';
import { createHttpClient } from '../../../core/http-client';
import { IntegrationError } from '../../../core/errors';
import { createInnovationClient } from '../client';
import { ENDPOINTS, INNOVATION_ALLOWED_HOSTS } from '../constants';
import { innovationProvider } from '../index';
import realColors from './real-colors.json';
import realLight from './real-light.json';
import realProducts from './real-products.json';

const TOKEN = 'dummy-token-abcdef';
const NEXT = 'dummy-next-abcdef';
const USER = 'dummy@example.mx';
const CLAVE = 'dummy-clave-1';
const KEY_OK = { respuesta_llave: { status: 'success', response: { Activo: true, Correct_Datos: true } } };

function envWith(extra: Record<string, string> = {}): Env {
  const r = parseEnv({
    INTEGRATION_INNOVATION_ENABLED: 'true',
    INTEGRATION_INNOVATION_API_KEY: TOKEN,
    INTEGRATION_INNOVATION_USER: USER,
    INTEGRATION_INNOVATION_PASSWORD: CLAVE,
    VERCEL_ENV: 'preview',
    ...extra,
  });
  if (!r.ok) throw new Error(r.errors.join());
  return r.env;
}

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
const httpWith = (fetchImpl: unknown, audit = async () => {}) =>
  createHttpClient({ fetchImpl: fetchImpl as typeof fetch, audit, sleep: async () => {} });

describe('innovation client', () => {
  it('allows exactly the three supplier gateway hosts', () => {
    expect([...INNOVATION_ALLOWED_HOSTS].sort()).toEqual(
      [
        '1x4nyx8c80.execute-api.us-east-1.amazonaws.com',
        '4vumtdis3m.execute-api.us-east-1.amazonaws.com',
        '9w2n2yr7u1.execute-api.us-east-1.amazonaws.com',
      ].sort(),
    );
    expect(Object.values(ENDPOINTS).every((u) => INNOVATION_ALLOWED_HOSTS.includes(new URL(u).host))).toBe(true);
  });

  it('refuses off-list and http URLs through the http-client', async () => {
    const fetchImpl = vi.fn();
    const http = httpWith(fetchImpl);
    const provider = { name: 'innovation', allowedHosts: INNOVATION_ALLOWED_HOSTS };
    const schema = { safeParse: () => ({ success: true as const, data: null }) } as never;
    for (const url of ['https://evil.example/x', 'http://4vumtdis3m.execute-api.us-east-1.amazonaws.com/x']) {
      await expect(http.request({ provider, method: 'GET', url, schema })).rejects.toMatchObject({ kind: 'allowlist' });
    }
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('sends the token as a header and User/Clave as query, and parses a product page row by row', async () => {
    const fetchImpl = vi.fn(async () =>
      json({
        ...KEY_OK,
        paginas_totales: 3,
        productos: [{ Codigo: 'TH-239', Nombre: 'X', UniqueID: 'secret-id', Variantes: [{ 'Codigo Variante': 'TH-239A', Tono: 'AZUL' }, 'bad'] }, 'not-an-object'],
      }),
    );
    const client = createInnovationClient({ http: httpWith(fetchImpl), env: envWith() });
    const page = await client.getProductsPage(2);
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    const u = new URL(url);
    expect(u.host).toBe('4vumtdis3m.execute-api.us-east-1.amazonaws.com');
    expect(u.searchParams.get('User')).toBe(USER);
    expect(u.searchParams.get('Clave')).toBe(CLAVE);
    expect(u.searchParams.get('page')).toBe('2');
    expect(u.searchParams.get('limit')).toBe('100');
    expect((init.headers as Record<string, string>)['auth-token']).toBe(TOKEN);
    expect(page).toMatchObject({ page: 2, totalPages: 3, rejected: 1 });
    expect(page.products[0].Variantes).toHaveLength(1);
    expect(JSON.stringify(page)).not.toContain('secret-id');
  });

  it('reads colors and the stock list', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(json({ ...KEY_OK, colores: [{ Color: 'AZUL', Tonos: [{ Nombre: 'AZUL', RGB: ' #006CBA' }, { Nombre: 'X' }] }] }))
      .mockResolvedValueOnce(json({ ...KEY_OK, productos: [{ Codigo: 'BE-018', Stock: '14683', Variantes: [{ 'Codigo Variante': 'BE-018RS', Stock: '3584' }] }] }));
    const client = createInnovationClient({ http: httpWith(fetchImpl), env: envWith() });
    expect((await client.getColors()).tones).toEqual([{ name: 'AZUL', rgb: ' #006CBA' }]);
    expect((await client.getStockList()).products[0].Variantes[0].Stock).toBe('3584');
  });

  it('parses the real response shapes (products have no respuesta_llave)', async () => {
    expect('respuesta_llave' in realProducts).toBe(false);
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(json(realColors))
      .mockResolvedValueOnce(json(realLight))
      .mockResolvedValueOnce(json(realProducts));
    const client = createInnovationClient({ http: httpWith(fetchImpl), env: envWith() });
    const colors = await client.getColors();
    expect(colors.tones.length).toBeGreaterThan(0);
    const stock = await client.getStockList();
    expect(stock).toMatchObject({ rejected: 0 });
    expect(stock.products[0].Stock).toBe(realLight.productos[0].Stock);
    const page = await client.getProductsPage(1);
    expect(page).toMatchObject({ totalPages: 73, rejected: 0 });
    expect(page.products).toHaveLength(3);
    expect(page.products[0].Precio).toBe(realProducts.productos[0].Precio);
    expect(JSON.stringify(page)).not.toContain('UniqueID');
  });

  it('a products response that does carry a rejecting key block is still an auth failure', async () => {
    const body = { productos: [], respuesta_llave: { response: { Correct_Datos: false } } };
    const client = createInnovationClient({ http: httpWith(vi.fn(async () => json(body))), env: envWith() });
    await expect(client.getProductsPage(1)).rejects.toMatchObject({ kind: 'auth' });
  });

  it('treats Correct_Datos:false as an auth failure and retries once with the rotation key', async () => {
    const bad = json({ respuesta_llave: { response: { Activo: true, Correct_Datos: false } } });
    const fetchImpl = vi.fn().mockResolvedValueOnce(bad).mockResolvedValueOnce(json({ ...KEY_OK, colores: [] }));
    const client = createInnovationClient({ http: httpWith(fetchImpl), env: envWith({ INTEGRATION_INNOVATION_API_KEY_NEXT: NEXT }) });
    await expect(client.getColors()).resolves.toEqual({ tones: [] });
    const used = fetchImpl.mock.calls.map((c) => ((c as unknown as [string, RequestInit])[1].headers as Record<string, string>)['auth-token']);
    expect(used).toEqual([TOKEN, NEXT]);
  });

  it('fails with an auth error when no key works, and on a wrong shape or non-JSON', async () => {
    const bad = () => json({ respuesta_llave: { response: { Correct_Datos: false } } });
    const client = createInnovationClient({ http: httpWith(vi.fn(async () => bad())), env: envWith() });
    await expect(client.getColors()).rejects.toMatchObject({ kind: 'auth' });
    const text = createInnovationClient({ http: httpWith(vi.fn(async () => new Response('<html>'))), env: envWith() });
    await expect(text.getColors()).rejects.toMatchObject({ kind: 'parse' });
    const shape = createInnovationClient({ http: httpWith(vi.fn(async () => json({ hello: 1 }))), env: envWith() });
    await expect(shape.getColors()).rejects.toBeInstanceOf(IntegrationError);
  });

  it('never logs or audits the token, user or clave when the network fails', async () => {
    const lines: string[] = [];
    setLogSink((line) => lines.push(line));
    const audits: unknown[] = [];
    const fetchImpl = vi.fn(async () => {
      throw new TypeError(`fetch failed for ${ENDPOINTS.colors}?User=${USER}&Clave=${CLAVE}`);
    });
    const http = createHttpClient({
      fetchImpl: fetchImpl as unknown as typeof fetch,
      audit: async (e) => void audits.push(e),
      log: createLogger(),
      sleep: async () => {},
    });
    await expect(createInnovationClient({ http, env: envWith() }).getColors()).rejects.toMatchObject({ kind: 'http' });
    setLogSink(null);
    const dump = JSON.stringify([lines, audits]);
    for (const secret of [TOKEN, USER, CLAVE]) expect(dump).not.toContain(secret);
  });

  it('is enabled only with key, user and password', () => {
    expect(innovationProvider.isEnabled(envWith())).toBe(true);
    const off = parseEnv({});
    if (!off.ok) throw new Error();
    expect(innovationProvider.isEnabled(off.env)).toBe(false);
    expect(innovationProvider.webhook).toBeUndefined();
  });
});
