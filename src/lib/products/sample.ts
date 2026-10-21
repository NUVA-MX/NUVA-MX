// SAMPLE DATA — not real inventory
// (reference: STOCK in Nuva Tienda.dc.html). Used in development without DATABASE_URL and by db:seed.
import type { Product } from './types';

// TODO(confirm): categories derived from the name, not confirmed by the client.
export const sampleProducts: Product[] = [
  { id: 'gorra-negra', name: 'Gorra clásica negra', meta: 'TALLA ÚNICA · ALGODÓN', price: 390, stock: 14, image: null, imageAlt: 'Foto de gorra clásica negra', category: 'gorras' },
  { id: 'gorra-arena', name: 'Gorra clásica arena', meta: 'TALLA ÚNICA · ALGODÓN', price: 390, stock: 6, image: null, imageAlt: 'Foto de gorra clásica arena', category: 'gorras' },
  { id: 'trucker-azul', name: 'Trucker azul', meta: 'TALLA ÚNICA · MALLA', price: 420, stock: 3, image: null, imageAlt: 'Foto de trucker azul', category: 'gorras' },
  { id: 'playera-cruda', name: 'Playera cruda', meta: 'S A XL · 180 G', price: 450, stock: 22, image: null, imageAlt: 'Foto de playera cruda', category: 'playeras' },
  { id: 'playera-negra', name: 'Playera negra', meta: 'S A XL · 180 G', price: 450, stock: 9, image: null, imageAlt: 'Foto de playera negra', category: 'playeras' },
  { id: 'sudadera-marino', name: 'Sudadera marino', meta: 'S A XL · FRANELA', price: 890, stock: 4, image: null, imageAlt: 'Foto de sudadera marino', category: 'sudaderas' },
  { id: 'gorro-verde', name: 'Gorro verde', meta: 'TALLA ÚNICA · TEJIDO', price: 320, stock: 0, image: null, imageAlt: 'Foto de gorro verde', category: 'accesorios' },
  { id: 'tote-crudo', name: 'Tote crudo', meta: '38 × 42 CM · LONA', price: 280, stock: 17, image: null, imageAlt: 'Foto de tote crudo', category: 'accesorios' },
];
