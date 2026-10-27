/** Admin copy for the supplier catalog page. */
export const adminCatalog = {
  title: 'Catálogo del proveedor',
  intro:
    'Los productos del proveedor se copian a la base de datos una vez al día, dentro de sus horarios de consulta. Los visitantes solo ven esa copia.',
  notConfigured: 'La base de datos no está configurada: no hay catálogo guardado.',
  status: {
    title: 'Estado',
    products: 'Productos activos',
    provider: 'Integración con el proveedor',
    publicSection: 'Sección pública',
    on: 'Activa',
    off: 'Desactivada',
    lastSuccess: 'Última sincronización correcta',
    never: 'Todavía no hay una sincronización correcta.',
  },
  sync: {
    title: 'Sincronizar',
    hint: 'Solo funciona dentro de los horarios del proveedor (09:00, 13:00 y 17:00, hora de Ciudad de México, durante una hora).',
    button: 'Sincronizar ahora',
    working: 'Sincronizando…',
    result: {
      idle: '',
      success: 'Listo: {accepted} productos guardados, {rejected} descartados, {deactivated} desactivados.',
      skipped: 'Ya hay una sincronización en curso.',
      cooldown: 'Hubo una sincronización hace menos de 5 minutos. Espera un poco.',
      outside_window: 'Fuera del horario permitido por el proveedor. Inténtalo más tarde.',
      failed: 'La sincronización falló ({errorKind}). El catálogo anterior sigue publicado.',
      not_configured: 'La integración no está activa o falta la base de datos.',
      rate_limited: 'Demasiados intentos. Espera un minuto.',
    },
  },
  runs: {
    title: 'Últimas sincronizaciones',
    empty: 'Aún no hay sincronizaciones.',
    columns: { started: 'Inicio', trigger: 'Origen', status: 'Resultado', counts: 'Guardados / descartados / desactivados', error: 'Error' },
    triggers: { cron: 'Automática', admin: 'Manual' },
    statuses: { running: 'En curso', success: 'Correcta', failed: 'Fallida' },
    counts: '{accepted} / {rejected} / {deactivated}',
  },
  yes: 'Sí',
  viewPublic: 'Ver sección pública',
} as const;
