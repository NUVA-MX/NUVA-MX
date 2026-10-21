import { proceso } from './encargo-proceso';
import { stickyWhatsapp, whatsappMessages } from './encargo-whatsapp';

/** Copy for the Made to order page (reference: Nuva Sitio.dc.html). */
export const encargo = {
  meta: {
    title: 'Por encargo · NUVA',
    description:
      'Así hacemos tu pieza personalizada, paso a paso: del diseño al mockup, del taller a tu puerta. Pide por WhatsApp, desde una pieza.',
  },
  announcement: 'Desde 1 pieza. Pídelo por WhatsApp.',
  chrome: {
    // Serif, lowercase logotype; the accessible label is still site.homeLabel.
    wordmark: 'nuva',
  },
  nav: {
    links: [
      { label: 'Cómo lo hacemos', href: '#proceso' },
      { label: 'Proyectos', href: '#proyectos' },
      { label: 'Taller', href: '#taller' },
    ],
    whatsapp: 'WhatsApp',
  },
  hero: {
    title: 'Hecho a tu medida.',
    // TODO(confirm): says up front that there is no cart here.
    note: 'Aquí no hay carrito: cuéntanos tu idea por WhatsApp y te mandamos mockup y precio.',
    primary: { label: 'Pedir por WhatsApp', href: '#contacto' },
    // The story is now "how we make it": the secondary action scrolls to the walkthrough.
    secondary: { label: 'Cómo lo hacemos', href: '#proceso' },
    // TODO(client): full-width main photo (a person wearing a NUVA cap or garment).
    image: null as string | null,
    imageAlt: 'Persona usando una gorra NUVA',
    // Image placeholder text until there is a photo.
    label: 'Foto: persona usando una gorra o prenda NUVA',
  },
  marquee: 'Tu diseño, nuestro taller.',
  // TODO(confirm): intro copy (draft using facts already on the site).
  intro: {
    parts: [
      { text: 'No vendemos catálogo cerrado. Eliges la pieza, mandas tu arte y la producimos, sean ' },
      { text: 'una o doscientas', strong: true },
      { text: '. Antes de producir te mandamos un mockup para que veas ' },
      { text: 'cómo va a quedar', strong: true },
      { text: '.' },
    ] as { text: string; strong?: boolean }[],
  },
  queHacemos: {
    eyebrow: 'Lo que hacemos',
    // TODO(confirm): title.
    title: 'Piezas con tu diseño, hechas aquí',
    // TODO(confirm): paragraph about products and techniques.
    body: 'Gorras, playeras, sudaderas, totes y parches. Bordado para lo que tiene que durar, estampado DTF para el color completo y serigrafía para lotes.',
    cta: { label: 'Ver proyectos', href: '#proyectos' },
    // TODO(client): three photos for the composition (one square, two portrait).
    images: [
      { image: null as string | null, imageAlt: 'Composición de gorras NUVA', label: 'Composición: gorras' },
      { image: null as string | null, imageAlt: 'Detalle de un bordado', label: 'Detalle de bordado' },
      { image: null as string | null, imageAlt: 'Playera doblada con estampado', label: 'Playera doblada' },
    ],
  },
  tecnicas: {
    eyebrow: 'Técnicas',
    // TODO(confirm): title.
    title: 'Tres formas de llevar tu diseño',
    // TODO(client): one portrait (4:5) photo per technique.
    items: [
      {
        id: 'bordado',
        name: 'Bordado',
        fact: 'Hasta 8 cm, también en 3D',
        image: null as string | null,
        imageAlt: 'Detalle de un bordado',
        label: 'Foto: bordado de cerca',
      },
      {
        id: 'estampado',
        name: 'Estampado',
        fact: 'DTF a todo color',
        image: null as string | null,
        imageAlt: 'Prenda con estampado DTF a todo color',
        label: 'Foto: estampado DTF terminado',
      },
      {
        id: 'serigrafia',
        name: 'Serigrafía',
        fact: 'Desde 20 piezas',
        image: null as string | null,
        imageAlt: 'Lote de piezas con serigrafía',
        label: 'Foto: lote en serigrafía',
      },
    ],
  },
  projects: {
    eyebrow: 'Muestra de trabajo',
    title: 'Proyectos hechos',
    lead: 'Una muestra de trabajos reales, no una tienda: para pedir algo parecido, escríbenos por WhatsApp.',
    aside: 'Desliza para ver más →',
    railLabel: 'Lista de proyectos, desliza para ver más',
    modal: {
      labels: {
        technique: 'Técnica',
        minimum: 'Piezas mínimas',
        colors: 'Colores',
        delivery: 'Entrega',
      },
      order: 'Pedir por WhatsApp',
      quote: 'Cotizar por lote',
    },
    // TODO(confirm)
    cardCta: 'Ver y pedir',
    // TODO(confirm): WhatsApp message copy sent from a project.
    whatsappTemplate: 'Hola Nuva, me interesa algo como "{name}".',
    // TODO(confirm): message for a bulk quote.
    quoteTemplate: 'Hola Nuva, quiero cotizar un lote parecido a "{name}".',
  },
  equipos: {
    eyebrow: 'Pedidos para equipos',
    carouselLabel: 'Fotos de pedidos para equipos',
    // TODO(client): four landscape photos of orders for teams, brands or events.
    slides: [
      { image: null as string | null, imageAlt: 'Equipo con sudaderas bordadas', label: 'Foto: equipo con sudaderas bordadas' },
      { image: null as string | null, imageAlt: 'Staff de café con gorras', label: 'Foto: staff de café con gorras' },
      { image: null as string | null, imageAlt: 'Merch de banda', label: 'Foto: merch de banda' },
      { image: null as string | null, imageAlt: 'Totes para evento', label: 'Foto: totes para evento' },
    ],
    // TODO(confirm): title and phrases (facts taken from the previous contact block).
    title: 'Para tu equipo, marca o evento',
    lines: ['Desde 20 piezas hay descuento por volumen.', 'Te mandamos un mockup del lote antes de producir.'],
    cta: 'Cotiza tu proyecto',
    // TODO(confirm): WhatsApp message to quote a team order (asks for piece, technique, quantity and date).
    ctaMessage: whatsappMessages.equipo,
  },
  proceso,
  whatsapp: { messages: whatsappMessages, sticky: stickyWhatsapp },
  taller: {
    eyebrow: 'El taller',
    title: 'Piezas que se hacen, no que se revenden',
    // TODO(confirm): paragraph about the workshop (draft using facts already on the site).
    paragraph:
      'Cada pieza se borda o se estampa en nuestro taller en México, desde una sola hasta lotes grandes. No revendemos catálogo: producimos lo que nos pides.',
    // TODO(client): portrait photo of the workshop or the team.
    image: null as string | null,
    imageAlt: 'El taller de NUVA',
    label: 'Foto: el taller o el equipo',
    stats: [
      // TODO(client): add real numbers (pieces made, clients) once the client provides them; never publish "XX".
      { value: '7-10', label: 'Días de entrega' },
      // TODO(confirm)
      { value: 'Desde 1', label: 'Pieza por pedido' },
    ] as { value: string; label: string }[],
  },
  contacto: {
    title: '¿Tienes una idea?',
    body: 'Los pedidos se hacen por mensaje: manda el diseño o la referencia y te contestamos el mismo día con técnica, tiempos y precio.',
    whatsapp: 'Escribir por WhatsApp',
    email: 'Mandar correo',
  },
  crossLink: {
    eyebrow: 'El otro lado de NUVA',
    title: '¿No quieres esperar?',
    body: 'Tenemos piezas en existencia, con precio a la vista y envío el mismo día. Mismo taller, sin tiempo de producción.',
    cue: 'Ver lo disponible →',
    href: '/existencia',
    // TODO(client): photo of an in-stock product.
    image: null as string | null,
    imageAlt: 'Foto de producto en existencia',
    label: 'Foto: producto en existencia',
  },
} as const;
