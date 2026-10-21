'use client';

import Link from 'next/link';
import { type ReactNode, useCallback, useEffect, useId, useRef, useState } from 'react';
import { Button } from '@/components/primitives/Button';
import { Icon } from '@/components/primitives/Icon';
import type { NavLink } from '@/components/layout/SiteNav';
import { SegmentedSwitch } from '@/components/patterns/SegmentedSwitch';
import { encargo } from '@/content/encargo';
import { site, type SwitchKey } from '@/content/site';
import { ui } from '@/content/ui';
import { useFocusTrap } from '@/lib/useFocusTrap';
import { useLockBodyScroll } from '@/lib/useLockBodyScroll';
import { buildWhatsAppLink } from '@/lib/whatsapp';
import { breakpoints } from '@/styles/breakpoints';
import styles from './TallerNav.module.css';

const DESKTOP_QUERY = `(min-width: ${breakpoints.tablet}px)`;

type Props = {
  current: SwitchKey;
  links: readonly NavLink[];
  /** Extra control (e.g. the cart). Desktop: inner edge of the links column, so the switch and WhatsApp never move between pages. Phone/tablet: top-left cell. */
  action?: ReactNode;
};

/**
 * Sticky nav of the taller theme, shared by /encargo and /existencia.
 * Desktop: links + action | wordmark | switch + WhatsApp. Phone/tablet: wordmark + menu button, the switch
 * on its own full-width row, and a full-screen menu dialog (focus trap, Escape, scroll lock).
 */
export function TallerNav({ current, links, action }: Props) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const menuRef = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  const whatsapp = buildWhatsAppLink({ phone: site.whatsapp.phone, message: site.whatsapp.defaultMessage });

  useLockBodyScroll(open);
  useFocusTrap(menuRef, open, close);

  // The menu does not exist on desktop: close it if the window grows past the breakpoint.
  useEffect(() => {
    if (!open) return;
    const mq = window.matchMedia(DESKTOP_QUERY);
    const onChange = () => {
      if (mq.matches) setOpen(false);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [open]);

  return (
    <>
      <header className={styles.root}>
        <div className={styles.bar}>
          <nav aria-label={ui.mainNav} className={styles.links}>
            <ul className={styles.linkList}>
              {links.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className={styles.link}>
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <Link href="/" className={styles.brand} aria-label={site.homeLabel}>
            {encargo.chrome.wordmark}
          </Link>
          {action && <div className={styles.actionMobile}>{action}</div>}
          {action && <div className={styles.actionDesktop}>{action}</div>}
          <div className={styles.end}>
            <SegmentedSwitch
              options={site.switch}
              current={current}
              ariaLabel={site.switchLabel}
              className={styles.switch}
            />
            <Button href={whatsapp} external size="md" icon="whatsapp" className={styles.whatsapp}>
              {encargo.nav.whatsapp}
            </Button>
          </div>
          <button
            type="button"
            className={styles.menuButton}
            aria-expanded={open}
            aria-controls={menuId}
            aria-label={ui.openMenu}
            onClick={() => setOpen(true)}
          >
            <Icon name="menu" size="md" />
          </button>
        </div>
      </header>
      <div
        id={menuId}
        ref={menuRef}
        role="dialog"
        aria-modal="true"
        aria-label={ui.menu}
        tabIndex={-1}
        hidden={!open}
        className={styles.menu}
      >
        <div className={styles.menuTop}>
          <span className={styles.menuBrand} aria-hidden="true">
            {encargo.chrome.wordmark}
          </span>
          <button type="button" className={styles.menuClose} aria-label={ui.closeMenu} onClick={close}>
            <Icon name="close" size="md" />
          </button>
        </div>
        <nav aria-label={ui.mainNav} className={styles.menuNav}>
          <ul className={styles.menuList}>
            {links.map((l) => (
              <li key={l.href}>
                <a href={l.href} className={styles.menuLink} onClick={close}>
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className={styles.menuFoot}>
          <Button href={whatsapp} external size="xl" icon="whatsapp" block>
            {encargo.nav.whatsapp}
          </Button>
        </div>
      </div>
    </>
  );
}
