import { fillTemplate } from '@/lib/format';
import { CATALOG_CODE_PATTERN } from './types';

const PREFIX = 'cat:';
const CODE = CATALOG_CODE_PATTERN.source.slice(1, -1);
const CART_ID = new RegExp(`^cat:${CODE}:${CODE}$`);
const MAX_NAME = 200;

/** Cart id of a catalog variant: "cat:<code>:<variantCode>". Never collides with a DB product (uuid) id. */
export function catalogCartId(code: string, variantCode: string): string {
  return `${PREFIX}${code}:${variantCode}`;
}

export function isCatalogCartId(id: string): boolean {
  return CART_ID.test(id);
}

/** Display name of a cart line, from the copy template with {name}, {tone} and {code}. */
export function catalogLineName(template: string, parts: { name: string; tone: string; code: string }): string {
  return fillTemplate(template, parts).slice(0, MAX_NAME);
}
