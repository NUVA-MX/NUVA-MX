// Loads .env.local and .env for the command-line scripts (not used by the app).
import { config } from 'dotenv';
import { Pool } from 'pg';

config({ path: '.env.local', quiet: true });
config({ quiet: true });

/** Returns DATABASE_URL or exits with a clear message. */
export function requireDatabaseUrl(script: string): string {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    console.error(
      `[${script}] Falta DATABASE_URL. Agrégala a .env.local (por ejemplo con \`vercel env pull .env.local\`) y vuelve a correr el comando.`,
    );
    process.exit(1);
  }
  return url;
}

export function createPool(url: string): Pool {
  return new Pool({ connectionString: url, max: 1 });
}
