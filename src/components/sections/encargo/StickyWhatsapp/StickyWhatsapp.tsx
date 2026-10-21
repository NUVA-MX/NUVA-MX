'use client';

import { Button } from '@/components/primitives/Button';
import { cx } from '@/lib/cx';
import { useStickyVisible } from './useStickyVisible';
import styles from './StickyWhatsapp.module.css';

type Props = {
  href: string;
  label: string;
  ariaLabel: string;
};

/**
 * WhatsApp button fixed to the bottom right, on phone widths only. It appears after the hero scrolls away and steps
 * aside over the calls to action and the footer. The invisible sentinel marks the end of the hero.
 */
export function StickyWhatsapp({ href, label, ariaLabel }: Props) {
  const { sentinelRef, visible } = useStickyVisible();
  return (
    <>
      <div ref={sentinelRef} aria-hidden="true" />
      <div className={cx(styles.root, visible && styles.visible)} aria-hidden={visible ? undefined : true}>
        <Button
          href={href}
          external
          size="lg"
          icon="whatsapp"
          ariaLabel={ariaLabel}
          className={styles.button}
        >
          {label}
        </Button>
      </div>
    </>
  );
}
