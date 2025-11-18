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

interface ProductionEntryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    product: Product;
    onSuccess?: () => void;
}

export function ProductionEntryDialog({
    open,
    onOpenChange,
    product,
    onSuccess,
}: ProductionEntryDialogProps) {
    const { toast } = useToast();
    const [locations, setLocations] = useState<Location[]>([]);
    const [loadingLocations, setLoadingLocations] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        toLocationId: '',
        quantity: '',
        batchNumber: '',
        productionDate: new Date().toISOString().split('T')[0],
        expirationDate: '',
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

            if (data.success) {
                setLocations(data.locations);
                // Set default to primary location if available
                const primaryLocation = data.locations.find((loc: Location) => loc.isPrimary);
                if (primaryLocation && !formData.toLocationId) {
                    setFormData((prev) => ({ ...prev, toLocationId: primaryLocation.id }));
                }
            }
        } catch (error) {
            console.error('Error loading locations:', error);
        } finally {
            setLoadingLocations(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const response = await fetch('/api/inventory/production', {
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
                    toLocationId: '',
                    quantity: '',
                    batchNumber: '',
                    productionDate: new Date().toISOString().split('T')[0],
                    expirationDate: '',
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
            console.error('Error adding production:', error);
            toast({
                title: 'Error',
                description: 'Failed to add production',
                variant: 'destructive',
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Add Production</DialogTitle>
                    <DialogDescription>
                        Record newly manufactured inventory for {product.name}
                    </DialogDescription>
                </DialogHeader>

                {loadingLocations ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="toLocation">Destination Location</Label>
                                <Select
                                    value={formData.toLocationId}
                                    onValueChange={(value) =>
                                        setFormData({ ...formData, toLocationId: value })
                                    }
                                    required
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select location" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {locations.map((location) => (
                                            <SelectItem key={location.id} value={location.id}>
                                                {location.name}
                                                {location.isPrimary && ' (Primary)'}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="quantity">Quantity Produced</Label>
                                <Input
                                    id="quantity"
                                    type="number"
                                    min="1"
                                    value={formData.quantity}
                                    onChange={(e) =>
                                        setFormData({ ...formData, quantity: e.target.value })
                                    }
                                    placeholder="Enter quantity"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="batchNumber">Batch/Lot Number</Label>
                                <Input
                                    id="batchNumber"
                                    value={formData.batchNumber}
                                    onChange={(e) =>
                                        setFormData({ ...formData, batchNumber: e.target.value })
                                    }
                                    placeholder="e.g., LOT-2025-001"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="productionDate">Production Date</Label>
                                    <Input
                                        id="productionDate"
                                        type="date"
                                        value={formData.productionDate}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                productionDate: e.target.value,
                                            })
                                        }
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="expirationDate">Expiration Date</Label>
                                    <Input
                                        id="expirationDate"
                                        type="date"
                                        value={formData.expirationDate}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                expirationDate: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="notes">Notes (optional)</Label>
                                <Textarea
                                    id="notes"
                                    value={formData.notes}
                                    onChange={(e) =>
                                        setFormData({ ...formData, notes: e.target.value })
                                    }
                                    placeholder="Add any notes about this production batch"
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
                            <Button type="submit" disabled={submitting}>
                                {submitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Adding...
                                    </>
                                ) : (
                                    'Add Production'
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}



