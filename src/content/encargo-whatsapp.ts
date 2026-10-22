/**
 * Pre-filled WhatsApp messages of the /encargo page, by where the visitor clicked.
 * The general one is a short, open question (the workshop asks for the details in its reply); the team, piece and
 * technique ones still ask for the facts the workshop needs first (piece, technique, quantity, date). The project templates (a single project, a bulk quote) live in encargo.projects.
 * TODO(confirm): the client must approve the wording of every message.
 */
export const whatsappMessages = {
  // Hero, Contacto, the closing panel and the sticky button.
  general: 'Hola Nuva, me gustaría más información para poder hacer mi idea realidad.',
  // Equipos: a team, brand or event order.
  equipo: 'Hola Nuva, quiero cotizar un pedido para mi equipo, marca o evento. Pieza: __ · Técnica: __ · Cantidad: __ · Fecha: __. Mi idea:',
  // Step 2: choosing the piece.
  pieza: 'Hola Nuva, quiero elegir la pieza para mi pedido. Pieza (gorra, playera, sudadera, tote o parche): __ · Cantidad: __ · Fecha: __. Mi idea:',
  // Step 5: choosing the technique.
  tecnica: 'Hola Nuva, quiero saber qué técnica le queda mejor a mi diseño. Técnica (bordado, DTF o serigrafía): __ · Cantidad: __ · Fecha: __. Mi idea:',
} as const;

/** Floating button on phones (only /encargo). */
export const stickyWhatsapp = {
  // TODO(confirm)
  label: 'Hagámoslo realidad',
  ariaLabel: 'Escribir por WhatsApp para pedir una pieza personalizada',
} as const;
