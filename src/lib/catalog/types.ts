// Public catalog contract (pure, client-safe). Prices are always null in this release.
export type CatalogAvailability = 'available' | 'low' | 'out' | 'unknown';

export type CatalogColor = { tone: string; hex: string | null };

export type CatalogVariant = CatalogColor & { code: string; image: string | null; availability: CatalogAvailability };

export type CatalogSpecs = {
  material: string | null;
  size: string | null;
  weight: string | null;
  printTechnique: string | null;
  printArea: string | null;
  packQty: string | null;
};

export type CatalogCard = {
  code: string;
  name: string;
  category: string | null;
  subcategory: string | null;
  image: string | null;
  /** At most 12. */
  colors: CatalogColor[];
  variantCount: number;
  availability: CatalogAvailability;
  /** Always null this release. */
  price: number | null;
};

export type CatalogDetail = CatalogCard & {
  description: string | null;
  images: string[];
  variants: CatalogVariant[];
  specs: CatalogSpecs;
};

export type CatalogListResponse = {
  enabled: boolean;
  items: CatalogCard[];
  page: number;
  pageSize: number;
  total: number;
  updatedAt: string | null;
};

export type CatalogCategoriesResponse = {
  enabled: boolean;
  categories: { name: string; count: number; subcategories: string[] }[];
};

export type CatalogDetailResponse = { product: CatalogDetail };

export const CATALOG_PAGE_SIZES = [12, 24, 48] as const;
export const CATALOG_DEFAULT_PAGE_SIZE = 24;
export const CATALOG_MAX_PAGE = 200;
export const CATALOG_MAX_QUERY = 60;
export const CATALOG_MAX_FILTER = 80;
export const CATALOG_CODE_PATTERN = /^[A-Z0-9][A-Z0-9-]{0,29}$/;

export const CATALOG_SORTS = ['name', 'price_asc', 'price_desc'] as const;
export type CatalogSort = (typeof CATALOG_SORTS)[number];
export const CATALOG_DEFAULT_SORT: CatalogSort = 'name';
