"use client";

import { useState } from 'react';
import { mockProducts } from '@/lib/mock-data';
import type { Product } from '@/types';
import InventoryCard from './inventory-card';

export default function InventoryList() {
  const [products, setProducts] = useState<Product[]>(mockProducts);

  const handleStockUpdate = (
    productId: string,
    newStock: { shopify: number; square: number }
  ) => {
    setProducts((currentProducts) =>
      currentProducts.map((p) =>
        p.id === productId ? { ...p, stock: newStock } : p
      )
    );
  };

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <InventoryCard
          key={product.id}
          product={product}
          onStockUpdate={handleStockUpdate}
        />
      ))}
    </div>
  );
}
