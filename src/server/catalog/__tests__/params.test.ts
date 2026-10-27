import { PgDialect } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db/client', () => ({ getDb: vi.fn() }));

import { parseListQuery } from '../params';
import { orderFor } from '../queries';

const url = (qs: string) => new URL(`https://nuva.test/api/catalog?${qs}`);
const render = (sort: Parameters<typeof orderFor>[0]) => new PgDialect().sqlToQuery(sql.join(orderFor(sort), sql`, `)).sql;

describe('parseListQuery sort', () => {
  it('defaults to name and accepts every sort when prices are visible', () => {
    expect(parseListQuery(url(''), { pricesVisible: false })?.sort).toBe('name');
    expect(parseListQuery(url('sort=name'), { pricesVisible: false })?.sort).toBe('name');
    for (const sort of ['price_asc', 'price_desc']) expect(parseListQuery(url(`sort=${sort}`), { pricesVisible: true })?.sort).toBe(sort);
  });

  it('rejects unknown values, and price sorts while prices are hidden', () => {
    expect(parseListQuery(url('sort=newest'), { pricesVisible: true })).toBeNull();
    expect(parseListQuery(url('sort=PRICE_ASC'), { pricesVisible: true })).toBeNull();
    expect(parseListQuery(url('sort=price_asc'), { pricesVisible: false })).toBeNull();
    expect(parseListQuery(url('sort=price_desc'), { pricesVisible: false })).toBeNull();
  });
});

describe('orderFor', () => {
  it('orders by the positive cost with nulls last, then category, name, code', () => {
    expect(render('price_asc')).toMatch(/case when .*cost_cents.* > 0 then .* end\) asc nulls last, .*category.* asc, .*name.* asc, .*code.* asc/);
    expect(render('price_desc')).toMatch(/desc nulls last, .*category/);
  });
  it('keeps the current order for name or no sort', () => {
    for (const s of ['name', undefined] as const) {
      expect(render(s)).not.toContain('cost_cents');
      expect(render(s)).toMatch(/category.* asc, .*name.* asc, .*code.* asc/);
    }
  });
});
