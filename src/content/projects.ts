/** Completed projects (reference: DATA in Nuva Sitio.dc.html). */
export type Project = {
  id: string;
  name: string;
  technique: string;
  tag: string;
  meta: string;
  detail: { technique: string; minimum: string; colors: string; delivery: string };
  description: string;
  image: string | null;
  imageAlt: string;
};

const DELIVERY = '7 a 10 días';

// TODO(client): photos for each project.
export const projects: Project[] = [
  {
    id: 'cafe-lote',
    name: 'Café de barrio',
    technique: 'Bordado',
    tag: '2026',
    meta: '12 GORRAS · BORDADO FRONTAL',
    detail: { technique: 'Bordado hasta 8 cm', minimum: '1 pieza', colors: 'negro y arena', delivery: DELIVERY },
    description:
      'Logotipo bordado en hilo crudo sobre gorra de seis paneles. Serie de doce piezas para el equipo de piso, con etiqueta interior personalizada.',
    image: null,
    imageAlt: 'Foto del proyecto: café de barrio',
  },
  {
    id: 'banda',
    name: 'Merch de banda',
    technique: 'Estampado',
    tag: 'gira',
    meta: '80 PLAYERAS · DTF FULL COLOR',
    detail: { technique: 'Estampado DTF full color', minimum: '1 pieza', colors: 'negro', delivery: DELIVERY },
    description:
      'Arte a todo color al frente y fechas de gira en la espalda. DTF para no perder detalle en el degradado del cartel.',
    image: null,
    imageAlt: 'Foto del proyecto: merch de banda',
  },
  {
    id: 'torneo',
    name: 'Torneo amateur',
    technique: 'Bordado',
    tag: '2025',
    meta: '40 SUDADERAS · ESCUDO BORDADO',
    detail: { technique: 'Bordado en pecho', minimum: '1 pieza', colors: 'azul marino', delivery: DELIVERY },
    description:
      'Escudo bordado en pecho y número de jugador en la manga. Producción en dos semanas para la fecha del torneo.',
    image: null,
    imageAlt: 'Foto del proyecto: torneo amateur',
  },
  {
    id: 'boda',
    name: 'Recuerdo de boda',
    technique: 'Accesorios',
    tag: 'evento',
    meta: '60 TOTES · SERIGRAFÍA',
    detail: { technique: 'Serigrafía a una tinta', minimum: '20 piezas', colors: 'lona cruda', delivery: DELIVERY },
    description:
      'Iniciales y fecha impresas a una tinta sobre lona cruda. Entregado en bolsa individual para la mesa de regalos.',
    image: null,
    imageAlt: 'Foto del proyecto: recuerdo de boda',
  },
  {
    id: 'estudio',
    name: 'Estudio de tatuaje',
    technique: 'Accesorios',
    tag: '2026',
    meta: '200 PARCHES · BORDADO 3D',
    detail: { technique: 'Bordado 3D, borde láser', minimum: '25 piezas', colors: 'negro y oro', delivery: DELIVERY },
    description:
      'Parche bordado en relieve con respaldo termoadhesivo, pensado para coser en chamarra de mezclilla.',
    image: null,
    imageAlt: 'Foto del proyecto: estudio de tatuaje',
  },
  {
    id: 'marca-ropa',
    name: 'Marca independiente',
    technique: 'Estampado',
    tag: 'cápsula',
    meta: '25 GORROS · ETIQUETA TEJIDA',
    detail: { technique: 'Etiqueta tejida al frente', minimum: '10 piezas', colors: 'cinco colores', delivery: DELIVERY },
    description:
      'Cápsula de veinticinco gorros con etiqueta tejida. Cada color en tiraje de cinco para probar demanda antes de escalar.',
    image: null,
    imageAlt: 'Foto del proyecto: marca independiente',
  },
];
