// Trimmed, credential-free shapes of the supplier rows (names and codes are made up).
import { SUPPLIER_IMAGE_HOST, SUPPLIER_IMAGE_PATH_PREFIX } from '@/lib/catalog/images';
import type { InnovationProduct, InnovationStockProduct } from '@/server/integrations';

export const IMG = (name: string): string => `https://${SUPPLIER_IMAGE_HOST}${SUPPLIER_IMAGE_PATH_PREFIX}${name}.jpg`;

export function product(code: string, over: Partial<InnovationProduct> = {}): InnovationProduct {
  return {
    Codigo: code,
    Nombre: `Producto ${code}`,
    Descripcion: 'Descripción de prueba',
    Categoria: ['Hogar'],
    SubCategorias: ['Cocina'],
    ImagenP: IMG(code),
    ImagenesC: [IMG(`${code}-1`)],
    Variantes: [
      { 'Codigo Variante': `${code}A`, Tono: 'AZUL', Imagen: IMG(`${code}A`) },
      { 'Codigo Variante': `${code}R`, Tono: 'ROJO', Imagen: IMG(`${code}R`) },
    ],
    Precio: '13.45',
    'Medidas producto': '7 cm.',
    'Cantidad empaque': '500',
    PesoProducto: '0.026  kg.',
    AreaDeImpresion: '3 cm.',
    Materiales: ['Plástico'],
    TecnicasImpresion: ['Serigrafía'],
    ...over,
  };
}

export function stockRow(code: string, total: string, variants: Record<string, string> = {}): InnovationStockProduct {
  return {
    Codigo: code,
    Stock: total,
    Variantes: Object.entries(variants).map(([c, s]) => ({ 'Codigo Variante': c, Stock: s })),
  };
}

export const codes = (n: number, prefix = 'AA-'): string[] => Array.from({ length: n }, (_, i) => `${prefix}${String(i).padStart(3, '0')}`);
