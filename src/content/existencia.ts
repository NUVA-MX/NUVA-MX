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
    cart: 'Carrito ({count})',
    cartAria: 'Abrir carrito, {count} piezas',
  },
  hero: {
    eyebrow: 'Promocionales',
    titleLines: ['Listo para', 'enviar'],
    body: 'Stock real, precio a la vista y salida el mismo día. Sin cotización ni espera de producción.',
    // TODO(client): confirm the three short hero facts.
    facts: [
      'Envío en 24 h',
      // v1 has no online payment: orders and payment are arranged on WhatsApp.
      'Pedido por WhatsApp',
      'Cambios 15 días',
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
    addAria: 'Añadir {name} al carrito',
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
    title: 'Tu pedido',
    empty: 'Tu carrito está vacío.',
    emptyCta: 'Ver productos',
    total: 'Total estimado',
    send: 'Enviar pedido por WhatsApp',
    note: 'Te confirmamos disponibilidad, envío y pago por WhatsApp.',
    remove: 'Quitar',
    removeAria: 'Quitar {name} del carrito',
    qty: 'Cantidad',
    increase: 'Sumar una pieza de {name}',
    decrease: 'Restar una pieza de {name}',
    noPrice: 'Precio por confirmar',
    // TODO(confirm): notices when the saved cart changes against live inventory.
    changesTitle: 'Actualizamos tu carrito con el inventario actual:',
    changes: {
      removed: '"{name}" ya no está disponible y lo quitamos de tu carrito.',
      soldOut: '"{name}" se agotó y lo quitamos de tu carrito.',
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
