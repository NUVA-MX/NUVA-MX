import { NextResponse } from 'next/server';
import { isDbConfigured } from '@/lib/db/config';
import { listPublicProducts } from '@/lib/products/server';
import { sampleProducts } from '@/lib/products/sample';
import type { ProductsResponse } from '@/lib/products/types';
import { sampleDataMode } from '@/server/env';
import { contextFromHeaders } from '@/server/http/request-context';
import { log } from '@/server/log/logger';
import { enforceRateLimit } from '@/server/ratelimit/guard';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const headers = { 'Cache-Control': 'no-store' };

function ok(body: ProductsResponse) {
  return NextResponse.json(body, { headers });
}

function fail(status: number, error: 'server_error' | 'not_configured') {
  return NextResponse.json({ error }, { status, headers });
}

/**
 * Public products (rate limited per IP).
 * - NUVA_SAMPLE_DATA=empty|error forces those states (testing).
 * - With DATABASE_URL: visible rows from the DB.
 * - Without DB: sample data in development (or with NUVA_SAMPLE_DATA=sample); 503 otherwise.
 */
export async function GET(request: Request) {
  const ctx = contextFromHeaders(request.headers);
  const limited = await enforceRateLimit('products', { ip: ctx.ip });
  if (!limited.ok) return limited.response;

  const mode = sampleDataMode();

  if (mode === 'empty') return ok({ products: [], source: 'sample' });
  if (mode === 'error') return fail(500, 'server_error');

  if (isDbConfigured()) {
    try {
      return ok({ products: await listPublicProducts(), source: 'db' });
    } catch (err) {
      log.error('api.products.db_error', { requestId: ctx.requestId, error: err });
      return fail(500, 'server_error');
    }
  }

  if (process.env.NODE_ENV !== 'production' || mode === 'sample') {
    return ok({ products: sampleProducts, source: 'sample' });
  }

  return fail(503, 'not_configured');
}
