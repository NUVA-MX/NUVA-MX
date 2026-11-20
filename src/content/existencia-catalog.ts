/** Copy for the catalog section on /existencia (products from the partner catalog). */
export const existenciaCatalog = {
  // TODO(client): section title, eyebrow and aside.
  title: 'Explora el catálogo',
  // TODO(client): subtitle under the title.
  intro: 'Arma tu lista y solicita una cotización con precio presonalizado y tiempo estimado de entrega.',
  filters: {
    // TODO(client): filter labels.
    searchLabel: 'Buscar producto o código',
    searchPlaceholder: 'Buscar producto o código',
    searchClear: 'Borrar búsqueda',
    categoryHeading: 'Categoría',
    filtersButton: 'Filtros',
    filtersTitle: 'Filtros',
    closeFilters: 'Cerrar filtros',
    apply: 'Aplicar',
    sidebarLabel: 'Filtros del catálogo',
    allCategories: 'Todas',
    sortLabel: 'Ordenar',
    sort: { name: 'Nombre A–Z', name_desc: 'Nombre Z–A', price_asc: 'Precio menor a mayor', price_desc: 'Precio mayor a menor' },
    clear: 'Limpiar filtros',
  },
  count: { one: '{n} producto', other: '{n} productos', none: 'Sin resultados', showing: 'Mostrando {from}–{to} de {total}' },
  // TODO(client): shown at the right of the results row when prices are visible.
  priceNote: 'Precios sin personalización',
  // TODO(client): loading, empty and error states.
  loading: 'Cargando catálogo…',
  empty: 'Sin resultados para esta búsqueda.',
  // TODO(client): shown when there are no filters and the catalog has no products yet.
  emptyCatalog: 'Estamos actualizando el catálogo. Vuelve en unos minutos.',
  error: {
    title: 'No pudimos cargar el catálogo.',
    body: 'Revisa tu conexión e inténtalo de nuevo.',
    retry: 'Reintentar',
  },
  // TODO(client): page controls.
  pagination: { label: 'Páginas del catálogo', prev: 'Anterior', next: 'Siguiente', pageAria: 'Ir a la página {n}' },
  // TODO(client): availability labels (stock is only ever shown in these coarse steps).
  availability: {
    available: 'Disponible',
    low: 'Pocas piezas',
    out: 'Agotado',
    unknown: 'Por confirmar',
  },
  card: {
    add: '+ Agregar a mi lista',
    // TODO(client): shown in the burgundy pill when a several-color product is in the list ({n} pieces).
    inList: 'En mi lista · {n}',
    // Next to the piece count in the stepper of a one-color product in the list.
    inListCount: 'en tu lista',
    perPiece: '/ pieza',
    quote: 'Precio por cotización',
    // Small tag next to a published price: it is the price before personalization and shipping.
    priceTag: 'Antes de personalizar',
    addAria: 'Agregar {name} a mi lista',
    inListAria: '{name}: {n} en mi lista, ver detalle',
    qtyAria: 'Cantidad de {name}',
    decreaseAria: 'Restar una pieza de {name}',
    increaseAria: 'Sumar una pieza de {name}',
    viewDetailAria: 'Ver detalle de {name}',
  },
  // TODO(client): list drawer additions.
  drawer: {
    titleCount: 'Mi lista · {n}',
    subtotal: 'Subtotal estimado',
    priceTag: 'Antes de personalizar',
    // Shown under the subtotal when some pieces have no published price and are left out of it.
    unpricedNote: 'No incluye piezas con precio por cotización.',
    shippingNote: 'Envío y personalización se calculan después.',
    buy: 'Comprar al precio publicado',
    quote: 'Cotizar con mi logo por WhatsApp',
    skuLine: '{sku} · {price}',
  },
  envios: {
    designTitle: '¿Algo con tu diseño?',
    designBody: 'Descubre nuestra línea de playeras, sudaderas, gorras, tote bags y más, hechas para llevar tu estilo o el de tu marca.',
  },
  // WhatsApp quote message: every line shows the code, the name and the quantity.
  quoteMessage: {
    header: 'Hola Nuva, quiero cotizar con mi logo estos productos:',
    line: '• {code} · {name} · {qty} pzs',
    lineNoCode: '• {name} · {qty} pzs',
  },
  fab: { label: 'Pedir mi lista por WhatsApp' },
  detail: {
    // TODO(client): detail labels.
    loading: 'Cargando producto…',
    error: { title: 'No pudimos cargar los detalles.', body: 'Revisa tu conexión e inténtalo de nuevo.', retry: 'Reintentar' },
    // TODO(client): read by screen readers while the detail loads.
    loadingDetails: 'Cargando detalles…',
    code: 'Código {code}',
    description: 'Descripción',
    specsTitle: 'Ficha técnica',
    specs: {
      material: 'Material',
      size: 'Medidas',
      weight: 'Peso',
      printTechnique: 'Técnica de impresión',
      printArea: 'Área de impresión',
      packQty: 'Piezas por caja',
    },
    gallery: 'Fotos del producto',
    photoAlt: '{name}, foto {n} de {total}',
    colorsLabel: 'Color',
    colorsSelected: 'Color: {tone}',
    colorsNone: 'Elige un color',
    colorOut: '{tone} (agotado)',
    quantity: 'Cantidad',
    add: 'Añadir a mi lista',
    added: 'En tu lista · {n}',
    addAria: 'Añadir {name} en {tone} a mi lista',
    outNotice: 'Este color está agotado. Pregúntanos por otras opciones.',
    noVariants: 'Consulta los colores disponibles por WhatsApp.',
    notice: 'Precio y tiempo de entrega por confirmar',
    priceTag: 'Antes de personalizar',
    // TODO(client): shown instead of `notice` when the price is visible.
    noticeWithPrice: 'Tiempo de entrega por confirmar',
  },
  // Name of the line in "Mi lista" and in the WhatsApp message: "{name} · {tone} ({code})".
  listItemName: '{name} · {tone} ({code})',
} as const;
