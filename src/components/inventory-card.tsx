
"use client";

import Image from 'next/image';
import { ShoppingBag, CreditCard, Pencil } from 'lucide-react';
import type { Product } from '@/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ManualAdjustDialog } from './manual-adjust-dialog';

interface InventoryCardProps {
  product: Product;
  onStockUpdate: (
    productId: string,
    newStock: { shopify: number; square: number }
  ) => void;
}

export default function InventoryCard({ product, onStockUpdate }: InventoryCardProps) {
  const totalStock = product.stock.shopify + product.stock.square;

  return (
    <Card className="flex flex-col overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-accent">
      <CardHeader className="p-3">
        <CardTitle className="truncate text-base font-semibold font-headline">{product.name}</CardTitle>
        <CardDescription>SKU: {product.sku}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow p-3 pt-0">
        <div className="relative mb-3 aspect-square w-full overflow-hidden rounded-md">
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover"
            data-ai-hint={product.imageHint}
          />
        </div>
        <div className="mb-3">
          <h3 className="text-xs font-medium text-muted-foreground">
            Total Stock
          </h3>
          <p className="text-2xl font-bold font-headline">{totalStock}</p>
        </div>
        <Separator />
        <div className="mt-3 space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <ShoppingBag className="h-4 w-4" />
              <span>Shopify</span>
            </div>
            <span className="font-medium">{product.stock.shopify}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CreditCard className="h-4 w-4" />
              <span>Pike Place (Square)</span>
            </div>
            <span className="font-medium">{product.stock.square}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-muted/50 p-3">
        <ManualAdjustDialog product={product} onStockUpdate={onStockUpdate}>
          <Button variant="accent" size="sm" className="w-full">
            <Pencil className="mr-2 h-4 w-4" />
            Adjust Stock
          </Button>
        </ManualAdjustDialog>
      </CardFooter>
    </Card>
  );
}
