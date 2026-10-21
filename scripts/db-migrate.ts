// Applies the SQL migrations in ./drizzle. Usage: npm run db:migrate
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { createPool, requireDatabaseUrl } from './_env';

async function main() {
  const pool = createPool(requireDatabaseUrl('db:migrate'));
  try {
    await migrate(drizzle(pool), { migrationsFolder: './drizzle' });
    console.log('[db:migrate] Migraciones aplicadas.');
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error('[db:migrate] Error:', err instanceof Error ? err.message : err);
  process.exit(1);
});
