'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { PageShell } from '@/components/layout/PageShell';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { Cart } from '@/components/sections/existencia/Cart';
import { CartButton } from '@/components/sections/existencia/CartButton';
import { ListFab } from '@/components/sections/existencia/ListFab';
import { TallerNav } from '@/components/sections/shared/TallerNav';
import { encargo } from '@/content/encargo';
import { existencia } from '@/content/existencia';
import { site, type SwitchKey } from '@/content/site';
import { ui } from '@/content/ui';
import { SideSkeleton } from './SideSkeleton';
import { CartProvider } from '@/lib/cart/CartContext';
import { warmProducts } from '@/lib/useProducts';

const FOOTER_LOGO = { src: '/brand/logo-nuva-gris.png', width: 800, height: 244 } as const;

/** The side comes from the URL (not local state), so back/forward and direct links always match the page. */
export function sideFromPathname(pathname: string): SwitchKey {
  return pathname === '/existencia' || pathname.startsWith('/existencia/') ? 'existencia' : 'encargo';
}

/** Chrome shared by /encargo and /existencia: theme, nav with the switch, footer, and the cart. */
export function SiteFrame({ children }: { children: ReactNode }) {
  const pathSide = sideFromPathname(usePathname());
  // Set the moment the switch is clicked, before the other page has loaded. It only counts while the URL is still
  // on the side it was set from, so it clears itself once the new page arrives (and on back/forward).
  const [pending, setPending] = useState<{ target: SwitchKey; from: SwitchKey } | null>(null);
  const target = pending && pending.from === pathSide ? pending.target : null;
  const side = target ?? pathSide;
  const loading = target !== null;
  const isStore = side === 'existencia';

  // Safety net: if the page never arrives, drop the optimistic state and show the current page again.
  useEffect(() => {
    if (!loading) return;
    const timer = window.setTimeout(() => setPending(null), 10_000);
    return () => window.clearTimeout(timer);
  }, [loading]);

  // Load the catalog in the background so /existencia opens with products already there.
  useEffect(() => {
    warmProducts();
  }, []);

  return (
    <CartProvider>
      <PageShell
        theme="taller"
        side={side}
        skipLabel={ui.skipToContent}
        nav={
          <TallerNav
            current={side}
            links={isStore ? existencia.nav.links : encargo.nav.links}
            action={isStore ? <CartButton /> : undefined}
            whatsappMessage={isStore ? undefined : encargo.whatsapp.messages.general}
            onSwitch={(key) => setPending({ target: key as SwitchKey, from: pathSide })}
          />
        }
        footer={
          <SiteFooter
            brand={encargo.chrome.wordmark}
            logo={FOOTER_LOGO}
            brandHref="/"
            brandLabel={site.homeLabel}
            tagline={isStore ? site.storeTagline : site.tagline}
            copyright={site.copyright}
            links={site.social}
          />
        }
      >
        {loading ? <SideSkeleton /> : children}
      </PageShell>
      {isStore && !loading && (
        <>
          <Cart />
          <ListFab />
        </>
      )}
    </CartProvider>
  );
}
