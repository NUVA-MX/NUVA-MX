// Inserts the sample products ONLY if the table is empty. Usage: npm run db:seed
import { count } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { defaultProjectRows } from '../src/lib/content/seed-projects';
import { encargoProjects, products } from '../src/lib/db/schema';
import { sampleProducts } from '../src/lib/products/sample';
import { createPool, requireDatabaseUrl } from './_env';

async function main() {
  const pool = createPool(requireDatabaseUrl('db:seed'));
  const db = drizzle(pool);
  try {
    const [{ value }] = await db.select({ value: count() }).from(products);
    if (value > 0) {
      console.log(`[db:seed] La tabla products ya tiene ${value} fila(s). No se insertó nada.`);
    } else {
      await db.insert(products).values(
        sampleProducts.map((p, i) => ({
          name: p.name,
          meta: p.meta,
          price: p.price,
          stock: p.stock,
          category: p.category,
          imageUrl: null,
          imageAlt: p.imageAlt,
          visible: true,
          sortOrder: i,
        })),
      );
      console.log(`[db:seed] Se insertaron ${sampleProducts.length} productos de muestra (no son inventario real).`);
    }

    // The /encargo portfolio: the 6 hard-coded projects, only into an empty table (idempotent).
    const [{ value: projectCount }] = await db.select({ value: count() }).from(encargoProjects);
    if (projectCount > 0) {
      console.log(`[db:seed] La tabla encargo_projects ya tiene ${projectCount} fila(s). No se insertó nada.`);
    } else {
      const rows = defaultProjectRows();
      await db.insert(encargoProjects).values(rows);
      console.log(`[db:seed] Se insertaron ${rows.length} proyectos en encargo_projects.`);
    }
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error('[db:seed] Error:', err instanceof Error ? err.message : err);
  process.exit(1);
});
