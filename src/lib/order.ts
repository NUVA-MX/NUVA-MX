import { fillTemplate } from './format';

export type OrderItem = { id: string; name: string; price: number | null; qty: number };

export type OrderTemplate = {
  header: string;
  line: string;
  footer: string;
  noPrice: string;
};

/**
 * Builds the order text. All text comes from the template;
 * the function only joins lines and computes the total.
 */
export function buildOrderMessage(
  items: readonly OrderItem[],
  template: OrderTemplate,
  format: (n: number) => string,
): string {
  const lines = items.map((it) =>
    fillTemplate(template.line, {
      qty: it.qty,
      name: it.name,
      price: it.price === null ? template.noPrice : format(it.price * it.qty),
    }),
  );
  const total = orderTotal(items);
  return [template.header, ...lines, fillTemplate(template.footer, { total: format(total) })].join('\n');
}

/** Sum of price × quantity; items without a price add nothing. */
export function orderTotal(items: readonly OrderItem[]): number {
  return items.reduce((sum, it) => sum + (it.price ?? 0) * it.qty, 0);
}
