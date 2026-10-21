import type { ReactNode } from 'react';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { SiteNav, type NavLink } from '@/components/layout/SiteNav';
import { site, type SwitchKey } from '@/content/site';
import { ui } from '@/content/ui';

type NavProps = {
  current: SwitchKey;
  links: readonly NavLink[];
  action?: ReactNode;
  height?: 'default' | 'store';
};

/** SiteNav filled from site/ui content. */
export function SideNav({ current, links, action, height }: NavProps) {
  return (
    <SiteNav
      brand={site.brand}
      brandHref="/"
      switchOptions={site.switch}
      current={current}
      links={links}
      action={action}
      height={height}
      labels={{
        openMenu: ui.openMenu,
        closeMenu: ui.closeMenu,
        nav: ui.mainNav,
        switch: site.switchLabel,
        home: site.homeLabel,
      }}
    />
  );
}

/** SiteFooter filled from site content. */
export function SideFooter({ tagline }: { tagline: string }) {
  return (
    <SiteFooter
      brand={site.brand}
      brandHref="/"
      brandLabel={site.homeLabel}
      tagline={tagline}
      copyright={site.copyright}
      links={site.social}
    />
  );
}
