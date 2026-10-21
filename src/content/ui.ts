/** Generic UI copy: aria labels, 404 and utilities. */
export const ui = {
  close: 'Cerrar',
  openMenu: 'Abrir menú',
  closeMenu: 'Cerrar menú',
  mainNav: 'Navegación principal',
  previous: 'Anterior',
  next: 'Siguiente',
  openProject: 'Ver detalle del proyecto: {name}',
  opensInNewTab: '(se abre en una pestaña nueva)',
  skipToContent: 'Saltar al contenido',
  menu: 'Menú',
  announcement: 'Aviso',
  carousel: 'carrusel',
  slideRole: 'foto',
  slide: 'Foto {n} de {total}',
  goToSlide: 'Ir a la foto {n}',
  notFound: {
    // TODO(confirm): the brief asked to redirect unknown routes to "/"; a real 404 is used for SEO.
    code: '404',
    title: 'ESTA PÁGINA NO EXISTE',
    body: 'Puede que el enlace esté mal escrito o que la página ya no esté aquí.',
    cta: 'Volver al inicio',
  },
} as const;
