import type { Product } from '@/types';

export const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Dandelion Tincture',
    sku: 'DT-001',
    imageUrl: 'https://placehold.co/400x400.png',
    imageHint: 'herbal tincture bottle',
    stock: {
      shopify: 15,
      square: 8,
    },
  },
  {
    id: '2',
    name: 'Elecampane Tincture',
    sku: 'ET-002',
    imageUrl: 'https://placehold.co/400x400.png',
    imageHint: 'herbal tincture bottle',
    stock: {
      shopify: 12,
      square: 4,
    },
  },
  {
    id: '3',
    name: 'Motherwort Tincture',
    sku: 'MT-003',
    imageUrl: 'https://placehold.co/400x400.png',
    imageHint: 'herbal tincture bottle',
    stock: {
      shopify: 20,
      square: 10,
    },
  },
  {
    id: '4',
    name: 'Mullein Tincture',
    sku: 'MLT-004',
    imageUrl: 'https://placehold.co/400x400.png',
    imageHint: 'herbal tincture bottle',
    stock: {
      shopify: 18,
      square: 12,
    },
  },
  {
    id: '5',
    name: 'Nettle Tincture',
    sku: 'NT-005',
    imageUrl: 'https://placehold.co/400x400.png',
    imageHint: 'herbal tincture leaves',
    stock: {
      shopify: 25,
      square: 15,
    },
  },
  {
    id: '6',
    name: 'Reishi Tincture',
    sku: 'RT-006',
    imageUrl: 'https://placehold.co/400x400.png',
    imageHint: 'reishi mushroom',
    stock: {
      shopify: 10,
      square: 5,
    },
  },
  {
    id: '7',
    name: "St. John's Wort Tincture",
    sku: 'SJW-007',
    imageUrl: 'https://placehold.co/400x400.png',
    imageHint: 'yellow flowers',
    stock: {
      shopify: 22,
      square: 9,
    },
  },
  {
    id: '8',
    name: 'Tulsi (Holy Basil) Tincture',
    sku: 'TBT-008',
    imageUrl: 'https://placehold.co/400x400.png',
    imageHint: 'basil leaves',
    stock: {
      shopify: 30,
      square: 11,
    },
  },
];
