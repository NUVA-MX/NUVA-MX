import { afterEach, describe, expect, it } from 'vitest';
import { createLogger, setLogLevel, setLogSink } from '../logger';
import { REDACTED, redact } from '../redact';

const BLOB = 'vercel_blob_rw_abc123XYZ_secretpart987654';
const PG = 'postgresql://admin:hunter2pass@ep-cool.neon.tech/db?sslmode=require';
const JWT = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0In0.c2lnbmF0dXJlX3ZhbHVl';
const API_KEY = 'sk_live_51HxAbCdEfGhIjKlMnOp';
const EMAIL = 'owner@nuva.mx';
const LIVE = 'live-secret-value-from-env-0001';

describe('redact', () => {
  it('masks by key name, deeply and in arrays', () => {
    const out = redact(
      { a: { password: 'x', nested: [{ apiKey: 'k', 'x-api-key': 'k2', Authorization: 'a', cookie: 'c', email: 'e', phone: '1' }] }, ok: 'fine' },
      { secretValues: [] },
    ) as { a: { password: string; nested: Record<string, string>[] }; ok: string };
    expect(out.a.password).toBe(REDACTED);
    for (const v of Object.values(out.a.nested[0])) expect(v).toBe(REDACTED);
    expect(out.ok).toBe('fine');
  });

  it('masks known patterns inside free text', () => {
    const text = `auth Bearer abc.def-ghi token ${BLOB} db ${PG} jwt ${JWT} mail ${EMAIL}`;
    const out = redact({ msg: text }, { secretValues: [] }) as { msg: string };
    for (const s of ['abc.def-ghi', BLOB, 'hunter2pass', JWT, EMAIL]) expect(out.msg).not.toContain(s);
  });

  it('masks live secret values under innocuous keys', () => {
    const out = redact({ note: `value=${LIVE}` }, { secretValues: [LIVE] }) as { note: string };
    expect(out.note).not.toContain(LIVE);
  });

  it('truncates long strings and handles cycles and errors', () => {
    const a: Record<string, unknown> = { long: 'x'.repeat(5000) };
    a.self = a;
    const out = redact(a, { secretValues: [] }) as { long: string; self: string };
    expect(out.long.length).toBeLessThan(1100);
    expect(out.self).toBe('[Circular]');
    const err = redact(new Error(`boom ${PG}`), { secretValues: [] }) as { message: string };
    expect(err.message).not.toContain('hunter2pass');
  });

  it('does not mistake shared (non-cyclic) references for cycles', () => {
    const shared = { v: 1 };
    const out = redact({ a: shared, b: shared }, { secretValues: [] }) as { a: { v: number }; b: { v: number } };
    expect(out.b.v).toBe(1);
  });
});

describe('logger', () => {
  afterEach(() => {
    setLogSink(null);
    setLogLevel(undefined);
  });

  it('emits one JSON line with no secret, bearer, blob token, postgres password, cookie or email', () => {
    const lines: string[] = [];
    setLogSink((l) => lines.push(l));
    setLogLevel('debug');
    const log = createLogger({ requestId: 'req-1' });
    log.info('test.event', {
      key: API_KEY,
      headers: { authorization: `Bearer ${API_KEY}`, cookie: 'nuva_session=abcdef' },
      blob: BLOB,
      url: PG,
      who: EMAIL,
      text: `contact ${EMAIL} using ${BLOB}`,
    });
    expect(lines).toHaveLength(1);
    const line = lines[0];
    for (const s of [API_KEY, BLOB, 'hunter2pass', 'nuva_session=abcdef', EMAIL]) expect(line).not.toContain(s);
    const parsed = JSON.parse(line);
    expect(parsed).toMatchObject({ level: 'info', event: 'test.event', requestId: 'req-1' });
    expect(typeof parsed.ts).toBe('string');
  });

  it('respects the level and does not let fields spoof reserved keys', () => {
    const lines: string[] = [];
    setLogSink((l) => lines.push(l));
    setLogLevel('warn');
    const log = createLogger();
    log.info('skipped');
    log.warn('kept', { level: 'debug', ts: 'fake', event: 'fake' });
    expect(lines).toHaveLength(1);
    expect(JSON.parse(lines[0])).toMatchObject({ level: 'warn', event: 'kept' });
    expect(JSON.parse(lines[0]).ts).not.toBe('fake');
  });
});

describe('redact: extra gaps', () => {
  it('masks pwd/creds/auth/jwt keys, Basic auth, scheme://user:pass@ and query-string secrets', () => {
    const out = JSON.stringify(
      redact(
        {
          pwd: 'p1',
          creds: 'c1',
          auth: 'Basic dXNlcjpwYXNz',
          jwt: 'j1',
          h: 'Authorization: Basic dXNlcjpwYXNzd29yZA==',
          m: 'mongodb+srv://user:mongopw@cluster0.x.mongodb.net/db',
          u: 'https://api.test/x?access=ACCESSVALUE1&sig=SIGVALUE2&page=3',
        },
        { secretValues: [] },
      ),
    );
    for (const s of ['p1', 'c1', 'dXNlcjpwYXNz', 'j1', 'mongopw', 'ACCESSVALUE1', 'SIGVALUE2']) expect(out).not.toContain(s);
    expect(out).toContain('page=3');
  });
});
