import 'server-only';
import { z } from 'zod';

// Unknown keys are stripped (zod default), so UniqueID and anything else we do not name never reaches our code.
// Fields are lenient (.catch(undefined)): a field of the wrong type is dropped here and validated for real in
// src/server/catalog/normalize.ts, which decides whether the row is rejected.

const text = z.string().optional().catch(undefined);
const textOrNumber = z.union([z.string(), z.number()]).optional().catch(undefined);
const textList = z.array(z.unknown()).optional().catch(undefined).transform((list) => (list ?? []).flatMap((v) => (typeof v === 'string' ? v : [])).slice(0, 20));

/** Parses each element on its own, drops the bad ones and caps the length. */
function lenientList<S extends z.ZodType>(schema: S, max: number): z.ZodType<z.output<S>[]> {
  return z
    .array(z.unknown())
    .optional()
    .catch(undefined)
    .transform((list) => (list ?? []).slice(0, max).flatMap((v) => {
      const r = schema.safeParse(v);
      return r.success ? [r.data as z.output<S>] : [];
    }));
}

export const keyResponseSchema = z.object({
  respuesta_llave: z.object({
    response: z.object({
      Activo: z.boolean().optional(),
      Correct_Datos: z.boolean().optional(),
    }),
  }),
});
export type KeyResponse = z.infer<typeof keyResponseSchema>;

const toneSchema = z.object({ Nombre: text, RGB: text });
const colorSchema = z.object({ Tonos: lenientList(toneSchema, 100) });
export const colorsEnvelopeSchema = keyResponseSchema.extend({ colores: lenientList(colorSchema, 200) });
export type InnovationTone = z.infer<typeof toneSchema>;

const variantSchema = z.object({ 'Codigo Variante': text, Tono: text, Imagen: text });
export const productSchema = z.object({
  Codigo: text,
  Nombre: text,
  Descripcion: text,
  Categoria: textList,
  SubCategorias: textList,
  ImagenP: text,
  ImagenesC: textList,
  Variantes: lenientList(variantSchema, 40),
  Precio: textOrNumber,
  'Medidas producto': text,
  'Cantidad empaque': textOrNumber,
  PesoProducto: text,
  AreaDeImpresion: text,
  Materiales: textList,
  TecnicasImpresion: textList,
});
export type InnovationProduct = z.infer<typeof productSchema>;

// GetAllProductos has no `respuesta_llave` block in its real responses; `Activo`/`Correct_Datos` are checked only if present.
export const productsEnvelopeSchema = z.object({
  respuesta_llave: keyResponseSchema.shape.respuesta_llave.optional(),
  productos: z.array(z.unknown()),
  paginas_totales: z.number().int().nonnegative().optional(),
  page: z.number().int().optional(),
});

const stockVariantSchema = z.object({ 'Codigo Variante': text, Stock: textOrNumber });
export const stockProductSchema = z.object({
  Codigo: text,
  Stock: textOrNumber,
  Variantes: lenientList(stockVariantSchema, 100),
});
export type InnovationStockProduct = z.infer<typeof stockProductSchema>;

export const stockEnvelopeSchema = keyResponseSchema.extend({ productos: z.array(z.unknown()) });
