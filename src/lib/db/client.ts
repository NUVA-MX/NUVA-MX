import 'server-only';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { databaseUrl } from '@/server/env';
import * as schema from './schema';

export type Db = NodePgDatabase<typeof schema>;

// Global singleton: avoids opening a new pool on every dev reload or warm invocation.
const globalForDb = globalThis as unknown as { __nuvaPool?: Pool; __nuvaDb?: Db };

/** Lazy DB client. Throws if DATABASE_URL is missing; callers check isDbConfigured() first. */
export function getDb(): Db {
  const url = databaseUrl();
  if (!url) throw new Error('DATABASE_URL no está configurada');
  if (!globalForDb.__nuvaDb) {
    globalForDb.__nuvaPool = new Pool({ connectionString: url, max: 5, idleTimeoutMillis: 10_000 });
    globalForDb.__nuvaDb = drizzle(globalForDb.__nuvaPool, { schema });
  }
  return globalForDb.__nuvaDb;
}
