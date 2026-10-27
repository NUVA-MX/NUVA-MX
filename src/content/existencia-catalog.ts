/** Copy for the catalog section on /existencia (products from the partner catalog). */
export const existenciaCatalog = {
  // TODO(client): section title, eyebrow and aside.
  title: 'Más promocionales',
  // TODO(client): subtitle under the title.
  intro: 'Arma tu lista y te confirmamos precio y tiempo de entrega por WhatsApp.',
  filters: {
    // TODO(client): filter labels.
    searchLabel: 'Buscar',
    searchPlaceholder: 'Nombre, código o categoría',
    chipsLabel: 'Categorías',
    subcategoryLabel: 'Subcategoría',
    allCategories: 'Todas',
    allSubcategories: 'Todas',
    clear: 'Limpiar filtros',
    // TODO(client): sort labels (price options only show when prices are visible).
    sortLabel: 'Ordenar',
    sort: { name: 'Nombre', price_asc: 'Precio: menor a mayor', price_desc: 'Precio: mayor a menor' },
    groupLabel: 'Filtros del catálogo',
  },
  count: { one: '{n} producto', other: '{n} productos', none: 'Sin resultados', note: 'No incluye personalización' },
  // TODO(client): loading, empty and error states.
  loading: 'Cargando catálogo…',
  empty: 'No encontramos productos con esos filtros.',
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
    meta: '{code} · {subcategory}',
    add: '+',
    inList: '✓',
    addAria: 'Agregar {name} a mi lista',
    inListAria: 'Quitar {name} de mi lista',
    viewDetailAria: 'Ver detalle de {name}',
  },
  envios: {
    designTitle: '¿Algo con tu diseño?',
    designBody: 'Gorras y prendas personalizadas viven en Merch.',
  },
  fab: { label: 'Pedir mi lista por WhatsApp' },
  detail: {
    // TODO(client): detail labels.
    loading: 'Cargando producto…',
    error: { title: 'No pudimos cargar este producto.', body: 'Cierra e inténtalo de nuevo.' },
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
    add: 'Añadir a mi lista',
    added: 'En tu lista · {n}',
    addAria: 'Añadir {name} en {tone} a mi lista',
    outNotice: 'Este color está agotado. Pregúntanos por otras opciones.',
    noVariants: 'Consulta los colores disponibles por WhatsApp.',
    ask: 'Preguntar por WhatsApp',
    // TODO(client): WhatsApp question about a catalog product.
    askTemplate: 'Hola Nuva, quiero información de "{name}" (código {code}).',
    notice: 'Precio y tiempo de entrega por confirmar',
    // TODO(client): note under the price.
    priceNote: 'No incluye personalización',
    // TODO(client): shown instead of `notice` when the price is visible.
    noticeWithPrice: 'Tiempo de entrega por confirmar',
  },
  // Name of the line in "Mi lista" and in the WhatsApp message: "{name} · {tone} ({code})".
  listItemName: '{name} · {tone} ({code})',
} as const;
