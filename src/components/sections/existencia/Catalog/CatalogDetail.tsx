'use client';

import { useState } from 'react';
import { Eyebrow } from '@/components/primitives/Eyebrow';
import { Media } from '@/components/primitives/Media';
import { InfoGrid, type InfoItem } from '@/components/patterns/InfoGrid';
import { Pill } from '@/components/primitives/Pill';
import { SwatchPicker } from '@/components/patterns/SwatchPicker';
import { existenciaCatalog as copy } from '@/content/existencia-catalog';
import type { CatalogDetail as Detail } from '@/lib/catalog/types';
import { fillTemplate, formatMXN } from '@/lib/format';
import { DetailActions } from './DetailActions';
import styles from './CatalogDetail.module.css';

type Props = { product: Detail; titleId: string; onAdded: () => void };

const AVAILABILITY_TONE = { available: 'status-ok', low: 'status-low', out: 'status-out', unknown: 'neutral' } as const;

function specItems(specs: Detail['specs']): InfoItem[] {
  const labels = copy.detail.specs;
  return (Object.keys(labels) as Array<keyof typeof labels>).flatMap((key) => {
    const value = specs[key];
    return value ? [{ label: labels[key], value }] : [];
  });
}

/** Product detail inside the modal: photos, description, specs, color choice and the "add to my list" action. */
export function CatalogDetail({ product, titleId, onAdded }: Props) {
  const d = copy.detail;
  const firstOpen = product.variants.find((v) => v.availability !== 'out');
  const [variantCode, setVariantCode] = useState<string | null>((firstOpen ?? product.variants[0])?.code ?? null);
  const [shown, setShown] = useState<string | null>(null);

  const variant = product.variants.find((v) => v.code === variantCode) ?? null;
  const gallery = [...new Set([product.image, ...product.images].flatMap((u) => u ?? []))];
  const main = shown ?? variant?.image ?? gallery[0] ?? null;
  const specs = specItems(product.specs);

  function pick(code: string) {
    setVariantCode(code);
    setShown(null);
  }

  return (
    <div className={styles.root}>
      <div className={styles.gallery}>
        <div className={styles.main}>
          <Media src={main} alt={product.name} ratio="fill" sizes="modal" tint="wine" />
        </div>
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
            <span className={styles.priceTag}>{d.priceTag}</span>
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

        <DetailActions product={product} variant={variant} onAdded={onAdded} />
      </div>
    </div>
  );
}
