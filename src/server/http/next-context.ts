import 'server-only';
import { headers } from 'next/headers';
import { contextFromHeaders, type RequestContext } from './request-context';

/** Request context for server actions and server components (reads the current request headers). */
export async function currentContext(): Promise<RequestContext> {
  try {
    return contextFromHeaders(await headers());
  } catch {
    return { requestId: crypto.randomUUID(), ip: 'unknown' };
  }
}
