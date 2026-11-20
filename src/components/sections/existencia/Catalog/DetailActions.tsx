'use client';

import { useState } from 'react';
import { Button } from '@/components/primitives/Button';
import { HoldStepButton, Quantity } from '@/components/patterns/HoldStepButton';
import { Icon } from '@/components/primitives/Icon';
import { existenciaCatalog as copy } from '@/content/existencia-catalog';
import { site } from '@/content/site';
import { catalogCartId, catalogLineName } from '@/lib/catalog/cart-line';
import { startCheckout } from '@/lib/catalog/checkout';
import { buildQuoteMessage } from '@/lib/catalog/quote-message';
import type { CatalogDetail as Detail } from '@/lib/catalog/types';
import { useCart } from '@/lib/cart/CartContext';
import { MAX_QTY } from '@/lib/cart/reducer';
import { fillTemplate } from '@/lib/format';
import { buildWhatsAppLink } from '@/lib/whatsapp';
import styles from './DetailActions.module.css';

type Props = {
  product: Detail;
  /** Chosen color; null when the product has none to pick. */
  variant: Detail['variants'][number] | null;
  /** Called after the pieces are in the list (the modal closes and the list opens). */
  onAdded: () => void;
};

/** Quantity selector and the actions of the product modal: add to my list, buy at the published price (only with a price) and quote by WhatsApp. */
export function DetailActions({ product, variant, onAdded }: Props) {
  const d = copy.detail;
  const cart = useCart();
  const [want, setWant] = useState(1);
  const cartId = catalogCartId(product.code, variant?.code ?? product.code);
  const inList = variant ? cart.qtyOf(cartId) : 0;
  const room = MAX_QTY - inList;
  const pieces = Math.max(1, Math.min(want, room));
  const unavailable = !variant || variant.availability === 'out' || room < 1;
  const name = variant
    ? catalogLineName(copy.listItemName, { name: product.name, tone: variant.tone, code: variant.code })
    : product.name;
  const vars = { name: product.name, tone: variant?.tone ?? '', n: inList };

  function add() {
    if (!variant) return;
    cart.add({ id: cartId, name, price: product.price, stock: null });
    cart.setQty(cartId, inList + pieces);
    onAdded();
  }

  const quoteHref = buildWhatsAppLink({
    phone: site.whatsapp.phone,
    message: buildQuoteMessage([{ id: cartId, name, qty: pieces }], copy.quoteMessage),
  });

  return (
    <div className={styles.root}>
      {product.variants.length > 0 && (
        <div className={styles.qty} role="group" aria-label={`${d.quantity}: ${product.name}`}>
          <HoldStepButton
            value={pieces}
            direction={-1}
            max={room}
            disabled={pieces <= 1 || unavailable}
            onChange={(n) => setWant(Math.max(1, n))}
            className={styles.step}
            ariaLabel={fillTemplate(copy.card.decreaseAria, { name: product.name })}
          >
            <Icon name="minus" />
          </HoldStepButton>
          <Quantity value={pieces} className={styles.value} />
          <HoldStepButton
            value={pieces}
            direction={1}
            max={room}
            disabled={pieces >= room || unavailable}
            onChange={(n) => setWant(Math.max(1, n))}
            className={styles.step}
            ariaLabel={fillTemplate(copy.card.increaseAria, { name: product.name })}
          >
            <Icon name="plus" />
          </HoldStepButton>
        </div>
      )}
      <div className={styles.buttons}>
        {product.variants.length > 0 && (
          <Button size="xl" block variant={inList > 0 ? 'secondary' : 'primary'} disabled={unavailable} ariaLabel={fillTemplate(d.addAria, vars)} onClick={add}>
            {inList > 0 ? fillTemplate(d.added, vars) : d.add}
          </Button>
        )}
        {product.price !== null && (
          <Button size="xl" block onClick={startCheckout}>
            {copy.drawer.buy}
          </Button>
        )}
        <Button href={quoteHref} external size="xl" block variant="secondary" icon="whatsapp">
          {copy.drawer.quote}
        </Button>
      </div>
    </div>
  );
}
