import 'server-only';
import { toSafeImageUrl } from '@/lib/catalog/images';
import type { InnovationColors, InnovationProduct, InnovationStockProduct } from '@/server/integrations';
import { cleanCode, cleanHex, cleanList, cleanText, toCostCents, toStock } from './sanitize';
import { searchKey } from './search';
import type { NormalizedProduct, NormalizeResult, StoredSpecs, StoredVariant } from './types';

const MAX_VARIANTS = 40;
const MAX_IMAGES = 8;

export type StockIndex = Map<string, { total: number | null; variants: Map<string, number | null> }>;
export type ToneIndex = Map<string, string>;

const toneKey = (name: string): string => name.trim().toUpperCase();

/** Tone name -> hex from the colors endpoint (values may carry a leading space). */
export function buildToneIndex(colors: InnovationColors): ToneIndex {
  const index: ToneIndex = new Map();
  for (const t of colors.tones) {
    const hex = cleanHex(t.rgb);
    if (hex) index.set(toneKey(t.name), hex);
  }
  return index;
}

/** Product code -> stock numbers from the light list. */
export function buildStockIndex(list: readonly InnovationStockProduct[]): StockIndex {
  const index: StockIndex = new Map();
  for (const p of list) {
    const code = cleanCode(p.Codigo);
    if (!code) continue;
    const variants = new Map<string, number | null>();
    for (const v of p.Variantes) {
      const vc = cleanCode(v['Codigo Variante']);
      if (vc) variants.set(vc, toStock(v.Stock));
    }
    const summed = [...variants.values()].every((s) => s !== null) && variants.size > 0
      ? [...variants.values()].reduce<number>((a, s) => a + (s ?? 0), 0)
      : null;
    index.set(code, { total: toStock(p.Stock) ?? summed, variants });
  }
  return index;
}

function buildVariants(p: InnovationProduct, tones: ToneIndex, stock: Map<string, number | null> | undefined): StoredVariant[] {
  const seen = new Set<string>();
  const out: StoredVariant[] = [];
  for (const v of p.Variantes) {
    const code = cleanCode(v['Codigo Variante']);
    const tone = cleanText(v.Tono, 60);
    if (!code || !tone || seen.has(code)) continue;
    seen.add(code);
    out.push({ code, tone, hex: tones.get(toneKey(tone)) ?? null, image: toSafeImageUrl(v.Imagen), stock: stock?.get(code) ?? null });
    if (out.length >= MAX_VARIANTS) break;
  }
  return out;
}

function buildSpecs(p: InnovationProduct): StoredSpecs {
  return {
    material: cleanList(p.Materiales, 200),
    size: cleanText(p['Medidas producto'], 200),
    weight: cleanText(p.PesoProducto, 200),
    printTechnique: cleanList(p.TecnicasImpresion, 200),
    printArea: cleanText(p.AreaDeImpresion, 200),
    packQty: cleanText(typeof p['Cantidad empaque'] === 'number' ? String(p['Cantidad empaque']) : p['Cantidad empaque'], 200),
  };
}

function normalizeOne(p: InnovationProduct, tones: ToneIndex, stock: StockIndex): NormalizedProduct | string {
  const code = cleanCode(p.Codigo);
  if (!code) return 'invalid_code';
  const name = cleanText(p.Nombre, 200);
  if (!name) return 'missing_name';
  const category = cleanText(p.Categoria[0], 80);
  const subcategory = cleanText(p.SubCategorias[0], 80);
  const stockEntry = stock.get(code);
  const variants = buildVariants(p, tones, stockEntry?.variants);
  return {
    code,
    name,
    description: cleanText(p.Descripcion, 2000),
    category,
    subcategory,
    image: toSafeImageUrl(p.ImagenP),
    images: p.ImagenesC.flatMap((u) => toSafeImageUrl(u) ?? []).slice(0, MAX_IMAGES),
    variants,
    specs: buildSpecs(p),
    costCents: toCostCents(p.Precio),
    totalStock: stockEntry?.total ?? null,
    searchText: searchKey([name, code, category, subcategory, ...variants.map((v) => v.tone)].filter(Boolean).join(' ')),
  };
}

/** Turns supplier rows into DB-ready rows. Bad rows are counted per reason and dropped, never thrown. */
export function normalizeProducts(
  products: readonly InnovationProduct[],
  tones: ToneIndex,
  stock: StockIndex,
): NormalizeResult {
  const rows: NormalizedProduct[] = [];
  const reasons: Record<string, number> = {};
  const seen = new Set<string>();
  const reject = (reason: string) => {
    reasons[reason] = (reasons[reason] ?? 0) + 1;
  };
  for (const p of products) {
    const result = normalizeOne(p, tones, stock);
    if (typeof result === 'string') reject(result);
    else if (seen.has(result.code)) reject('duplicate_code');
    else {
      seen.add(result.code);
      rows.push(result);
    }
  }
  return { rows, rejected: products.length - rows.length, reasons };
}
