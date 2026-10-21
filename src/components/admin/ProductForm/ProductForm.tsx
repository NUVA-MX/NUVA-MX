'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { saveProductAction, type ProductFormState } from '@/app/admin/actions';
import { admin } from '@/content/admin';
import { Button } from '@/components/primitives/Button';
import { Field } from '@/components/primitives/Field';
import { ImageUploader } from '../ImageUploader';
import styles from './ProductForm.module.css';

export type ProductFormData = {
  id: string;
  name: string;
  meta: string | null;
  price: number | null;
  stock: number | null;
  category: string | null;
  imageUrl: string | null;
  imageAlt: string | null;
  visible: boolean;
  sortOrder: number;
};

type Props = {
  /** Omit to create a new product. */
  product?: ProductFormData;
  blobEnabled: boolean;
};

const initial: ProductFormState = {};

/** Shared create/edit form. The server action validates everything again. */
export function ProductForm({ product, blobEnabled }: Props) {
  const [state, action, pending] = useActionState(saveProductAction, initial);
  const f = admin.form;
  const e = state.errors ?? {};
  // After an error, React resets the form to these defaults, so use the echoed values when present.
  const v = state.values;
  const text = (key: keyof NonNullable<typeof v>, fallback: string | number | null | undefined) =>
    v?.[key] ?? (fallback === null || fallback === undefined ? '' : String(fallback));
  return (
    <form action={action} className={styles.root}>
      <div className={styles.header}>
        <h1 className={styles.title}>{product ? f.editTitle : f.createTitle}</h1>
        <Link href="/admin" className={styles.back}>
          {f.back}
        </Link>
      </div>
      {product && <input type="hidden" name="id" value={product.id} />}
      {e.form && (
        <p className={styles.formError} role="alert">
          {e.form}
        </p>
      )}
      <div className={styles.grid}>
        <Field label={f.name} name="name" required defaultValue={text('name', product?.name)} error={e.name} className={styles.wide} />
        <Field label={f.meta} name="meta" defaultValue={text('meta', product?.meta)} error={e.meta} className={styles.wide} />
        <Field label={f.price} name="price" type="number" inputMode="numeric" min={0} step={1} defaultValue={text('price', product?.price)} error={e.price} />
        <Field label={f.stock} name="stock" type="number" inputMode="numeric" min={0} step={1} defaultValue={text('stock', product?.stock)} error={e.stock} />
        <Field label={f.category} name="category" defaultValue={text('category', product?.category)} error={e.category} />
        <Field label={f.sortOrder} name="sortOrder" type="number" inputMode="numeric" min={0} step={1} defaultValue={text('sortOrder', product?.sortOrder ?? 0)} error={e.sortOrder} />
        <div className={styles.wide}>
          <ImageUploader name="imageUrl" defaultUrl={product?.imageUrl ?? null} enabled={blobEnabled} />
          {e.imageUrl && <p className={styles.formError}>{e.imageUrl}</p>}
        </div>
        <Field label={f.imageAlt} name="imageAlt" defaultValue={text('imageAlt', product?.imageAlt)} error={e.imageAlt} className={styles.wide} />
        <Field label={f.visible} name="visible" as="checkbox" defaultChecked={v ? v.visible === 'on' : (product?.visible ?? true)} />
      </div>
      <div className={styles.footer}>
        <Button type="submit" disabled={pending}>
          {pending ? f.saving : f.save}
        </Button>
      </div>
    </form>
  );
}
