import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import { getAdmin } from '@/lib/auth/admin';
import { isSafeUploadPath } from '@/lib/blob';
import { audit } from '@/server/audit/audit';
import { isBlobConfigured } from '@/server/env';
import { contextFromHeaders } from '@/server/http/request-context';
import { log } from '@/server/log/logger';
import { enforceRateLimit } from '@/server/ratelimit/guard';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const MAX_BYTES = 5 * 1024 * 1024;

class UnauthorizedError extends Error {}
class BadPathError extends Error {}
class RateLimitedError extends Error {
  constructor(public readonly response: Response) {
    super('rate_limited');
  }
}

/**
 * Client uploads to Vercel Blob. A token is only issued to a logged-in admin
 * (checked in onBeforeGenerateToken). No onUploadCompleted: the URL is saved by the product form action.
 */
export async function POST(request: Request) {
  if (!isBlobConfigured()) {
    return NextResponse.json({ error: 'not_configured' }, { status: 503 });
  }
  const ctx = contextFromHeaders(request.headers);
  const ipLimited = await enforceRateLimit('uploadIp', { ip: ctx.ip });
  if (!ipLimited.ok) return ipLimited.response;

  let body: HandleUploadBody;
  try {
    body = (await request.json()) as HandleUploadBody;
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  }

  const denied = (reason: string, actorId?: string) =>
    audit({
      actorType: 'admin',
      actorId: actorId ?? null,
      action: 'upload.token_denied',
      outcome: 'denied',
      ip: ctx.ip,
      requestId: ctx.requestId,
      metadata: { reason },
    });

  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        const admin = await getAdmin();
        if (!admin) throw new UnauthorizedError();
        const limited = await enforceRateLimit('upload', { adminId: admin.id });
        if (!limited.ok) {
          await denied('rate_limited', admin.id);
          throw new RateLimitedError(limited.response);
        }
        // Only `productos/<safe-name>` or `encargo/<safe-name>`; the random suffix makes the final name unique.
        if (!isSafeUploadPath(pathname)) {
          await denied('bad_pathname', admin.id);
          throw new BadPathError();
        }
        await audit({
          actorType: 'admin',
          actorId: admin.id,
          action: 'upload.token_issued',
          target: pathname,
          outcome: 'success',
          ip: ctx.ip,
          requestId: ctx.requestId,
        });
        return {
          allowedContentTypes: ALLOWED_TYPES,
          maximumSizeInBytes: MAX_BYTES,
          addRandomSuffix: true,
          // Short-lived client token (default is 1 hour): limits what a leaked token can do.
          validUntil: Date.now() + 2 * 60_000,
        };
      },
    });
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof RateLimitedError) return err.response;
    if (err instanceof UnauthorizedError) {
      await denied('unauthorized');
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    if (err instanceof BadPathError) {
      return NextResponse.json({ error: 'bad_pathname' }, { status: 400 });
    }
    log.error('api.admin.upload_error', { requestId: ctx.requestId, error: err });
    return NextResponse.json({ error: 'upload_error' }, { status: 400 });
  }
}
