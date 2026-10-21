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
};

// Walkthrough of how a piece is made (replaces the old three-card "Cómo funciona").
// TODO(confirm): every step below is drafted from facts already on the site (mockup before production, own workshop,
// bordado / DTF / serigrafía, 7-10 days, from one piece, WhatsApp contact). The client must confirm or rewrite them.
export const proceso = {
  eyebrow: 'Descubre el proceso',
  // TODO(confirm): title and lead.
  title: 'De la idea a la realidad',
  lead: 'Conoce cómo transformamos tus ideas en productos personalizados, desde el primer contacto hasta la entrega final.',
  stepLabel: 'Paso',
  steps: [
    {
      id: 'idea',
      // TODO(confirm)
      title: 'Cuéntanos tu idea',
      body: 'Compártenos tu idea, diseño o alguna referencia por WhatsApp. Nosotros te ayudamos a encontrar la mejor opción para hacerla realidad.',
      // TODO(client): photo of a conversation, sketch or reference board.
      label: 'Foto: bocetos o referencias sobre la mesa',
      icon: 'notebook',
      image: null,
      imageAlt: 'Bocetos y referencias sobre la mesa',
    },
    {
      id: 'pieza',
      // TODO(confirm)
      title: 'Elegimos el producto',
      body: 'Seleccionamos el producto ideal para tu proyecto. Tú eliges el modelo, color, cantidad y los detalles de personalización.',
      // TODO(client): photo of the base pieces laid out.
      label: 'Foto: piezas base en el taller',
      icon: 'cap',
      image: null,
      imageAlt: 'Piezas base listas para personalizar',
      // TODO(confirm)
      link: { label: 'Preguntar por los productos →', message: whatsappMessages.pieza },
    },
    {
      id: 'arte',
      // TODO(confirm)
      title: 'Preparamos tu diseño',
      body: 'Adaptamos tu diseño al producto y seleccionamos la técnica de personalización más adecuada para conseguir el mejor resultado.',
      // TODO(client): photo of the art being prepared on screen.
      label: 'Foto: el arte en pantalla',
      icon: 'line',
      image: null,
      imageAlt: 'El arte en pantalla',
    },
    {
      id: 'mockup',
      // TODO(confirm)
      title: 'Visualiza y aprueba',
      body: 'Te compartimos una vista previa de cómo quedará tu producto para que revises y apruebes cada detalle antes de comenzar la producción.',
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
      title: 'Lo hacemos realidad',
      body: 'Una vez aprobado tu diseño, comenzamos la producción utilizando la técnica de personalización más adecuada, cuidando cada detalle para lograr el mejor resultado.',
      // TODO(client): photo of the machines or the hands at work.
      label: 'Foto: bordado o estampado en proceso',
      icon: 'hoodie',
      image: null,
      imageAlt: 'Bordado o estampado en proceso',
      // TODO(confirm)
      link: { label: 'Preguntar por una técnica →', message: whatsappMessages.tecnica },
    },
    {
      id: 'entrega',
      // TODO(confirm)
      title: 'El resultado final',
      body: 'Revisamos cada producto para asegurarnos de que cumpla con nuestros estándares de calidad. Preparamos tu pedido y coordinamos la entrega para que llegue a tus manos.',
      // TODO(client): photo of the finished, packed order.
      label: 'Foto: pedido terminado y empacado',
      icon: 'mug',
      image: null,
      imageAlt: 'Pedido terminado y empacado',
    },
  ] satisfies readonly ProcesoStep[],
  cta: {
    title: '¿Hacemos realidad tu idea?',
    body: 'Compártenos lo que tienes en mente. Te asesoramos para encontrar los productos y las opciones de personalización ideales para tu proyecto.',
    whatsapp: 'Escríbenos por WhatsApp',
    email: 'Mandar correo',
    message: whatsappMessages.general,
  },
} as const;
