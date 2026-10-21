'use client';

import Link from 'next/link';
import { useEffect, useId, useState, type ReactNode } from 'react';
import { cx } from '@/lib/cx';
import { Icon } from '@/components/primitives/Icon';
import { SegmentedSwitch, type SwitchOption } from '@/components/patterns/SegmentedSwitch';
import styles from './SiteNav.module.css';

export type NavLink = { label: string; href: string };

export type SiteNavLabels = {
  openMenu: string;
  closeMenu: string;
  nav: string;
  switch: string;
  home: string;
};

type Props = {
  brand: string;
  brandHref: string;
  switchOptions: readonly SwitchOption[];
  current: string;
  links: readonly NavLink[];
  action?: ReactNode;
  height?: 'default' | 'store';
  labels: SiteNavLabels;
};

/** Sticky nav. Below 900px the links move into a disclosure panel opened by the menu button. */
export function SiteNav({ brand, brandHref, switchOptions, current, links, action, height = 'default', labels }: Props) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const linkList = (className: string) => (
    <ul className={className}>
      {links.map((l) => (
        <li key={l.href}>
          <a href={l.href} className={styles.link} onClick={() => setOpen(false)}>
            {l.label}
          </a>
        </li>
      ))}
    </ul>
  );

  return (
    <header className={cx(styles.root, styles[height])}>
      <div className={styles.bar}>
        <Link href={brandHref} className={styles.brand} aria-label={labels.home}>
          {brand}
        </Link>
        <SegmentedSwitch
          options={switchOptions}
          current={current}
          ariaLabel={labels.switch}
          className={styles.switch}
        />
        <nav aria-label={labels.nav} className={styles.desktopNav}>
          {linkList(styles.links)}
        </nav>
        {action && <div className={styles.action}>{action}</div>}
        <button
          type="button"
          className={styles.menuButton}
          aria-expanded={open}
          aria-controls={panelId}
          aria-label={open ? labels.closeMenu : labels.openMenu}
          onClick={() => setOpen((o) => !o)}
        >
          <Icon name={open ? 'close' : 'menu'} size="md" />
        </button>
      </div>
      <nav id={panelId} aria-label={labels.nav} className={cx(styles.panel, open && styles.panelOpen)} hidden={!open}>
        {linkList(styles.panelLinks)}
      </nav>
    </header>
  );
}
