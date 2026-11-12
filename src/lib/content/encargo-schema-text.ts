// Text schemas shared by the encargo override sections (plain text, WhatsApp templates).
import { TEXT_LIMITS } from './limits';
import { plainText } from './text';

export const text = (max: number, opts?: { multiline?: boolean }) => plainText(1, max, opts);

/** Placeholders other than {name}: rejected so a template cannot smuggle tokens we do not fill. */
function placeholderCount(template: string): { name: number; other: number } {
  let name = 0;
  let other = 0;
  for (const m of template.matchAll(/\{([^{}]*)\}/g)) {
    if (m[1] === 'name') name += 1;
    else other += 1;
  }
  return { name, other };
}

/** Template must contain `{name}` exactly once and no other `{...}` placeholder. */
export const nameTemplate = text(TEXT_LIMITS.template).refine(
  (v) => {
    const c = placeholderCount(v);
    return c.name === 1 && c.other === 0 && !/[{}]/.test(v.replace(/\{name\}/, ''));
  },
  { message: 'template' },
);
export const plainTemplate = text(TEXT_LIMITS.template).refine((v) => !/[{}]/.test(v), { message: 'template' });
