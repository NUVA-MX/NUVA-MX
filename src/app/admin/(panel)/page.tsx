import { Button } from '@/components/primitives/Button';
import { ProductTable } from '@/components/admin/ProductTable';
import { admin } from '@/content/admin';
import { requireAdmin } from '@/lib/auth/admin';
import { listAllProducts } from '@/lib/products/admin';
import styles from '../admin.module.css';

export const dynamic = 'force-dynamic';
export const metadata = { robots: { index: false, follow: false } };

export default async function AdminProductsPage() {
  await requireAdmin();
  const rows = await listAllProducts();
  return (
    <>
      <div className={styles.head}>
        <h1 className={styles.title}>{admin.list.title}</h1>
        <Button href="/admin/productos/nuevo" icon="plus">
          {admin.list.create}
        </Button>
      </div>
      <ProductTable
        rows={rows.map((r) => ({
          id: r.id,
          name: r.name,
          price: r.price,
          stock: r.stock,
          visible: r.visible,
          imageUrl: r.imageUrl,
          imageAlt: r.imageAlt,
        }))}
      />
    </>
  );
}
