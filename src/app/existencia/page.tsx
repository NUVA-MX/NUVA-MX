import type { Metadata } from 'next';
import { PageShell } from '@/components/layout/PageShell';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { Cart } from '@/components/sections/existencia/Cart';
import { CartButton } from '@/components/sections/existencia/CartButton';
import { Envios } from '@/components/sections/existencia/Envios';
import { Hero } from '@/components/sections/existencia/Hero';
import { Products } from '@/components/sections/existencia/Products';
import { AnnouncementBar } from '@/components/sections/shared/AnnouncementBar';
import { TallerNav } from '@/components/sections/shared/TallerNav';
import { encargo } from '@/content/encargo';
import { existencia } from '@/content/existencia';
import { site } from '@/content/site';
import { ui } from '@/content/ui';
import { CartProvider } from '@/lib/cart/CartContext';

export const metadata: Metadata = {
  title: existencia.meta.title,
  description: existencia.meta.description,
};

// Same theme and chrome as /encargo, so switching sides does not shift the page.
export default function ExistenciaPage() {
  return (
    <CartProvider>
      <PageShell
        theme="taller"
        side="existencia"
        skipLabel={ui.skipToContent}
        nav={
          <>
            <AnnouncementBar text={existencia.announcement} tag={site.sideTag.existencia} />
            <TallerNav current="existencia" links={existencia.nav.links} action={<CartButton />} />
          </>
        }
        footer={
          <SiteFooter
            brand={encargo.chrome.wordmark}
            brandHref="/"
            brandLabel={site.homeLabel}
            tagline={site.storeTagline}
            copyright={site.copyright}
            links={site.social}
          />
        }
      >
        <Hero />
        <Products />
        <Envios />
      </PageShell>
      <Cart />
    </CartProvider>
  );
}
