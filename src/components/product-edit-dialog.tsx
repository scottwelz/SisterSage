"use client";

import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Loader2, Upload, X, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { ProductService } from '@/lib/product-service';
import type { Product, ProductFormData, UploadProgress } from '@/types';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

const productSchema = z.object({
    name: z.string().min(1, 'Product name is required'),
    sku: z.string().min(1, 'SKU is required'),
    description: z.string().optional(),
    price: z.number().min(0, 'Price must be positive').optional(),
    imageHint: z.string().min(1, 'Image hint is required'),
    stock: z.object({
        shopify: z.number().min(0, 'Shopify stock must be non-negative'),
        square: z.number().min(0, 'Square stock must be non-negative'),
    }),
});

interface ProductEditDialogProps {
    product?: Product;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function ProductEditDialog({
    product,
    open,
    onOpenChange,
    onSuccess,
}: ProductEditDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
        isUploading: false,
        progress: 0,
    });
        const [selectedImage, setSelectedImage] = useState<File | null>(null);

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setSelectedImage(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };
        const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const handleRemoveImage = () => {
        if (previewUrl?.startsWith('blob:')) {
            URL.revokeObjectURL(previewUrl);
        }
        setPreviewUrl(null);
        setSelectedImage(null);
    };
    const { toast } = useToast();

    const form = useForm<ProductFormData>({
        resolver: zodResolver(productSchema),
        defaultValues: {
            name: '',
            sku: '',
            description: '',
            price: undefined,
            imageHint: '',
            stock: {
                shopify: 0,
                square: 0,
            },
        },
    });

    const isEditing = !!product;

    // Reset form when product changes or dialog opens
        useEffect(() => {
        if (!open) {
            // Clear the selected image when the dialog is closed
            setSelectedImage(null);
        }
    }, [open]);

    useEffect(() => {
        if (product) {
            form.reset({
                name: product.name,
                sku: product.sku,
                description: product.description || '',
                price: product.price || undefined,
                imageHint: product.imageHint,
                stock: product.stock,
            });
            setPreviewUrl(product.imageUrl);
        } else {
            form.reset({
                name: '',
                sku: '',
                description: '',
                price: undefined,
                imageHint: '',
                stock: {
                    shopify: 0,
                    square: 0,
                },
            });
            setPreviewUrl(null);
        }
        setSelectedImage(null);
    }, [product, form, open]);

    const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setSelectedImage(file);
            const reader = new FileReader();
            reader.onload = (e) => {
                setPreviewUrl(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };



    const onSubmit = async (data: ProductFormData) => {
        try {
            setIsSubmitting(true);
            setUploadProgress({ isUploading: true, progress: 0 });

            if (isEditing && product) {
                await ProductService.updateProduct(
                    product.id,
                    data,
                    selectedImage || undefined,
                );
                toast({
                    title: 'Success',
                    description: 'Product updated successfully',
                });
            } else {
                await ProductService.createProduct(data, selectedImage || undefined);
                toast({
                    title: 'Success',
                    description: 'Product created successfully',
                });
            }

            onSuccess();
            onOpenChange(false);
        } catch (error) {
            console.error('Error saving product:', error);
            toast({
                title: 'Error',
                description: 'Failed to save product. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
            setUploadProgress({ isUploading: false, progress: 0 });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? 'Edit Product' : 'Create New Product'}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? 'Update the product information and image.'
                            : 'Add a new product to your inventory.'}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        {/* Image Upload Section */}
                        <div className="space-y-4">
                            <FormLabel>Product Image</FormLabel>

                            {previewUrl ? (
                                <div className="relative w-32 h-32 mx-auto">
                                                                        <img
                                        src={previewUrl}
                                        alt="Product preview"
                                        className="w-full h-full object-cover rounded-lg"
                                    />
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="sm"
                                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                                        onClick={handleRemoveImage}
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>
                                </div>
                            ) : (
                                <div className="w-32 h-32 mx-auto border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center">
                                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                                </div>
                            )}

                            <div className="flex justify-center">
                                <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageSelect}
                                    className="hidden"
                                    id="image-upload"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => document.getElementById('image-upload')?.click()}
                                    disabled={uploadProgress.isUploading}
                                >
                                    <Upload className="mr-2 h-4 w-4" />
                                    {previewUrl ? 'Change Image' : 'Upload Image'}
                                </Button>
                            </div>

                            {uploadProgress.isUploading && (
                                <div className="space-y-2">
                                    <Progress value={uploadProgress.progress} className="w-full" />
                                    <p className="text-sm text-muted-foreground text-center">
                                        Uploading... {Math.round(uploadProgress.progress)}%
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Form Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Product Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter product name" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="sku"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>SKU</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter SKU" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Enter product description (optional)"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="price"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Price</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            placeholder="Enter price (optional)"
                                            {...field}
                                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="imageHint"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Image Hint</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Brief description for AI (e.g., 'herbal tincture bottle')"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        This helps with accessibility and AI image recognition
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="space-y-4">
                            <FormLabel>Stock Levels</FormLabel>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="stock.shopify"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Shopify Stock</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    {...field}
                                                    onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="stock.square"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Square Stock</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    {...field}
                                                    onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isEditing ? 'Update Product' : 'Create Product'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
} 