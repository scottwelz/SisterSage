import type { Product } from '@/types';

export const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Hand-Knit Scarf',
    sku: 'HKS-001',
    imageUrl: 'https://placehold.co/600x400.png',
    imageHint: 'knit scarf',
    stock: {
      shopify: 12,
      square: 5,
    },
  },
  {
    id: '2',
    name: 'Artisan Coffee Mug',
    sku: 'ACM-002',
    imageUrl: 'https://placehold.co/600x400.png',
    imageHint: 'coffee mug',
    stock: {
      shopify: 25,
      square: 15,
    },
  },
  {
    id: '3',
    name: 'Organic Honey Jar',
    sku: 'OHJ-003',
    imageUrl: 'https://placehold.co/600x400.png',
    imageHint: 'honey jar',
    stock: {
      shopify: 30,
      square: 8,
    },
  },
  {
    id: '4',
    name: 'Scented Soy Candle',
    sku: 'SSC-004',
    imageUrl: 'https://placehold.co/600x400.png',
    imageHint: 'scented candle',
    stock: {
      shopify: 18,
      square: 12,
    },
  },
  {
    id: '5',
    name: 'Leatherbound Journal',
    sku: 'LBJ-005',
    imageUrl: 'https://placehold.co/600x400.png',
    imageHint: 'leather journal',
    stock: {
      shopify: 7,
      square: 3,
    },
  },
  {
    id: '6',
    name: 'Ceramic Plant Pot',
    sku: 'CPP-006',
    imageUrl: 'https://placehold.co/600x400.png',
    imageHint: 'ceramic pot',
    stock: {
      shopify: 22,
      square: 9,
    },
  },
   {
    id: '7',
    name: 'Gourmet Olive Oil',
    sku: 'GOO-007',
    imageUrl: 'https://placehold.co/600x400.png',
    imageHint: 'olive oil',
    stock: {
      shopify: 15,
      square: 10,
    },
  },
  {
    id: '8',
    name: 'Canvas Tote Bag',
    sku: 'CTB-008',
    imageUrl: 'https://placehold.co/600x400.png',
    imageHint: 'tote bag',
    stock: {
      shopify: 40,
      square: 20,
    },
  },
];
