import { handleInboundWebhook } from '@/server/integrations';
import { jsonError } from '@/server/http/responses';
import { log } from '@/server/log/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** Inbound webhooks. Raw body, rate limited, signature verified, deduplicated. */
export async function POST(request: Request, context: { params: Promise<{ provider: string }> }) {
  const { provider } = await context.params;
  try {
    return await handleInboundWebhook(request, provider);
  } catch (err) {
    log.error('webhook.route_error', { error: err });
    return jsonError(500, 'server_error');
  }
}

// Any other method on a webhook URL looks like any other missing route.
export async function GET() {
  return jsonError(404, 'not_found');
}
