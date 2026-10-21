/** Stable internal shape of a product. Components only know this shape. */
export type Product = {
  id: string;
  name: string;
  meta: string | null;
  price: number | null;
  stock: number | null;
  image: string | null;
  imageAlt: string | null;
  category: string | null;
};

export type ProductsStatus = 'loading' | 'success' | 'empty' | 'error';

export type ProductsSource = 'db' | 'sample';

export type ProductsResponse = { products: Product[]; source: ProductsSource };

export type StockState = 'out' | 'low' | 'ok';
