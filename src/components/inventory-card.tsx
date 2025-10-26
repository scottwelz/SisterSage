"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ShoppingBag, CreditCard, Pencil, Edit, Package, ArrowLeftRight, MapPin } from 'lucide-react';
import type { Product, Location } from '@/types';
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
import { ProductEditDialog } from './product-edit-dialog';
import { TransferDialog } from './transfer-dialog';

interface InventoryCardProps {
  product: Product;
  onStockUpdate: (
    productId: string,
    newStock: { shopify: number; square: number; amazon?: number }
  ) => void;
  onProductUpdate?: () => void;
}

export default function InventoryCard({
  product,
  onStockUpdate,
  onProductUpdate
}: InventoryCardProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);

  // Calculate total stock from locations
  const totalStock = product.totalQuantity || 0;

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      const response = await fetch('/api/locations');
      const data = await response.json();
      if (data.success) {
        setLocations(data.locations);
      }
    } catch (error) {
      console.error('Error loading locations:', error);
    }
  };

  const handleProductEditSuccess = () => {
    onProductUpdate?.();
  };

  const handleTransferSuccess = () => {
    onProductUpdate?.();
  };

  const getLocationName = (locationId: string): string => {
    const location = locations.find(loc => loc.id === locationId);
    return location?.name || locationId;
  };

  const getLocationQuantities = () => {
    if (!product.locations) return [];
    return Object.entries(product.locations).map(([locationId, data]) => ({
      locationId,
      name: getLocationName(locationId),
      quantity: data.quantity || 0,
    }));
  };

  return (
    <>
      <Card className="flex flex-col overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-accent">
        <CardHeader className="p-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <CardTitle className="truncate text-base font-semibold font-headline">
                {product.name}
              </CardTitle>
              <CardDescription>SKU: {product.sku}</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="flex-shrink-0 h-8 w-8 p-0 ml-2"
              onClick={() => setIsEditDialogOpen(true)}
            >
              <Edit className="h-4 w-4" />
              <span className="sr-only">Edit product</span>
            </Button>
          </div>
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
            {getLocationQuantities().length > 0 ? (
              getLocationQuantities().map(({ locationId, name, quantity }) => (
                <div key={locationId} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{name}</span>
                  </div>
                  <span className="font-medium">{quantity}</span>
                </div>
              ))
            ) : (
              <div className="text-xs text-muted-foreground text-center py-2">
                No inventory at any location
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="bg-muted/50 p-2 flex flex-col gap-2">
          <ManualAdjustDialog product={product} onStockUpdate={onStockUpdate}>
            <Button variant="accent" size="sm" className="w-full">
              <Pencil className="mr-2 h-4 w-4" />
              Adjust Stock
            </Button>
          </ManualAdjustDialog>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => setIsTransferDialogOpen(true)}
          >
            <ArrowLeftRight className="mr-2 h-4 w-4" />
            Transfer
          </Button>
        </CardFooter>
      </Card>

      <ProductEditDialog
        product={product}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSuccess={handleProductEditSuccess}
      />

      <TransferDialog
        product={product}
        open={isTransferDialogOpen}
        onOpenChange={setIsTransferDialogOpen}
        onSuccess={handleTransferSuccess}
      />
    </>
  );
}
