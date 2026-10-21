import { whatsappMessages } from './encargo-whatsapp';

export type ProcesoIcon = 'notebook' | 'cap' | 'line' | 'tee' | 'hoodie' | 'mug';

export type ProcesoStep = {
  id: string;
  title: string;
  body: string;
  /** Draft note for the admin; never shown on the public page. */
  label: string;
  icon: ProcesoIcon;
  /** Real photo (or null). While null the step shows a tinted block with its icon. */
  image: string | null;
  imageAlt: string;
  /** Optional text link to WhatsApp with a message that fits this step. */
  link?: { label: string; message: string };
  /** Step 5 only: show the three techniques under the text. */
  showTecnicas?: boolean;
};

// Walkthrough of how a piece is made (replaces the old three-card "Cómo funciona").
// TODO(confirm): every step below is drafted from facts already on the site (mockup before production, own workshop,
// bordado / DTF / serigrafía, 7-10 days, from one piece, WhatsApp contact). The client must confirm or rewrite them.
export const proceso = {
  eyebrow: 'Cómo lo hacemos',
  // TODO(confirm): title and lead.
  title: 'De tu idea a tu pieza, paso a paso',
  lead: 'Así trabajamos cada pedido en el taller, desde el primer mensaje hasta que la pieza llega a tus manos.',
  stepLabel: 'Paso',
  steps: [
    {
      id: 'idea',
      // TODO(confirm)
      title: 'Cuéntanos tu idea',
      body: 'Escríbenos por WhatsApp con tu diseño, una referencia o solo una idea suelta. Te contestamos el mismo día.',
      // TODO(client): photo of a conversation, sketch or reference board.
      label: 'Foto: bocetos o referencias sobre la mesa',
      icon: 'notebook',
      image: null,
      imageAlt: 'Bocetos y referencias sobre la mesa',
    },
    {
      id: 'pieza',
      // TODO(confirm)
      title: 'Elegimos la pieza',
      body: 'Gorra, playera, sudadera, tote o parche: modelo, color y talla. Todas admiten personalización y puedes pedir desde una sola.',
      // TODO(client): photo of the base pieces laid out.
      label: 'Foto: piezas base en el taller',
      icon: 'cap',
      image: null,
      imageAlt: 'Piezas base listas para personalizar',
      // TODO(confirm)
      link: { label: 'Preguntar por la pieza →', message: whatsappMessages.pieza },
    },
    {
      id: 'arte',
      // TODO(confirm)
      title: 'Preparamos tu arte',
      body: 'Ajustamos el diseño a la técnica y al tamaño de la pieza: hasta 8 cm en bordado, a todo color en DTF.',
      // TODO(client): photo of the art being prepared on screen.
      label: 'Foto: el arte en pantalla',
      icon: 'line',
      image: null,
      imageAlt: 'El arte en pantalla',
    },
    {
      id: 'mockup',
      // TODO(confirm)
      title: 'Apruebas el mockup',
      body: 'Te mandamos un mockup de cómo va a quedar. No producimos nada hasta que lo apruebes.',
      // TODO(client): example mockup sent to a client.
      label: 'Foto: ejemplo de mockup',
      icon: 'tee',
      image: null,
      imageAlt: 'Ejemplo de mockup enviado a un cliente',
      // TODO(confirm)
      link: { label: '¿Listo? Escríbenos →', message: whatsappMessages.general },
    },
    {
      id: 'taller',
      // TODO(confirm)
      title: 'Lo hacemos en el taller',
      body: 'Producimos tu pedido en taller propio, con la técnica que mejor le queda a tu diseño.',
      // TODO(client): photo of the machines or the hands at work.
      label: 'Foto: bordado o estampado en proceso',
      icon: 'hoodie',
      image: null,
      imageAlt: 'Bordado o estampado en proceso',
      // TODO(confirm)
      link: { label: 'Preguntar por una técnica →', message: whatsappMessages.tecnica },
      showTecnicas: true,
    },
    {
      id: 'entrega',
      // TODO(confirm)
      title: 'Acabado y entrega',
      body: 'Revisamos cada pieza, la empacamos y te la entregamos entre 7 y 10 días después de aprobar el mockup.',
      // TODO(client): photo of the finished, packed order.
      label: 'Foto: pedido terminado y empacado',
      icon: 'mug',
      image: null,
      imageAlt: 'Pedido terminado y empacado',
    },
  ] satisfies readonly ProcesoStep[],
  cta: {
    title: 'Empieza por un mensaje',
    body: 'Así de simple: nos escribes, nos cuentas qué quieres y nosotros nos encargamos del resto.',
    whatsapp: 'Escribir por WhatsApp',
    email: 'Mandar correo',
    message: whatsappMessages.general,
  },
} as const;
