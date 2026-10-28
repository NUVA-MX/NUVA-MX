/** Copy for the In stock page (reference: Nuva Tienda.dc.html). */
export const existencia = {
  meta: {
    title: 'Promocionales · NUVA',
    description: 'Stock real, precio a la vista y salida el mismo día. Sin cotización ni espera de producción.',
  },
  // TODO(confirm): announcement copy (facts already on this page).
  announcement: 'Envío en 24 h. Pedido y pago por WhatsApp.',
  nav: {
    links: [
      { label: 'Productos', href: '#productos' },
      { label: 'Envíos', href: '#envios' },
    ],
    cart: 'Mi lista ({count})',
    cartAria: 'Abrir mi lista, {count} piezas',
  },
  hero: {
    eyebrow: 'Promocionales',
    titleLines: ['Listo para', 'enviar'],
    body: 'Stock real, precio a la vista y salida el mismo día. Sin cotización ni espera de producción.',
    // TODO(client): confirm the short hero facts.
    facts: [
      // v1 has no online payment: the saved list is sent and paid on WhatsApp.
      'Envías tu lista por WhatsApp',
    ],
    // TODO(client): photo of an in-stock product.
    image: null as string | null,
    imageAlt: 'Foto de producto en stock',
    cta: 'Ver productos',
  },
  products: {
    eyebrow: 'Tienda',
    title: 'Disponible ahora',
    aside: 'Inventario y precio en vivo',
    lowStockThreshold: 5,
    badge: { out: 'Agotado', low: 'Últimas {n}', ok: '{n} en stock' },
    button: { add: 'Añadir', added: 'Añadido · {n}', notify: 'Avísame' },
    noPrice: 'Precio por confirmar',
    addAria: 'Añadir {name} a mi lista',
    notifyAria: 'Avísame por WhatsApp cuando haya {name}',
    // TODO(confirm): "Avísame" (notify me) opens WhatsApp with this message.
    notifyTemplate: 'Hola Nuva, avísenme cuando vuelva a haber "{name}".',
    // TODO(confirm): copy for the loading, empty and error states.
    loading: 'Cargando productos…',
    empty: {
      title: 'Por ahora no hay promocionales disponibles.',
      body: 'Escríbenos y te decimos qué llega pronto o qué podemos hacer en Merch.',
      cta: 'Preguntar por WhatsApp',
    },
    error: {
      title: 'No pudimos cargar los productos.',
      body: 'Revisa tu conexión e inténtalo de nuevo.',
      retry: 'Reintentar',
    },
  },
  info: [
    {
      label: 'Envíos',
      body: 'Salida el mismo día en pedidos antes de las 2 pm. Entrega de 2 a 4 días hábiles en todo el país.',
    },
    {
      label: 'Cambios',
      body: 'Quince días para cambio de talla o color, siempre que la pieza no esté personalizada.',
    },
  ],
  crossLink: {
    eyebrow: '¿Quieres la tuya?',
    body: 'Si buscas una pieza con tu diseño, eso vive del otro lado.',
    cue: 'Ir a Merch →',
    href: '/encargo',
  },
  // TODO(confirm): all cart panel copy.
  cart: {
    title: 'Mi lista',
    empty: 'Tu lista está vacía.',
    emptyCta: 'Ver productos',
    total: 'Total estimado',
    send: 'Enviar lista por WhatsApp',
    note: 'Aquí no se paga: nos mandas tu lista por WhatsApp y ahí confirmamos disponibilidad, envío y pago.',
    remove: 'Quitar',
    removeAria: 'Quitar {name} de tu lista',
    qty: 'Cantidad',
    increase: 'Sumar una pieza de {name}',
    decrease: 'Restar una pieza de {name}',
    noPrice: 'Precio por confirmar',
    // TODO(confirm): notices when the saved cart changes against live inventory.
    changesTitle: 'Actualizamos tu lista con el inventario actual:',
    changes: {
      removed: '"{name}" ya no está disponible y lo quitamos de tu lista.',
      soldOut: '"{name}" se agotó y lo quitamos de tu lista.',
      qty: 'De "{name}" solo quedan {qty}; ajustamos la cantidad.',
      price: 'El precio de "{name}" cambió a {price}.',
      priceUnknown: 'El precio de "{name}" ahora está por confirmar.',
    },
    verifying: 'Revisando inventario…',
    unverified: 'No pudimos revisar el inventario en este momento; te confirmamos disponibilidad y precio por WhatsApp.',
  },
  // TODO(confirm): order message template.
  orderTemplate: {
    header: 'Hola Nuva, quiero hacer este pedido:',
    line: '{qty} × {name} — {price}',
    footer: 'Total estimado: {total}',
    noPrice: 'precio por confirmar',
  },
} as const;
