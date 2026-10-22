/** Copy for the Entry screen (reference: Nuva Entrada.dc.html). */
export const entrada = {
  meta: {
    title: 'NUVA · Dos formas de comprar',
    description: 'Por encargo, con tu diseño, o en existencia, listo para enviar. Hecho en México.',
  },
  bar: { brand: 'NUVA', note: 'FROM BRAND → TO PRODUCT' },
  panels: [
    {
      key: 'encargo',
      theme: 'taller',
      href: '/encargo',
      tone: 'olive',
      eyebrow: 'Merch',
      titleLines: ['Merch con', 'identidad.'],
      body: 'Textiles y accesorios personalizados.',
      cue: 'Hazlo tuyo',
      image: '/photos/entrada-encargo.jpg' as string | null,
      imageAlt: 'Sudadera crema doblada junto a una tote bag verde olivo',
    },
    {
      key: 'existencia',
      theme: 'taller',
      href: '/existencia',
      tone: 'wine',
      eyebrow: 'Promocionales',
      titleLines: ['Tu marca,', 'en todo.'],
      body: 'Artículos que hacen presente tu marca.',
      cue: 'Descubre más',
      image: '/photos/entrada-existencia.jpg' as string | null,
      imageAlt: 'Libreta de espiral y botella térmica en tono vino',
      ribbon: '/brand/cinta-from-brand.png',
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
