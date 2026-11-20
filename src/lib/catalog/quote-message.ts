import { fillTemplate } from '@/lib/format';
import { isCatalogCartId } from './cart-line';

export type QuoteLine = { id: string; name: string; qty: number };

export type QuoteTemplate = {
  header: string;
  /** Uses {code}, {name} and {qty}. */
  line: string;
  /** Same without the code, for lines that are not catalog products. */
  lineNoCode: string;
};

/** Variant code of a catalog cart id ("cat:<code>:<variantCode>"), or '' for any other line. */
function lineCode(id: string): string {
  return isCatalogCartId(id) ? (id.split(':')[2] ?? '') : '';
}

/** The list name already ends with " (code)": drop it so the code is not written twice. */
function plainName(name: string, code: string): string {
  const suffix = ` (${code})`;
  return code && name.endsWith(suffix) ? name.slice(0, -suffix.length) : name;
}

/** WhatsApp quote text: the header and one line per item with its code, name and quantity. */
export function buildQuoteMessage(lines: readonly QuoteLine[], template: QuoteTemplate): string {
  const rows = lines.map((l) => {
    const code = lineCode(l.id);
    const name = plainName(l.name, code);
    return fillTemplate(code ? template.line : template.lineNoCode, { code, name, qty: l.qty });
  });
  return [template.header, ...rows].join('\n');
}
