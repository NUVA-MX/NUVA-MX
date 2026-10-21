import { notFound } from 'next/navigation';
import { ProductForm } from '@/components/admin/ProductForm';
import { requireAdmin } from '@/lib/auth/admin';
import { getProductById } from '@/lib/products/admin';
import { isBlobConfigured } from '@/server/env';

export const dynamic = 'force-dynamic';
export const metadata = { robots: { index: false, follow: false } };

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) notFound();
  return (
    <ProductForm
      blobEnabled={isBlobConfigured()}
      product={{
        id: product.id,
        name: product.name,
        meta: product.meta,
        price: product.price,
        stock: product.stock,
        category: product.category,
        imageUrl: product.imageUrl,
        imageAlt: product.imageAlt,
        visible: product.visible,
        sortOrder: product.sortOrder,
      }}
    />
  );
}
