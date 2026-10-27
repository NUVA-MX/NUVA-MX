// Development fixture (no remote images, no real supplier data). Served only when there is no database.
import type { CatalogAvailability, CatalogDetail, CatalogSpecs, CatalogVariant } from './types';

const noSpecs: CatalogSpecs = { material: null, size: null, weight: null, printTechnique: null, printArea: null, packQty: null };

function variant(code: string, tone: string, hex: string | null, availability: CatalogAvailability): CatalogVariant {
  return { code, tone, hex, image: null, availability };
}

function item(
  code: string,
  name: string,
  category: string,
  subcategory: string,
  variants: CatalogVariant[],
  availability: CatalogAvailability,
  specs: Partial<CatalogSpecs> = {},
): CatalogDetail {
  return {
    code,
    name,
    category,
    subcategory,
    image: null,
    colors: variants.slice(0, 12).map(({ tone, hex }) => ({ tone, hex })),
    variantCount: variants.length,
    availability,
    price: null,
    description: `${name}. Producto de muestra para desarrollo.`,
    images: [],
    variants,
    specs: { ...noSpecs, ...specs },
  };
}

export const sampleCatalog: readonly CatalogDetail[] = [
  item('TH-239', 'Audífonos plegables', 'Tecnología', 'Audífonos', [
    variant('TH-239A', 'AZUL CLARO', '#7FB3E6', 'available'),
    variant('TH-239N', 'NEGRO', '#1A1A1A', 'available'),
    variant('TH-239R', 'ROJO', '#C62828', 'out'),
  ], 'available', { material: 'Plástico', printTechnique: 'Tampografía' }),
  item('BE-004', 'Pastillero redondo', 'Cuidado Personal', 'Pastilleros', [
    variant('BE-004R', 'ROJO', '#C62828', 'available'),
    variant('BE-004A', 'AZUL MARINO', '#1F3A66', 'low'),
  ], 'low', { material: 'Plástico', size: '7 cm.' }),
  item('BE-006', 'Espejo redondo', 'Belleza', 'Espejos', [variant('BE-006RS', 'ROSA', '#F4A6C0', 'available')], 'available'),
  item('HG-110', 'Contenedor de alimentos', 'Hogar', 'Contenedores de alimento', [variant('HG-110T', 'TRANSPARENTE', null, 'unknown')], 'unknown'),
  item('HG-122', 'Juego de cubiertos', 'Hogar', 'Cubiertos', [variant('HG-122P', 'PLATA', '#C0C0C0', 'out')], 'out'),
  item('LB-031', 'Libreta ecológica', 'Libretas', 'Ecológicas', [
    variant('LB-031K', 'KRAFT', '#B08968', 'available'),
    variant('LB-031V', 'VERDE', '#4C8C4A', 'available'),
  ], 'available', { material: 'Cartón reciclado' }),
  item('VJ-208', 'Mochila deportiva', 'Viaje', 'Mochilas y maletas', [variant('VJ-208G', 'GRIS', '#808080', 'available')], 'available'),
  item('BB-015', 'Termo de acero', 'Bebidas', 'Termos', [
    variant('BB-015A', 'AZUL', '#006CBA', 'available'),
    variant('BB-015B', 'BLANCO', '#FFFFFF', 'low'),
  ], 'low', { material: 'Acero inoxidable', size: '500 ml' }),
];
