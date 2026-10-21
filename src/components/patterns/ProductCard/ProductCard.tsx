'use client';

import { Button } from '@/components/primitives/Button';
import { Heading } from '@/components/primitives/Heading';
import { Media } from '@/components/primitives/Media';
import { isAtMaxQty } from '@/lib/cart/reducer';
import { fillTemplate, formatMXN } from '@/lib/format';
import type { Product } from '@/lib/products/types';
import { StockBadge, type StockBadgeLabels } from '../StockBadge';
import styles from './ProductCard.module.css';

export type ProductCardLabels = {
  add: string;
  added: string;
  notify: string;
  addAria: string;
  notifyAria: string;
  /** Shown in place of the price when it is unknown. */
  noPrice: string;
};

type Props = {
  product: Product;
  quantityInCart: number;
  onAdd: (product: Product) => void;
  /** Link opened by the out-of-stock button (e.g. WhatsApp). */
  notifyHref: string;
  labels: ProductCardLabels;
  badgeLabels: StockBadgeLabels;
  lowThreshold: number;
};

/** Store card. Price and badge hide when unknown; out of stock shows the notify link instead of add. */
export function ProductCard({ product, quantityInCart, onAdd, notifyHref, labels, badgeLabels, lowThreshold }: Props) {
  const out = product.stock !== null && product.stock <= 0;
  // Capped by stock and by MAX_QTY (99) when stock is unknown, same as the cart panel's "+".
  const atMax = isAtMaxQty(quantityInCart, product.stock);
  const vars = { name: product.name, n: quantityInCart };

  return (
    <article className={styles.root}>
      <div className={styles.mediaBox}>
        <Media src={product.image} alt={product.imageAlt ?? product.name} ratio="4/5" sizes="grid" />
        <StockBadge stock={product.stock} lowThreshold={lowThreshold} labels={badgeLabels} className={styles.badge} />
      </div>
      <div className={styles.body}>
        <Heading level={3} size="product" className={styles.name}>
          {product.name}
        </Heading>
        {product.meta && <p className={styles.meta}>{product.meta}</p>}
        <div className={styles.footer}>
          {product.price !== null ? (
            <span className={styles.price}>{formatMXN(product.price)}</span>
          ) : (
            <span className={styles.noPrice}>{labels.noPrice}</span>
          )}
          <span className={styles.action}>
            {out ? (
              <Button
                href={notifyHref}
                external
                variant="secondary"
                size="md"
                ariaLabel={fillTemplate(labels.notifyAria, vars)}
              >
                {labels.notify}
              </Button>
            ) : (
              <Button
                variant={quantityInCart > 0 ? 'primary' : 'secondary'}
                size="md"
                onClick={() => onAdd(product)}
                disabled={atMax}
                ariaLabel={fillTemplate(labels.addAria, vars)}
              >
                {quantityInCart > 0 ? fillTemplate(labels.added, vars) : labels.add}
              </Button>
            )}
          </span>
        </div>
      </div>
    </article>
  );
}
