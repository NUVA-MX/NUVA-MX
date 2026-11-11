import type { Metadata } from 'next';
import { Catalog } from '@/components/sections/existencia/Catalog';
import { Envios } from '@/components/sections/existencia/Envios';
import { Hero } from '@/components/sections/existencia/Hero';
import { Products } from '@/components/sections/existencia/Products';
import { existencia } from '@/content/existencia';

export const metadata: Metadata = {
  title: existencia.meta.title,
  description: existencia.meta.description,
};

// Theme, nav, footer and the cart come from the shared (site) layout, so switching sides does not remount them.
export default function ExistenciaPage() {
  return (
    <>
      <Hero />
      <Products />
      <Catalog />
      <Envios />
    </>
  );
}
