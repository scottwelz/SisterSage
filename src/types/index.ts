export interface Product {
  id: string;
  name: string;
  sku: string;
  imageUrl: string;
  imageHint: string;
  stock: {
    shopify: number;
    square: number;
  };
}
