import type { Metadata } from 'next';
import { Catalog } from '@/components/sections/existencia/Catalog';
import { Envios } from '@/components/sections/existencia/Envios';
import { Hero } from '@/components/sections/existencia/Hero';
import { PromoCarousel } from '@/components/sections/existencia/PromoCarousel';
import { Products } from '@/components/sections/existencia/Products';
import { existencia } from '@/content/existencia';
import { getEncargoPage } from '@/server/content/encargo';

export const metadata: Metadata = {
  title: existencia.meta.title,
  description: existencia.meta.description,
};

// Static page (ISR): the carousel photos come from the admin (encargo content). Saving in the admin calls
// revalidatePath('/existencia'); the 5 minute window is the safety net. Without a database the defaults render.
export const revalidate = 300;

// Theme, nav, footer and the cart come from the shared (site) layout, so switching sides does not remount them.
export default async function ExistenciaPage() {
  const { content } = await getEncargoPage();
  return (
    <>
      <Hero />
      <Products />
      <Catalog />
      <PromoCarousel content={content.promoCarousel} />
      <Envios />
    </>
  );
}
