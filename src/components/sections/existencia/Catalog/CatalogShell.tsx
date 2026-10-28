'use client';

import { useRef, type CSSProperties } from 'react';
import { Button } from '@/components/primitives/Button';
import { Eyebrow } from '@/components/primitives/Eyebrow';
import { Media } from '@/components/primitives/Media';
import { VisuallyHidden } from '@/components/primitives/VisuallyHidden';
import { existenciaCatalog as copy } from '@/content/existencia-catalog';
import type { CatalogCard } from '@/lib/catalog/types';
import { fillTemplate, formatMXN } from '@/lib/format';
import detail from './CatalogDetail.module.css';
import styles from './CatalogShell.module.css';

type Props = {
  /** What the card already knows: shown from the first frame while the full detail loads. */
  card: CatalogCard;
  titleId: string;
  failed: boolean;
  onRetry: () => void;
};

/** Detail window before the detail arrives: same layout as the full detail, with the card data and calm placeholders. */
export function CatalogShell({ card, titleId, failed, onRetry }: Props) {
  const d = copy.detail;
  const root = useRef<HTMLDivElement>(null);
  const eyebrow = [card.category, card.subcategory].filter(Boolean).join(' · ');
  return (
    <div ref={root} tabIndex={-1} className={`${detail.root} ${styles.root}`} aria-busy={!failed}>
      <div className={detail.gallery}>
        <Media src={card.image} alt={card.name} ratio="1/1" sizes="modal" tint="wine" />
      </div>
      <div className={detail.content}>
        {eyebrow && (
          <Eyebrow size="sm" tracking="label">
            {eyebrow}
          </Eyebrow>
        )}
        <h2 id={titleId} className={detail.title}>
          {card.name}
        </h2>
        <p className={detail.code}>{fillTemplate(d.code, { code: card.code })}</p>
        {card.price !== null && (
          <p className={detail.price}>
            <span className={detail.amount}>{formatMXN(card.price)}</span>
            <span className={detail.priceNote}>{d.priceNote}</span>
          </p>
        )}
        {card.colors.length > 0 && (
          <span className={styles.dots} aria-hidden="true">
            {card.colors.map((c) => (
              <span key={c.tone} className={styles.dot} style={c.hex ? ({ '--swatch-color': c.hex } as CSSProperties) : undefined} />
            ))}
          </span>
        )}

        {failed ? (
          <div className={styles.error} role="alert">
            <p className={styles.errorTitle}>{d.error.title}</p>
            <p className={styles.errorBody}>{d.error.body}</p>
            <Button
              variant="secondary"
              onClick={() => {
                root.current?.focus();
                onRetry();
              }}
            >
              {d.error.retry}
            </Button>
          </div>
        ) : (
          <div className={styles.skeleton} aria-hidden="true">
            <VisuallyHidden>{d.loadingDetails}</VisuallyHidden>
            <span className={styles.lineWide} />
            <span className={styles.lineWide} />
            <span className={styles.lineShort} />
            <span className={styles.block} />
            <span className={styles.button} />
          </div>
        )}
      </div>
    </div>
  );
}
