/** Copy for the Entry screen (reference: Nuva Entrada.dc.html). */
export const entrada = {
  meta: {
    title: 'NUVA · Dos formas de comprar',
    description: 'Por encargo, con tu diseño, o en existencia, listo para enviar. Hecho en México.',
  },
  bar: { brand: 'NUVA', note: 'DOS FORMAS DE COMPRAR' },
  panels: [
    {
      key: 'encargo',
      theme: 'taller',
      href: '/encargo',
      tone: 'olive',
      eyebrow: 'Por encargo',
      titleLines: ['Hecho a', 'tu medida.'],
      body: 'Tú mandas el diseño y nosotros lo producimos. Bordado y estampado desde una pieza, con mockup antes de arrancar.',
      // TODO(confirm): one-line preview of each side (7-10 days, mockup first: facts already on the site).
      preview: 'Mockup antes de producir · 7-10 días',
      cue: 'Entrar al taller',
      // TODO(client): photo of the workshop or an embroidered piece.
      image: null as string | null,
      imageAlt: 'Foto del taller o de una pieza bordada',
    },
    {
      key: 'existencia',
      theme: 'taller',
      href: '/existencia',
      tone: 'wine',
      eyebrow: 'En existencia',
      titleLines: ['Listo para', 'enviar.'],
      // TODO(confirm): "Eliges, pagas…" (you choose, you pay) — v1 has no online payment.
      body: 'Catálogo con inventario y precio en vivo. Eliges, pagas y sale el mismo día.',
      // TODO(confirm): "24 h" and "15 días" must match the shipping and returns policy of /existencia.
      preview: 'Envío en 24 h · Cambios 15 días',
      cue: 'Ver la tienda',
      // TODO(client): photo of an in-stock product.
      image: null as string | null,
      imageAlt: 'Foto de producto en stock',
    },
  ],
  footer: {
    quote: 'Dos negocios, una misma marca. Nada te obliga a elegir de entrada.',
    columns: [
      { strong: 'Por encargo', text: ' es producción: tiempos de 7 a 10 días, mínimo de una pieza y cotización según el diseño.' },
      { strong: 'En existencia', text: ' es tienda: stock real, precio a la vista y compra inmediata.' },
    ],
    note: 'Ambas comparten taller, envíos y contacto.',
  },
} as const;
