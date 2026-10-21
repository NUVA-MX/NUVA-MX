/** Brand, contact and data shared across the whole site. */
export const site = {
  brand: 'NUVA',
  tagline: 'Productos personalizables · Hecho en México',
  storeTagline: 'Tienda en existencia · Hecho en México',
  copyright: '© 2026 Nuva',
  homeLabel: 'NUVA, ir a la entrada',
  // TODO(client): WhatsApp number with area code, e.g. '52 55 1234 5678'.
  whatsapp: { phone: 'TODO(cliente)', defaultMessage: 'Hola Nuva, quiero información.' },
  // TODO(client): contact email.
  email: 'TODO(cliente)',
  // TODO(client): real social links, e.g. { label: 'Instagram', href: 'https://instagram.com/…' }.
  social: [] as { label: string; href: string }[],
  switch: [
    { key: 'encargo', label: 'POR ENCARGO', href: '/encargo' },
    { key: 'existencia', label: 'EN EXISTENCIA', href: '/existencia' },
  ],
  // Page-identity tag shown in the announcement bar of each side.
  sideTag: { encargo: 'Hecho a tu medida', existencia: 'Listo para enviar' },
  switchLabel: 'Forma de comprar',
  description:
    'NUVA: gorras y prendas personalizadas por encargo y piezas en existencia listas para enviar. Hecho en México.',
} as const;

export type SwitchKey = (typeof site.switch)[number]['key'];
