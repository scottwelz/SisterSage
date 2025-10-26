"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { LayoutGrid, List, Pencil, Plus, Loader2, ArrowLeftRight } from 'lucide-react';
import { ProductService } from '@/lib/product-service';
import type { Product } from '@/types';
import InventoryCard from './inventory-card';
import { ProductEditDialog } from './product-edit-dialog';
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
import { TransferDialog } from './transfer-dialog';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

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

function InventoryListView({
  products,
  onStockUpdate,
  onProductUpdate
}: {
  products: Product[];
  onStockUpdate: (productId: string, newStock: { shopify: number; square: number; }) => void;
  onProductUpdate: () => void;
}) {
  const [transferDialogProduct, setTransferDialogProduct] = useState<Product | null>(null);

  return (
    <>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px] hidden sm:table-cell"></TableHead>
              <TableHead>Product</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead className="text-right">Locations</TableHead>
              <TableHead className="text-right">Total Stock</TableHead>
              <TableHead className="w-[180px]"></TableHead>
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
                <TableCell className="text-right">{product.totalQuantity || 0}</TableCell>
                <TableCell className="text-right">
                  {product.locations ? Object.keys(product.locations).length : 0} locations
                </TableCell>
                <TableCell className="text-right font-medium">{product.totalQuantity || 0}</TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-2 justify-end">
                    <ManualAdjustDialog product={product} onStockUpdate={onStockUpdate}>
                      <Button variant="accent" size="sm">
                        <Pencil className="mr-2 h-4 w-4" />
                        Adjust
                      </Button>
                    </ManualAdjustDialog>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setTransferDialogProduct(product)}
                    >
                      <ArrowLeftRight className="mr-2 h-4 w-4" />
                      Transfer
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {transferDialogProduct && (
        <TransferDialog
          product={transferDialogProduct}
          open={!!transferDialogProduct}
          onOpenChange={(open) => !open && setTransferDialogProduct(null)}
          onSuccess={onProductUpdate}
        />
      )}
    </>
  );
}

function InventoryGridView({
  products,
  onStockUpdate,
  onProductUpdate
}: {
  products: Product[];
  onStockUpdate: (productId: string, newStock: { shopify: number; square: number; }) => void;
  onProductUpdate: () => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
      {products.map((product) => (
        <InventoryCard
          key={product.id}
          product={product}
          onStockUpdate={onStockUpdate}
          onProductUpdate={onProductUpdate}
        />
      ))}
    </div>
  );
}

export default function InventoryList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [view, setView] = useState<View>('grid');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const fetchedProducts = await ProductService.getAllProducts();
      setProducts(fetchedProducts);
    } catch (err) {
      console.error('Failed to load products:', err);
      setError('Failed to load products. Please try again.');
      toast({
        title: 'Error',
        description: 'Failed to load products. Please refresh the page.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleStockUpdate = async (
    productId: string,
    newStock: { shopify: number; square: number }
  ) => {
    try {
      await ProductService.updateStock(productId, newStock);

      // Update local state
      setProducts((currentProducts) =>
        currentProducts.map((p) =>
          p.id === productId ? { ...p, stock: newStock } : p
        )
      );

      toast({
        title: 'Success',
        description: 'Stock updated successfully',
      });
    } catch (error) {
      console.error('Failed to update stock:', error);
      toast({
        title: 'Error',
        description: 'Failed to update stock. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleProductUpdate = () => {
    // Reload all products when a product is updated
    loadProducts();
  };

  const handleCreateSuccess = () => {
    loadProducts();
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p className="text-muted-foreground">Loading products...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-4">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={loadProducts} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Inventory</h2>
          <div className="flex items-center gap-2">
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
            <ViewToggle view={view} setView={setView} />
          </div>
        </div>

        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-lg font-medium mb-2">No products found</p>
            <p className="text-muted-foreground mb-4">
              Get started by adding your first product.
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Product
            </Button>
          </div>
        ) : (
          <>
            {view === 'grid' ? (
              <InventoryGridView
                products={products}
                onStockUpdate={handleStockUpdate}
                onProductUpdate={handleProductUpdate}
              />
            ) : (
              <InventoryListView
                products={products}
                onStockUpdate={handleStockUpdate}
                onProductUpdate={handleProductUpdate}
              />
            )}
          </>
        )}
      </div>

      <ProductEditDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={handleCreateSuccess}
      />
    </>
  );
}
