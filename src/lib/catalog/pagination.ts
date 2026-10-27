export type PageSlot = number | 'gap';

/** Page numbers to show: first, last, the current page and its neighbours, with 'gap' where numbers are skipped. */
export function pageWindow(current: number, total: number): PageSlot[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const wanted = new Set([1, 2, total - 1, total, current - 1, current, current + 1]);
  const pages = [...wanted].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const slots: PageSlot[] = [];
  pages.forEach((n, i) => {
    const prev = pages[i - 1];
    if (prev !== undefined && n - prev === 2) slots.push(prev + 1);
    else if (prev !== undefined && n - prev > 2) slots.push('gap');
    slots.push(n);
  });
  return slots;
}

/** Reads `?pagina=N` (1 or more, whole number); anything else is page 1. */
export function parsePageParam(search: string): number {
  const n = Number(new URLSearchParams(search).get('pagina'));
  return Number.isInteger(n) && n >= 1 && n <= 200 ? n : 1;
}
