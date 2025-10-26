'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import Header from '@/components/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
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
import { Switch } from '@/components/ui/switch';
import { Loader2, MapPin, Plus, Pencil, Trash2, AlertCircle, Store, Warehouse, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Location, LocationFormData, LocationType } from '@/types';

const locationTypeIcons: Record<LocationType, any> = {
    warehouse: Warehouse,
    retail: Store,
    fulfillment: Package,
    other: MapPin,
};

const locationTypeLabels: Record<LocationType, string> = {
    warehouse: 'Warehouse',
    retail: 'Retail',
    fulfillment: 'Fulfillment Center',
    other: 'Other',
};

export default function LocationsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const [locations, setLocations] = useState<Location[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [editingLocation, setEditingLocation] = useState<Location | null>(null);
    const [deletingLocation, setDeletingLocation] = useState<Location | null>(null);
    const [formData, setFormData] = useState<LocationFormData>({
        name: '',
        type: 'warehouse',
        isActive: true,
        isPrimary: false,
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (user) {
            loadLocations();
        }
    }, [user]);

    const loadLocations = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/locations');
            const data = await response.json();

            if (data.success) {
                setLocations(data.locations);
            } else {
                toast({
                    title: 'Error',
                    description: 'Failed to load locations',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Error loading locations:', error);
            toast({
                title: 'Error',
                description: 'Failed to load locations',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (location?: Location) => {
        if (location) {
            setEditingLocation(location);
            setFormData({
                name: location.name,
                type: location.type,
                isActive: location.isActive,
                isPrimary: location.isPrimary || false,
            });
        } else {
            setEditingLocation(null);
            setFormData({
                name: '',
                type: 'warehouse',
                isActive: true,
                isPrimary: false,
            });
        }
        setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
        setEditingLocation(null);
        setFormData({
            name: '',
            type: 'warehouse',
            isActive: true,
            isPrimary: false,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const url = '/api/locations';
            const method = editingLocation ? 'PUT' : 'POST';
            const body = editingLocation
                ? { id: editingLocation.id, ...formData }
                : formData;

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const data = await response.json();

            if (data.success) {
                toast({
                    title: 'Success',
                    description: data.message,
                });
                handleCloseDialog();
                loadLocations();
            } else {
                toast({
                    title: 'Error',
                    description: data.error,
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Error saving location:', error);
            toast({
                title: 'Error',
                description: 'Failed to save location',
                variant: 'destructive',
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!deletingLocation) return;

        setSubmitting(true);
        try {
            const response = await fetch(`/api/locations?id=${deletingLocation.id}`, {
                method: 'DELETE',
            });

            const data = await response.json();

            if (data.success) {
                toast({
                    title: 'Success',
                    description: 'Location deleted successfully',
                });
                setIsDeleteDialogOpen(false);
                setDeletingLocation(null);
                loadLocations();
            } else {
                toast({
                    title: 'Error',
                    description: data.error,
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Error deleting location:', error);
            toast({
                title: 'Error',
                description: 'Failed to delete location',
                variant: 'destructive',
            });
        } finally {
            setSubmitting(false);
        }
    };

    const initializeDefaultLocations = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/locations/init', {
                method: 'POST',
            });

            const data = await response.json();

            if (data.success) {
                toast({
                    title: 'Success',
                    description: 'Default locations initialized',
                });
                loadLocations();
            } else {
                toast({
                    title: 'Error',
                    description: data.error,
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Error initializing locations:', error);
            toast({
                title: 'Error',
                description: 'Failed to initialize locations',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <>
            <Header />
            <div className="container mx-auto p-6 max-w-6xl">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold mb-2">Locations</h1>
                    <p className="text-muted-foreground">
                        Manage inventory locations and distribution centers
                    </p>
                </div>

                {locations.length === 0 && (
                    <Alert className="mb-6">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            No locations found. Initialize default locations to get started.
                        </AlertDescription>
                    </Alert>
                )}

                <div className="flex gap-4 mb-6">
                    <Button onClick={() => handleOpenDialog()}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Location
                    </Button>

                    {locations.length === 0 && (
                        <Button variant="outline" onClick={initializeDefaultLocations}>
                            Initialize Default Locations
                        </Button>
                    )}
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>All Locations</CardTitle>
                        <CardDescription>
                            {locations.length} location{locations.length !== 1 ? 's' : ''} total
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {locations.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Primary</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {locations.map((location) => {
                                        const Icon = locationTypeIcons[location.type];
                                        return (
                                            <TableRow key={location.id}>
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center gap-2">
                                                        <Icon className="h-4 w-4 text-muted-foreground" />
                                                        {location.name}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">
                                                        {locationTypeLabels[location.type]}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={location.isActive ? 'default' : 'secondary'}>
                                                        {location.isActive ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {location.isPrimary && (
                                                        <Badge variant="default">Primary</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleOpenDialog(location)}
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => {
                                                                setDeletingLocation(location);
                                                                setIsDeleteDialogOpen(true);
                                                            }}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="text-center py-12 text-muted-foreground">
                                No locations found
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Add/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingLocation ? 'Edit Location' : 'Add Location'}
                        </DialogTitle>
                        <DialogDescription>
                            {editingLocation
                                ? 'Update the location details'
                                : 'Create a new inventory location'}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit}>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData({ ...formData, name: e.target.value })
                                    }
                                    placeholder="e.g., Warehouse, Pike Place"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="type">Type</Label>
                                <Select
                                    value={formData.type}
                                    onValueChange={(value: LocationType) =>
                                        setFormData({ ...formData, type: value })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="warehouse">Warehouse</SelectItem>
                                        <SelectItem value="retail">Retail</SelectItem>
                                        <SelectItem value="fulfillment">Fulfillment Center</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center justify-between space-x-2">
                                <Label htmlFor="isActive">Active</Label>
                                <Switch
                                    id="isActive"
                                    checked={formData.isActive}
                                    onCheckedChange={(checked) =>
                                        setFormData({ ...formData, isActive: checked })
                                    }
                                />
                            </div>

                            <div className="flex items-center justify-between space-x-2">
                                <div className="space-y-0.5">
                                    <Label htmlFor="isPrimary">Primary Location</Label>
                                    <p className="text-xs text-muted-foreground">
                                        Default location for sales
                                    </p>
                                </div>
                                <Switch
                                    id="isPrimary"
                                    checked={formData.isPrimary}
                                    onCheckedChange={(checked) =>
                                        setFormData({ ...formData, isPrimary: checked })
                                    }
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleCloseDialog}
                                disabled={submitting}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={submitting}>
                                {submitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    'Save'
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Location</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete "{deletingLocation?.name}"? This action cannot be
                            undone. You can only delete locations that are not in use by any products.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsDeleteDialogOpen(false);
                                setDeletingLocation(null);
                            }}
                            disabled={submitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={submitting}
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                'Delete'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}


