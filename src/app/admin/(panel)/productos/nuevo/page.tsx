import { ProductForm } from '@/components/admin/ProductForm';
import { requireAdmin } from '@/lib/auth/admin';
import { isBlobConfigured } from '@/server/env';

export const dynamic = 'force-dynamic';
export const metadata = { robots: { index: false, follow: false } };

export default async function NewProductPage() {
  await requireAdmin();
  return <ProductForm blobEnabled={isBlobConfigured()} />;
}
