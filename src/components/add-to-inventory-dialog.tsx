'use client';

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Location } from '@/types';

interface AddToInventoryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    variationData: {
        name: string;
        sku: string;
        price?: number | null;
        squareVariationId?: string;
        shopifyVariantId?: string;
        amazonSku?: string;
        amazonAsin?: string;
    } | null;
    onSuccess: () => void;
}

export default function AddToInventoryDialog({
    open,
    onOpenChange,
    variationData,
    onSuccess,
}: AddToInventoryDialogProps) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [locations, setLocations] = useState<Location[]>([]);
    const [loadingLocations, setLoadingLocations] = useState(true);
    const [quantity, setQuantity] = useState<string>('');
    const [locationId, setLocationId] = useState<string>('');
    const [notes, setNotes] = useState<string>('');

    useEffect(() => {
        if (open) {
            loadLocations();
            // Reset form
            setQuantity('');
            setLocationId('');
            setNotes('');
        }
    }, [open]);

    const loadLocations = async () => {
        try {
            setLoadingLocations(true);
            const response = await fetch('/api/locations');
            const data = await response.json();

            if (data.success) {
                const activeLocations = data.locations.filter((loc: Location) => loc.isActive);
                setLocations(activeLocations);

                // Auto-select primary location if exists
                const primaryLocation = activeLocations.find((loc: Location) => loc.isPrimary);
                if (primaryLocation) {
                    setLocationId(primaryLocation.id);
                }
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

    const handleAddWithStock = async () => {
        if (!variationData) return;

        const qty = parseInt(quantity);
        if (isNaN(qty) || qty <= 0) {
            toast({
                title: 'Invalid Quantity',
                description: 'Please enter a valid quantity greater than 0',
                variant: 'destructive',
            });
            return;
        }

        if (!locationId) {
            toast({
                title: 'Location Required',
                description: 'Please select a location for the initial stock',
                variant: 'destructive',
            });
            return;
        }

        await createProduct(qty, locationId);
    };

    const handleAddWithoutStock = async () => {
        if (!variationData) return;
        await createProduct(0, undefined);
    };

    const createProduct = async (qty: number, locId?: string) => {
        if (!variationData) return;

        try {
            setLoading(true);

            const response = await fetch('/api/products/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: variationData.name,
                    sku: variationData.sku,
                    price: variationData.price,
                    quantity: qty,
                    locationId: locId,
                    notes: notes || undefined,
                    squareVariationId: variationData.squareVariationId,
                    shopifyVariantId: variationData.shopifyVariantId,
                    amazonSku: variationData.amazonSku,
                    amazonAsin: variationData.amazonAsin,
                }),
            });

            const data = await response.json();

            if (data.success) {
                toast({
                    title: 'Success',
                    description: data.message || 'Product added to inventory',
                });
                onOpenChange(false);
                onSuccess();
            } else {
                toast({
                    title: 'Error',
                    description: data.error || 'Failed to add product',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Error adding product:', error);
            toast({
                title: 'Error',
                description: 'Failed to add product to inventory',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    if (!variationData) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Add to Inventory</DialogTitle>
                    <DialogDescription>
                        Add this product variation to your inventory system for tracking.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>Product Name</Label>
                        <Input value={variationData.name} disabled />
                    </div>

                    <div className="grid gap-2">
                        <Label>SKU</Label>
                        <Input value={variationData.sku} disabled />
                    </div>

                    {variationData.price !== null && variationData.price !== undefined && (
                        <div className="grid gap-2">
                            <Label>Price</Label>
                            <Input value={`$${variationData.price.toFixed(2)}`} disabled />
                        </div>
                    )}

                    <div className="grid gap-2">
                        <Label htmlFor="quantity">Initial Quantity (Optional)</Label>
                        <Input
                            id="quantity"
                            type="number"
                            min="0"
                            placeholder="Leave empty to add without stock"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            disabled={loading}
                        />
                    </div>

                    {quantity && parseInt(quantity) > 0 && (
                        <div className="grid gap-2">
                            <Label htmlFor="location">Location</Label>
                            {loadingLocations ? (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Loading locations...
                                </div>
                            ) : (
                                <Select value={locationId} onValueChange={setLocationId} disabled={loading}>
                                    <SelectTrigger id="location">
                                        <SelectValue placeholder="Select a location" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {locations.map((location) => (
                                            <SelectItem key={location.id} value={location.id}>
                                                {location.name} {location.isPrimary && '(Primary)'}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                    )}

                    <div className="grid gap-2">
                        <Label htmlFor="notes">Notes (Optional)</Label>
                        <Textarea
                            id="notes"
                            placeholder="Add any notes about this product..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            disabled={loading}
                            rows={3}
                        />
                    </div>
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2">
                    <Button
                        variant="outline"
                        onClick={handleAddWithoutStock}
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Adding...
                            </>
                        ) : (
                            'Add Without Stock'
                        )}
                    </Button>
                    <Button
                        onClick={handleAddWithStock}
                        disabled={loading || !quantity || parseInt(quantity) <= 0}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Adding...
                            </>
                        ) : (
                            'Add to Inventory'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

