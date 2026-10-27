'use client';

import { Heading } from '@/components/primitives/Heading';
import { Media } from '@/components/primitives/Media';
import { cx } from '@/lib/cx';
import type { CatalogCard as CatalogCardData } from '@/lib/catalog/types';
import { fillTemplate } from '@/lib/format';
import styles from './CatalogCard.module.css';

export type CatalogCardLabels = {
  /** Template with {code} and {subcategory}. */
  meta: string;
  add: string;
  inList: string;
  /** "Agregar {name} a mi lista" */
  addAria: string;
  /** "Quitar {name} de mi lista" */
  inListAria: string;
  /** "Ver detalle de {name}" */
  viewDetailAria: string;
};

type Props = {
  card: CatalogCardData;
  labels: CatalogCardLabels;
  /** True while any variant of this product is in the list. */
  inList: boolean;
  /** Adds the product, removes it, or opens the detail when a color must be picked. */
  onToggle: (card: CatalogCardData) => void;
  onOpen: (code: string) => void;
};

/** Catalog card: photo (opens the detail), code and subcategory, name and one add/remove button. No price. */
export function CatalogCard({ card, labels, inList, onToggle, onOpen }: Props) {
  const meta = card.subcategory ? fillTemplate(labels.meta, { code: card.code, subcategory: card.subcategory }) : card.code;
  const single = card.variantCount <= 1;
  return (
    <article className={styles.root}>
      <button
        type="button"
        className={styles.photo}
        aria-label={fillTemplate(labels.viewDetailAria, { name: card.name })}
        onClick={() => onOpen(card.code)}
      >
        <Media src={card.image} alt="" ratio="1/1" sizes="grid" />
      </button>
      <div className={styles.body}>
        <p className={styles.meta}>{meta}</p>
        <Heading level={3} size="xs" className={styles.name}>
          {card.name}
        </Heading>
        <button
          type="button"
          className={cx(styles.toggle, inList && styles.on)}
          aria-pressed={single ? inList : undefined}
          aria-haspopup={single ? undefined : 'dialog'}
          aria-label={fillTemplate(inList ? labels.inListAria : labels.addAria, { name: card.name })}
          onClick={() => onToggle(card)}
        >
          {inList ? labels.inList : labels.add}
        </button>
      </div>
    </article>
  );
}
