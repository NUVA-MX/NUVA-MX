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
  /** Extra photos shown with arrows in the modal; the first one is the cover. */
  gallery?: string[];
};

// TODO(client): photos for each project.
export const projects: Project[] = [
  {
    id: 'cafe-lote',
    name: 'Hotel Colli',
    technique: 'Bordado',
    tag: '2026',
    meta: '20 · Gorras y playeras polo',
    detail: { technique: 'Bordado', minimum: '20', colors: 'Blando, Azul, Verde y Gris', delivery: 'Gorras y playeras polo' },
    description:
      'Personalizamos 10 gorras y 10 playeras tipo polo en diferentes colores para el equipo del Hotel Coli, Cada pieza lleva el logotipo bordado en hilo blanco. Creando una linea de merch y uniformes con identidad propia',
    image: null,
    imageAlt: 'Foto del proyecto: Hotel Colli',
  },
  {
    id: 'banda',
    name: 'Soleil Bags',
    technique: 'Bordado',
    tag: 'gira',
    meta: '25 · Gorras',
    detail: { technique: 'Bordado', minimum: '25', colors: '8 colores con hilos a juego', delivery: 'Gorras' },
    description:
      'Arte a todo color al frente y fechas de gira en la espalda. DTF para no perder detalle en el degradado del cartel.',
    image: null,
    imageAlt: 'Foto del proyecto: Soleil Bags',
  },
  {
    id: 'torneo',
    name: 'Mupreg',
    technique: 'Estampado',
    tag: '2025',
    meta: '150 · Playeras y batas',
    detail: { technique: 'Vinil Textil', minimum: '150', colors: 'Dorado, gris reflejante y negro', delivery: 'Playeras y batas' },
    description:
      'Escudo bordado en pecho y número de jugador en la manga. Producción en dos semanas para la fecha del torneo.',
    image: null,
    imageAlt: 'Foto del proyecto: Mupreg',
  },
  {
    id: 'boda',
    name: 'Vessa & Humo',
    technique: 'Estampado',
    tag: 'evento',
    meta: '20 · Playeras y gorras',
    detail: { technique: 'Bordado y Serigrafía', minimum: '20', colors: 'Hueso, Vino y negro', delivery: 'Playeras y gorras' },
    description:
      'Iniciales y fecha impresas a una tinta sobre lona cruda. Entregado en bolsa individual para la mesa de regalos.',
    image: null,
    imageAlt: 'Foto del proyecto: Vessa & Humo',
  },
  {
    id: 'estudio',
    name: 'Virtrade',
    technique: 'Estampado',
    tag: '2026',
    meta: '60 · Playeras polo',
    detail: { technique: 'Serigrafía', minimum: '60', colors: 'Azul, Verde, Gris, Blanco y Negro', delivery: 'Playeras polo' },
    description:
      'Parche bordado en relieve con respaldo termoadhesivo, pensado para coser en chamarra de mezclilla.',
    image: null,
    imageAlt: 'Foto del proyecto: Virtrade',
  },
  {
    id: 'marca-ropa',
    name: 'Ovum',
    technique: 'Estampado',
    tag: 'cápsula',
    meta: '50 · Playeras',
    detail: { technique: 'Serigrafía y vinil textil', minimum: '50', colors: 'Blanco, Negro y Verde', delivery: 'Playeras' },
    description:
      'Cápsula de veinticinco gorros con etiqueta tejida. Cada color en tiraje de cinco para probar demanda antes de escalar.',
    image: null,
    imageAlt: 'Foto del proyecto: Ovum',
  },
  {
    id: 'sommusa',
    name: 'Sommusa',
    technique: 'Estampado',
    tag: '2026',
    meta: '500 · Batas de mezclilla y gabardina',
    detail: { technique: 'Serigrafía', minimum: '500', colors: 'Blanco', delivery: 'Batas de mezclilla y gabardina' },
    description: 'Proyecto de estampado para Sommusa.',
    image: null,
    imageAlt: 'Foto del proyecto: Sommusa',
  },
];

/** Real photos per default project id: cover first, then the modal gallery. */
const PHOTOS_BY_ID: Record<string, string[]> = {
  sommusa: ['portada', '1', '2', '3'].map((n) => `/photos/sommusa-${n}.jpg`),
  'marca-ropa': ['portada', '1', '2', '3'].map((n) => `/photos/ovum-${n}.jpg`),
  estudio: ['portada', '1', '2', '3', '4'].map((n) => `/photos/virtrade-${n}.jpg`),
  boda: ['portada', '1', '2', '3'].map((n) => `/photos/vessa-humo-${n}.jpg`),
  torneo: ['portada', '1', '2', '3', '4', '5'].map((n) => `/photos/mupreg-${n}.jpg`),
  banda: ['portada', '1', '2', '3'].map((n) => `/photos/soleil-bags-${n}.jpg`),
  'cafe-lote': [1, 2, 3, 4].reduce<string[]>(
    (acc, n) => [...acc, `/photos/hotel-colli-${n}.jpg`],
    ['/photos/hotel-colli-portada.jpg'],
  ),
};

/** Stand-in photos by technique, shown while a project has no uploaded photo (cards and modal). */
const PLACEHOLDER_BY_TECHNIQUE: Record<string, string> = {
  Bordado: '/photos/tecnica-bordado.webp',
  Estampado: '/photos/tecnica-dtf.webp',
  Accesorios: '/photos/tecnica-serigrafia.webp',
};

export function withPlaceholderImage<T extends Pick<Project, 'id' | 'image' | 'technique' | 'gallery'>>(project: T): T {
  const photos = PHOTOS_BY_ID[project.id];
  if (photos && !project.image) return { ...project, image: photos[0], gallery: photos };
  if (project.image) return project;
  return { ...project, image: PLACEHOLDER_BY_TECHNIQUE[project.technique] ?? '/photos/tecnica-vinil.webp' };
}
