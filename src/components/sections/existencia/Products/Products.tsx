'use client';

import { useEffect, useRef } from 'react';
import { Button } from '@/components/primitives/Button';
import { Container } from '@/components/primitives/Container';
import { Grid } from '@/components/primitives/Grid';
import { ProductCard } from '@/components/patterns/ProductCard';
import { ProductSkeleton } from '@/components/patterns/ProductSkeleton';
import { SectionHeader } from '@/components/patterns/SectionHeader';
import { StatusMessage } from '@/components/patterns/StatusMessage';
import { VisuallyHidden } from '@/components/primitives/VisuallyHidden';
import { existencia } from '@/content/existencia';
import { site } from '@/content/site';
import { useCart } from '@/lib/cart/CartContext';
import { fillTemplate } from '@/lib/format';
import { useProducts } from '@/lib/useProducts';
import { buildWhatsAppLink } from '@/lib/whatsapp';
import styles from './Products.module.css';

const SKELETONS = 8;

export function Products() {
  const { data, status, retry } = useProducts();
  const cart = useCart();
  const { syncWithCatalog } = cart;
  const sectionRef = useRef<HTMLElement>(null);
  const p = existencia.products;

  // Reconcile the stored cart with the live catalog. On error the cart is left untouched.
  useEffect(() => {
    if (status === 'success' || status === 'empty') syncWithCatalog(data);
    else if (status === 'error') syncWithCatalog(null);
  }, [status, data, syncWithCatalog]);

  function onRetry() {
    // The retry button unmounts while loading; keep focus in the section instead of dropping to <body>.
    sectionRef.current?.focus();
    retry();
  }

  return (
    <section ref={sectionRef} tabIndex={-1} id="productos" className={styles.root} aria-labelledby="productos-title" aria-busy={status === 'loading'}>
      <Container>
        <SectionHeader eyebrow={p.eyebrow} title={p.title} titleId="productos-title" aside={p.aside} />
        <div className={styles.body}>
          {status === 'loading' && (
            <>
              <VisuallyHidden>{p.loading}</VisuallyHidden>
              <Grid min="md" gap="5-5">
                {Array.from({ length: SKELETONS }, (_, i) => (
                  <ProductSkeleton key={i} />
                ))}
              </Grid>
            </>
          )}

          {status === 'empty' && (
            <StatusMessage
              title={p.empty.title}
              body={p.empty.body}
              action={
                <Button href={buildWhatsAppLink({ phone: site.whatsapp.phone, message: site.whatsapp.defaultMessage })} external icon="whatsapp">
                  {p.empty.cta}
                </Button>
              }
            />
          )}

          {status === 'error' && (
            <StatusMessage
              tone="error"
              title={p.error.title}
              body={p.error.body}
              action={
                <Button variant="secondary" onClick={onRetry}>
                  {p.error.retry}
                </Button>
              }
            />
          )}

          {status === 'success' && (
            <Grid min="md" gap="5-5">
              {data.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  quantityInCart={cart.qtyOf(product.id)}
                  onAdd={cart.add}
                  notifyHref={buildWhatsAppLink({
                    phone: site.whatsapp.phone,
                    message: fillTemplate(p.notifyTemplate, { name: product.name }),
                  })}
                  labels={{
                    add: p.button.add,
                    added: p.button.added,
                    notify: p.button.notify,
                    addAria: p.addAria,
                    notifyAria: p.notifyAria,
                    noPrice: p.noPrice,
                  }}
                  badgeLabels={p.badge}
                  lowThreshold={p.lowStockThreshold}
                />
              ))}
            </Grid>
          )}
        </div>
      </Container>
    </section>
  );
}
