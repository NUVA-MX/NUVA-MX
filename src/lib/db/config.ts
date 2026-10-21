import 'server-only';
import { isDbConfigured as envIsDbConfigured } from '@/server/env';

/** True when DATABASE_URL is set (the value is never exposed). */
export function isDbConfigured(): boolean {
  return envIsDbConfigured();
}
