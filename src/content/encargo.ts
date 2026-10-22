import { proceso } from './encargo-proceso';
import { stickyWhatsapp, whatsappMessages } from './encargo-whatsapp';

/** Copy for the Made to order page (reference: Nuva Sitio.dc.html). */
export const encargo = {
  meta: {
    title: 'Merch · NUVA',
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
      { label: 'Descubre el proceso', href: '#proceso' },
      { label: 'Made by us', href: '#proyectos' },
      { label: 'Sobre nosotros', href: '#taller' },
    ],
    whatsapp: 'WhatsApp',
  },
  hero: {
    title: 'Merch con identidad.',
    // TODO(confirm): says up front that there is no cart here.
    note: 'Aquí no hay carrito: cuéntanos tu idea por WhatsApp y te mandamos mockup y precio.',
    primary: { label: 'Hagámoslo realidad', href: '#contacto' },
    // The story is now "how we make it": the secondary action scrolls to the walkthrough.
    secondary: { label: 'Descubre el Proceso', href: '#proceso' },
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
      { text: 'Cada proyecto es diferente, por eso nos adaptamos a tus ideas. ' },
      { text: 'Tú eliges el producto ', strong: true },
      { text: ' y nosotros nos encargamos de personalizarlo para ti' },
      { text: '.' },
    ] as { text: string; strong?: boolean }[],
  },
  queHacemos: {
    eyebrow: 'Made by us',
    // TODO(confirm): title.
    title: 'From brand To product',
    // TODO(confirm): paragraph about products and techniques.
    body: 'Desde merch personalizado hasta regalos corporativos, creamos productos que reflejan la esencia de cada marca. Cada proyecto es diferente y cuidamos los detalles para lograr un resultado único.',
    cta: { label: 'Get inspired', href: '#proyectos' },
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
    title: 'Cuatro formas de llevar tu diseño',
    // TODO(client): one portrait (4:5) photo per technique.
    items: [
      {
        id: 'bordado',
        name: 'Bordado',
        fact: 'Textura y acabados de calidad que destacan cada detalle',
        image: null as string | null,
        imageAlt: 'Detalle de un bordado',
        label: 'Foto: bordado de cerca',
      },
      {
        id: 'estampado',
        name: 'Estampado',
        fact: 'Diseños a todo color con gran definición',
        image: null as string | null,
        imageAlt: 'Prenda con estampado DTF a todo color',
        label: 'Foto: estampado DTF terminado',
      },
      {
        id: 'serigrafia',
        name: 'Serigrafía',
        fact: 'Ideal para personalizar grandes cantidades',
        image: null as string | null,
        imageAlt: 'Lote de piezas con serigrafía',
        label: 'Foto: lote en serigrafía',
      },
      {
        id: 'vinil',
        name: 'Vinil textil',
        fact: 'Ideal para diseños sencillos y colores sólidos',
        image: null as string | null,
        imageAlt: 'Prenda con diseño en vinil textil',
        label: 'Foto: prenda con vinil textil',
      },
    ],
  },
  projects: {
    eyebrow: 'Made by us',
    title: 'Creaciones con identidad',
    lead: 'Una selección de proyectos que hemos creado para diferentes marcas. Descubre las técnicas, los acabados y las posibilidades de personalización que ofrecemos.',
    aside: 'Desliza para ver más →',
    railLabel: 'Lista de proyectos, desliza para ver más',
    modal: {
      labels: {
        technique: 'Técnica',
        minimum: 'Piezas mínimas',
        colors: 'Colores',
        delivery: 'Entrega',
      },
      order: 'Hagámoslo realidad',
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
    lines: ['Personalizamos desde pocas piezas hasta grandes cantidades, con precios especiales por volumen.'],
    cta: 'Cotiza tu proyecto',
    // TODO(confirm): WhatsApp message to quote a team order (asks for piece, technique, quantity and date).
    ctaMessage: whatsappMessages.equipo,
  },
  proceso,
  whatsapp: { messages: whatsappMessages, sticky: stickyWhatsapp },
  taller: {
    eyebrow: 'Sobre nosotros',
    title: 'El equipo detrás de tus ideas',
    // TODO(confirm): paragraph about the workshop (draft using facts already on the site).
    paragraph:
      'Nuva nació de nuestra pasión por crear y personalizar. Lo que comenzó con una idea se convirtió en un espacio donde ayudamos a otras marcas a dar vida a las suyas. Nos encanta ser parte de cada proyecto, transformar diseños en productos reales y ver la emoción de nuestros clientes al recibir algo que antes solo imaginaban. Cada proyecto es diferente, y eso es lo que más nos gusta de lo que hacemos.',
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
    body: 'Cuéntanos qué tienes en mente y te ayudamos a encontrar las mejores opciones de productos y personalización para tu proyecto.',
    whatsapp: 'Escríbenos por WhatsApp →',
    email: 'Mandar correo',
  },
  crossLink: {
    eyebrow: 'Promocionales',
    title: 'Tu marca en todas partes.',
    body: 'Descubre nuestra variedad de artículos promocionales y regalos corporativos. Personalizamos cada producto para adaptarlo a tu marca, equipo o evento.',
    cue: 'Explora los promocionales →',
    href: '/existencia',
    // TODO(client): photo of an in-stock product.
    image: null as string | null,
    imageAlt: 'Foto de producto promocional',
    label: 'Foto: producto promocional',
  },
} as const;
