'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Product, Location } from '@/types';

interface TransferDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    product: Product;
    onSuccess?: () => void;
}

export function TransferDialog({ open, onOpenChange, product, onSuccess }: TransferDialogProps) {
    const { toast } = useToast();
    const [locations, setLocations] = useState<Location[]>([]);
    const [loadingLocations, setLoadingLocations] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        fromLocationId: '',
        toLocationId: '',
        quantity: '',
        notes: '',
    });

    useEffect(() => {
        if (open) {
            loadLocations();
        }
    }, [open]);

    const loadLocations = async () => {
        try {
            setLoadingLocations(true);
            const response = await fetch('/api/locations?activeOnly=true');
            const data = await response.json();

            console.log('Locations API response:', data);

            if (data.success) {
                setLocations(data.locations);
                console.log('Loaded locations:', data.locations);
            } else {
                console.error('Failed to load locations:', data.error);
                toast({
                    title: 'Error',
                    description: data.error || 'Failed to load locations',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Error loading locations:', error);
            toast({
                title: 'Error',
                description: 'Failed to load locations: ' + (error as Error).message,
                variant: 'destructive',
            });
        } finally {
            setLoadingLocations(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const response = await fetch('/api/inventory/transfer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productId: product.id,
                    ...formData,
                    quantity: parseInt(formData.quantity),
                }),
            });

            const data = await response.json();

            if (data.success) {
                toast({
                    title: 'Success',
                    description: data.message,
                });
                onOpenChange(false);
                setFormData({
                    fromLocationId: '',
                    toLocationId: '',
                    quantity: '',
                    notes: '',
                });
                if (onSuccess) onSuccess();
            } else {
                toast({
                    title: 'Error',
                    description: data.error,
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Error transferring inventory:', error);
            toast({
                title: 'Error',
                description: 'Failed to transfer inventory',
                variant: 'destructive',
            });
        } finally {
            setSubmitting(false);
        }
    };

    const getAvailableQuantity = (locationId: string): number => {
        if (!product.locations || !locationId) return 0;
        return product.locations[locationId]?.quantity || 0;
    };

    const maxQuantity = formData.fromLocationId
        ? getAvailableQuantity(formData.fromLocationId)
        : 0;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Transfer Inventory</DialogTitle>
                    <DialogDescription>
                        Move {product.name} between locations
                    </DialogDescription>
                </DialogHeader>

                {loadingLocations ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                ) : locations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <p className="text-muted-foreground mb-4">
                            No locations available. Please create locations first.
                        </p>
                        <Button
                            variant="outline"
                            onClick={() => {
                                onOpenChange(false);
                                window.location.href = '/locations';
                            }}
                        >
                            Go to Locations
                        </Button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="fromLocation">From Location</Label>
                                <Select
                                    value={formData.fromLocationId}
                                    onValueChange={(value) =>
                                        setFormData({ ...formData, fromLocationId: value })
                                    }
                                    required
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select source location" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {locations.map((location) => (
                                            <SelectItem
                                                key={location.id}
                                                value={location.id}
                                                disabled={
                                                    !product.locations?.[location.id] ||
                                                    product.locations[location.id].quantity === 0
                                                }
                                            >
                                                {location.name} (
                                                {product.locations?.[location.id]?.quantity || 0} available)
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="toLocation">To Location</Label>
                                <Select
                                    value={formData.toLocationId}
                                    onValueChange={(value) =>
                                        setFormData({ ...formData, toLocationId: value })
                                    }
                                    required
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select destination location" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {locations
                                            .filter((loc) => loc.id !== formData.fromLocationId)
                                            .map((location) => (
                                                <SelectItem key={location.id} value={location.id}>
                                                    {location.name}
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="quantity">Quantity</Label>
                                <Input
                                    id="quantity"
                                    type="number"
                                    min="1"
                                    max={maxQuantity}
                                    value={formData.quantity}
                                    onChange={(e) =>
                                        setFormData({ ...formData, quantity: e.target.value })
                                    }
                                    placeholder="Enter quantity"
                                    required
                                />
                                {maxQuantity > 0 && (
                                    <p className="text-xs text-muted-foreground">
                                        Maximum available: {maxQuantity}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="notes">Notes (optional)</Label>
                                <Textarea
                                    id="notes"
                                    value={formData.notes}
                                    onChange={(e) =>
                                        setFormData({ ...formData, notes: e.target.value })
                                    }
                                    placeholder="Add any notes about this transfer"
                                    rows={3}
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={submitting}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={submitting || maxQuantity === 0}>
                                {submitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Transferring...
                                    </>
                                ) : (
                                    'Transfer'
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}

