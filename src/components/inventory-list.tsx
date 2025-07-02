
"use client";

import { useState } from 'react';
import Image from 'next/image';
import { LayoutGrid, List, Pencil } from 'lucide-react';
import { mockProducts } from '@/lib/mock-data';
import type { Product } from '@/types';
import InventoryCard from './inventory-card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ManualAdjustDialog } from './manual-adjust-dialog';
import { Card } from '@/components/ui/card';

type View = 'grid' | 'list';

function ViewToggle({ view, setView }: { view: View; setView: (view: View) => void }) {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant={view === 'grid' ? 'accent' : 'ghost'}
        size="icon"
        onClick={() => setView('grid')}
        aria-label="Grid View"
      >
        <LayoutGrid className="h-5 w-5" />
      </Button>
      <Button
        variant={view === 'list' ? 'accent' : 'ghost'}
        size="icon"
        onClick={() => setView('list')}
        aria-label="List View"
      >
        <List className="h-5 w-5" />
      </Button>
    </div>
  );
}

function InventoryListView({ products, onStockUpdate }: { products: Product[]; onStockUpdate: (productId: string, newStock: { shopify: number; square: number; }) => void; }) {
  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px] hidden sm:table-cell"></TableHead>
            <TableHead>Product</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead className="text-right">Shopify</TableHead>
            <TableHead className="text-right">Square</TableHead>
            <TableHead className="text-right">Total Stock</TableHead>
            <TableHead className="w-[140px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id}>
              <TableCell className="hidden sm:table-cell">
                <Image
                  alt={product.name}
                  className="aspect-square rounded-md object-cover"
                  height="64"
                  src={product.imageUrl}
                  width="64"
                  data-ai-hint={product.imageHint}
                />
              </TableCell>
              <TableCell className="font-medium">{product.name}</TableCell>
              <TableCell>{product.sku}</TableCell>
              <TableCell className="text-right">{product.stock.shopify}</TableCell>
              <TableCell className="text-right">{product.stock.square}</TableCell>
              <TableCell className="text-right font-medium">{product.stock.shopify + product.stock.square}</TableCell>
              <TableCell className="text-right">
                <ManualAdjustDialog product={product} onStockUpdate={onStockUpdate}>
                  <Button variant="accent" size="sm">
                    <Pencil className="mr-2 h-4 w-4" />
                    Adjust
                  </Button>
                </ManualAdjustDialog>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

function InventoryGridView({ products, onStockUpdate }: { products: Product[]; onStockUpdate: (productId: string, newStock: { shopify: number; square: number; }) => void; }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
      {products.map((product) => (
        <InventoryCard
          key={product.id}
          product={product}
          onStockUpdate={onStockUpdate}
        />
      ))}
    </div>
  );
}

export default function InventoryList() {
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [view, setView] = useState<View>('grid');

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
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Inventory</h2>
        <ViewToggle view={view} setView={setView} />
      </div>

      {view === 'grid' ? (
        <InventoryGridView products={products} onStockUpdate={handleStockUpdate} />
      ) : (
        <InventoryListView products={products} onStockUpdate={handleStockUpdate} />
      )}
    </div>
  );
}
