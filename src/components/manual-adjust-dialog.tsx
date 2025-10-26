"use client";

import { useState, useEffect } from 'react';
import type { Product, Location } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, MapPin } from 'lucide-react';

interface ManualAdjustDialogProps {
  product: Product;
  onStockUpdate: (
    productId: string,
    newStock: { shopify: number; square: number; amazon?: number }
  ) => void;
  children: React.ReactNode;
}

export function ManualAdjustDialog({
  product,
  onStockUpdate,
  children,
}: ManualAdjustDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadLocations();
      initializeQuantities();
    }
  }, [isOpen, product]);

  const loadLocations = async () => {
    try {
      setLoadingLocations(true);
      const response = await fetch('/api/locations');
      const data = await response.json();
      if (data.success) {
        setLocations(data.locations);
      }
    } catch (error) {
      console.error('Error loading locations:', error);
      toast({
        title: 'Error',
        description: 'Failed to load locations',
        variant: 'destructive',
      });
    } finally {
      setLoadingLocations(false);
    }
  };

  const initializeQuantities = () => {
    const initial: Record<string, number> = {};
    if (product.locations) {
      Object.entries(product.locations).forEach(([locationId, data]) => {
        initial[locationId] = data.quantity || 0;
      });
    }
    setQuantities(initial);
  };

  const handleQuantityChange = (locationId: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setQuantities(prev => ({ ...prev, [locationId]: numValue }));
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);

      // Call API to update inventory at each location
      const response = await fetch('/api/inventory/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          locations: quantities,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: 'Inventory levels updated successfully',
        });
        setIsOpen(false);
        // Trigger a reload of the product
        if (onStockUpdate) {
          onStockUpdate(product.id, { shopify: 0, square: 0 }); // This will trigger a refresh
        }
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to update inventory',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error adjusting inventory:', error);
      toast({
        title: 'Error',
        description: 'Failed to adjust inventory',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Adjust Stock for {product.name}</DialogTitle>
          <DialogDescription>
            Manually set the inventory levels at each location.
          </DialogDescription>
        </DialogHeader>

        {loadingLocations ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {locations.map((location) => (
              <div key={location.id} className="space-y-2">
                <Label htmlFor={`location-${location.id}`} className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  {location.name} Stock
                </Label>
                <Input
                  id={`location-${location.id}`}
                  type="number"
                  min="0"
                  value={quantities[location.id] || 0}
                  onChange={(e) => handleQuantityChange(location.id, e.target.value)}
                  disabled={submitting}
                />
              </div>
            ))}

            {locations.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-4">
                No locations available. Please create locations first.
              </p>
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || loadingLocations || locations.length === 0}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
