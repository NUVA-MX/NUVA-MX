import { describe, expect, it } from 'vitest';
import { existenciaCatalog } from '@/content/existencia-catalog';
import { buildQuoteMessage } from '../quote-message';

const t = existenciaCatalog.quoteMessage;

describe('buildQuoteMessage', () => {
  it('lists code, name and quantity of every catalog line', () => {
    const msg = buildQuoteMessage(
      [
        { id: 'cat:TAZ-1:TAZ-1-AZ', name: 'Taza · Azul (TAZ-1-AZ)', qty: 12 },
        { id: 'cat:BOL-2:BOL-2-NG', name: 'Bolígrafo · Negro (BOL-2-NG)', qty: 1 },
      ],
      t,
    );
    expect(msg.split('\n')).toEqual([t.header, '• TAZ-1-AZ · Taza · Azul · 12 pzs', '• BOL-2-NG · Bolígrafo · Negro · 1 pzs']);
  });

  it('omits the code for lines that are not catalog products', () => {
    const msg = buildQuoteMessage([{ id: 'abc-uuid', name: 'Lona', qty: 3 }], t);
    expect(msg).toBe(`${t.header}\n• Lona · 3 pzs`);
  });
});
