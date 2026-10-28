'use client';

import { useState } from 'react';
import { Button } from '@/components/primitives/Button';
import { Eyebrow } from '@/components/primitives/Eyebrow';
import { Media } from '@/components/primitives/Media';
import { InfoGrid, type InfoItem } from '@/components/patterns/InfoGrid';
import { Pill } from '@/components/primitives/Pill';
import { SwatchPicker } from '@/components/patterns/SwatchPicker';
import { existenciaCatalog as copy } from '@/content/existencia-catalog';
import { site } from '@/content/site';
import { catalogCartId, catalogLineName } from '@/lib/catalog/cart-line';
import type { CatalogDetail as Detail } from '@/lib/catalog/types';
import { useCart } from '@/lib/cart/CartContext';
import { isAtMaxQty } from '@/lib/cart/reducer';
import { fillTemplate, formatMXN } from '@/lib/format';
import { buildWhatsAppLink } from '@/lib/whatsapp';
import styles from './CatalogDetail.module.css';

type Props = { product: Detail; titleId: string };

const AVAILABILITY_TONE = { available: 'status-ok', low: 'status-low', out: 'status-out', unknown: 'neutral' } as const;

function specItems(specs: Detail['specs']): InfoItem[] {
  const labels = copy.detail.specs;
  return (Object.keys(labels) as Array<keyof typeof labels>).flatMap((key) => {
    const value = specs[key];
    return value ? [{ label: labels[key], value }] : [];
  });
}

/** Product detail inside the modal: photos, description, specs, color choice and the "add to my list" action. */
export function CatalogDetail({ product, titleId }: Props) {
  const d = copy.detail;
  const cart = useCart();
  const firstOpen = product.variants.find((v) => v.availability !== 'out');
  const [variantCode, setVariantCode] = useState<string | null>((firstOpen ?? product.variants[0])?.code ?? null);
  const [shown, setShown] = useState<string | null>(null);

  const variant = product.variants.find((v) => v.code === variantCode) ?? null;
  const gallery = [...new Set([product.image, ...product.images].flatMap((u) => u ?? []))];
  const main = shown ?? variant?.image ?? gallery[0] ?? null;
  const cartId = variant ? catalogCartId(product.code, variant.code) : '';
  const qty = variant ? cart.qtyOf(cartId) : 0;
  const unavailable = !variant || variant.availability === 'out' || isAtMaxQty(qty, null);
  const specs = specItems(product.specs);
  const vars = { name: product.name, tone: variant?.tone ?? '', n: qty };

  function pick(code: string) {
    setVariantCode(code);
    setShown(null);
  }

  function add() {
    if (!variant) return;
    cart.add({
      id: cartId,
      name: catalogLineName(copy.listItemName, { name: product.name, tone: variant.tone, code: variant.code }),
      price: product.price,
      stock: null,
    });
  }

  return (
    <div className={styles.root}>
      <div className={styles.gallery}>
        <Media src={main} alt={product.name} ratio="1/1" sizes="modal" tint="wine" />
        {gallery.length > 1 && (
          <ul className={styles.thumbs} aria-label={d.gallery}>
            {gallery.map((url, i) => (
              <li key={url}>
                <button
                  type="button"
                  className={styles.thumb}
                  aria-pressed={url === main}
                  aria-label={fillTemplate(d.photoAlt, { name: product.name, n: i + 1, total: gallery.length })}
                  onClick={() => setShown(url)}
                >
                  <Media src={url} alt="" ratio="1/1" sizes="thumb" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className={styles.content}>
        {product.category && (
          <Eyebrow size="sm" tracking="label">
            {product.category}
          </Eyebrow>
        )}
        <h2 id={titleId} className={styles.title}>
          {product.name}
        </h2>
        <p className={styles.code}>{fillTemplate(d.code, { code: product.code })}</p>
        {product.price !== null && (
          <p className={styles.price}>
            <span className={styles.amount}>{formatMXN(product.price)}</span>
            <span className={styles.priceNote}>{d.priceNote}</span>
          </p>
        )}
        <div className={styles.status}>
          <Pill tone={AVAILABILITY_TONE[product.availability]}>{copy.availability[product.availability]}</Pill>
          <span className={styles.notice}>{product.price === null ? d.notice : d.noticeWithPrice}</span>
        </div>
        {product.description && <p className={styles.description}>{product.description}</p>}
        {specs.length > 0 && <InfoGrid className={styles.specs} items={specs} />}

        {product.variants.length > 0 ? (
          <div className={styles.colors}>
            <p className={styles.colorsLabel} aria-live="polite">
              {variant ? fillTemplate(d.colorsSelected, { tone: variant.tone }) : d.colorsNone}
            </p>
            <SwatchPicker
              label={d.colorsLabel}
              value={variantCode}
              onChange={pick}
              options={product.variants.map((v) => ({
                value: v.code,
                label: v.availability === 'out' ? fillTemplate(d.colorOut, { tone: v.tone }) : v.tone,
                hex: v.hex,
                disabled: v.availability === 'out',
              }))}
            />
          </div>
        ) : (
          <p className={styles.notice}>{d.noVariants}</p>
        )}
        {variant?.availability === 'out' && <p className={styles.notice}>{d.outNotice}</p>}

        <div className={styles.actions}>
          {product.variants.length > 0 && (
            <Button
              size="xl"
              block
              variant={qty > 0 ? 'secondary' : 'primary'}
              disabled={unavailable}
              ariaLabel={fillTemplate(d.addAria, vars)}
              onClick={add}
            >
              {qty > 0 ? fillTemplate(d.added, vars) : d.add}
            </Button>
          )}
          <Button
            href={buildWhatsAppLink({
              phone: site.whatsapp.phone,
              message: fillTemplate(d.askTemplate, { name: product.name, code: product.code }),
            })}
            external
            size="xl"
            block
            variant="secondary"
            icon="whatsapp"
          >
            {d.ask}
          </Button>
        </div>
      </div>
    </div>
  );
}
