const mxn = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  maximumFractionDigits: 0,
});

/** Formats an integer in pesos: 390 -> "$390". */
export function formatMXN(n: number): string {
  return mxn.format(n);
}

/** Replaces {key} in a template. Missing keys become empty. */
export function fillTemplate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    key in values ? String(values[key]) : '',
  );
}
