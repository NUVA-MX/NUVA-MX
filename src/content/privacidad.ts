import { site } from './site';

/**
 * Aviso de privacidad (LFPDPPP). DRAFT: the bracketed fields marked TODO(client) must be filled with the real
 * business data, and a lawyer should review the text before it is treated as final.
 */
export const privacidad = {
  meta: {
    title: 'Aviso de privacidad · NUVA',
    description: 'Cómo NUVA usa y protege los datos personales de quienes nos contactan.',
  },
  title: 'Aviso de privacidad',
  // TODO(client): update this date whenever the text changes.
  updated: 'Última actualización: 20 de noviembre de 2026',
  sections: [
    {
      heading: 'Quién es el responsable',
      paragraphs: [
        // TODO(client): legal name (persona física o razón social) and full address.
        '[Nombre o razón social del responsable], con domicilio en [domicilio completo], es el responsable del tratamiento de tus datos personales, conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares.',
      ],
    },
    {
      heading: 'Qué datos recopilamos',
      paragraphs: [
        'Cuando nos escribes por WhatsApp para pedir información, cotizar o hacer un pedido, recibimos los datos que tú nos compartes: tu nombre, tu número de teléfono y los detalles de tu pedido, como productos, cantidades, logotipos o fechas de entrega.',
        'Este sitio no tiene formularios de registro, no pide pagos y no usa cookies de publicidad ni herramientas de seguimiento.',
      ],
    },
    {
      heading: 'Para qué usamos tus datos',
      paragraphs: [
        'Usamos tus datos únicamente para responderte, preparar cotizaciones y mockups, confirmar disponibilidad, envío y pago, y dar seguimiento a tu pedido. No los vendemos ni los compartimos con terceros para fines de publicidad.',
      ],
    },
    {
      heading: 'WhatsApp',
      paragraphs: [
        'Las conversaciones ocurren en WhatsApp, que tiene su propio aviso de privacidad y términos. Te recomendamos revisarlos. Nosotros solo conservamos la conversación mientras sea necesaria para atender tu pedido.',
      ],
    },
    {
      heading: 'Tu lista de productos',
      paragraphs: [
        'La lista de productos que armas en la sección de Promocionales se guarda únicamente en tu navegador, en tu propio dispositivo. No la enviamos a nuestros servidores hasta que tú decides mandárnosla por WhatsApp.',
      ],
    },
    {
      heading: 'Tus derechos',
      paragraphs: [
        'Tienes derecho a acceder a tus datos, corregirlos, cancelarlos u oponerte a su uso (derechos ARCO). Para ejercerlos, escríbenos al correo de contacto o por WhatsApp indicando tu nombre y qué derecho quieres ejercer; te responderemos en un plazo máximo de 20 días hábiles.',
      ],
    },
    {
      heading: 'Cambios a este aviso',
      paragraphs: [
        'Si este aviso cambia, publicaremos la nueva versión en esta página con su fecha de actualización.',
      ],
    },
    {
      heading: 'Contacto',
      paragraphs: [
        // site.email is still a TODO(client) value until the real address is set.
        `Correo: ${site.email}`,
        `WhatsApp: ${site.whatsapp.phone}`,
      ],
    },
  ],
};
