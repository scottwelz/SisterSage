'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import Header from '@/components/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Loader2, RefreshCw, AlertCircle, Copy, Check, Package, ShoppingCart, ShoppingBag, Store, Plus, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import AddToInventoryDialog from '@/components/add-to-inventory-dialog';
import { ProductService } from '@/lib/product-service';

// Square Types
interface SquareVariation {
    id: string;
    name: string;
    sku: string;
    price: number | null;
    priceCurrency: string;
}

interface SquareItem {
    id: string;
    type: string;
    name: string;
    description: string;
    abbreviation: string;
    categoryId: string | null;
    variations: SquareVariation[];
    updatedAt: string;
    version: number;
}

// Shopify Types
interface ShopifyVariation {
    id: string;
    name: string;
    sku: string;
    price: number | null;
    inventoryQuantity: number;
}

interface ShopifyItem {
    id: string;
    name: string;
    description: string;
    vendor: string;
    productType: string;
    variations: ShopifyVariation[];
    updatedAt: string;
}

// Amazon Types
interface AmazonVariation {
    id: string;
    name: string;
    sku: string;
    asin: string;
    price: number | null;
}

interface AmazonItem {
    id: string;
    name: string;
    description: string;
    asin: string;
    sku: string;
    variations: AmazonVariation[];
    updatedAt: string;
}

type PlatformType = 'square' | 'shopify' | 'amazon';

interface CatalogState {
    loading: boolean;
    error: string | null;
    items: any[];
    count: number;
}

export default function CatalogPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const [squareState, setSquareState] = useState<CatalogState>({
        loading: true,
        error: null,
        items: [],
        count: 0,
    });

    const [shopifyState, setShopifyState] = useState<CatalogState>({
        loading: true,
        error: null,
        items: [],
        count: 0,
    });

    const [amazonState, setAmazonState] = useState<CatalogState>({
        loading: true,
        error: null,
        items: [],
        count: 0,
    });

    // Add to Inventory dialog state
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedVariation, setSelectedVariation] = useState<{
        name: string;
        sku: string;
        price?: number | null;
        squareVariationId?: string;
        shopifyVariantId?: string;
        amazonSku?: string;
        amazonAsin?: string;
    } | null>(null);
    const [trackedSkus, setTrackedSkus] = useState<Set<string>>(new Set());
    const [loadingSkus, setLoadingSkus] = useState(true);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (user) {
            loadAllCatalogs();
            loadTrackedSkus();
        }
    }, [user]);

    const loadTrackedSkus = async () => {
        try {
            setLoadingSkus(true);
            const skus = await ProductService.getAllSkus();
            setTrackedSkus(skus);
        } catch (error) {
            console.error('Error loading tracked SKUs:', error);
            toast({
                title: 'Error',
                description: 'Failed to load tracked products',
                variant: 'destructive',
            });
        } finally {
            setLoadingSkus(false);
        }
    };

    const loadAllCatalogs = async () => {
        await Promise.all([
            loadSquareCatalog(),
            loadShopifyCatalog(),
            loadAmazonCatalog(),
        ]);
    };

    const loadSquareCatalog = async () => {
        try {
            setSquareState(prev => ({ ...prev, loading: true, error: null }));

            const response = await fetch('/api/square/catalog');
            const data = await response.json();

            if (response.ok && data.success) {
                setSquareState({
                    loading: false,
                    error: null,
                    items: data.items,
                    count: data.items.length,
                });
            } else {
                setSquareState({
                    loading: false,
                    error: data.error || 'Failed to load Square catalog',
                    items: [],
                    count: 0,
                });
            }
        } catch (err) {
            console.error('Error loading Square catalog:', err);
            setSquareState({
                loading: false,
                error: 'Failed to load Square catalog',
                items: [],
                count: 0,
            });
        }
    };

    const loadShopifyCatalog = async () => {
        try {
            setShopifyState(prev => ({ ...prev, loading: true, error: null }));

            const response = await fetch('/api/shopify/catalog');
            const data = await response.json();

            if (response.ok && data.success) {
                setShopifyState({
                    loading: false,
                    error: null,
                    items: data.items,
                    count: data.items.length,
                });
            } else {
                setShopifyState({
                    loading: false,
                    error: data.error || 'Failed to load Shopify catalog',
                    items: [],
                    count: 0,
                });
            }
        } catch (err) {
            console.error('Error loading Shopify catalog:', err);
            setShopifyState({
                loading: false,
                error: 'Failed to load Shopify catalog',
                items: [],
                count: 0,
            });
        }
    };

    const loadAmazonCatalog = async () => {
        try {
            setAmazonState(prev => ({ ...prev, loading: true, error: null }));

            const response = await fetch('/api/amazon/catalog');
            const data = await response.json();

            if (response.ok && data.success) {
                setAmazonState({
                    loading: false,
                    error: data.isPlaceholder ? data.message || null : null,
                    items: data.items,
                    count: data.items.length,
                });
            } else {
                setAmazonState({
                    loading: false,
                    error: data.error || 'Failed to load Amazon catalog',
                    items: [],
                    count: 0,
                });
            }
        } catch (err) {
            console.error('Error loading Amazon catalog:', err);
            setAmazonState({
                loading: false,
                error: 'Failed to load Amazon catalog',
                items: [],
                count: 0,
            });
        }
    };

    const copyToClipboard = async (text: string, label: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedId(text);
            toast({
                title: 'Copied!',
                description: `${label} copied to clipboard`,
            });
            setTimeout(() => setCopiedId(null), 2000);
        } catch (err) {
            toast({
                title: 'Failed to copy',
                description: 'Could not copy to clipboard',
                variant: 'destructive',
            });
        }
    };

    const handleAddToInventory = (variationData: {
        name: string;
        sku: string;
        price?: number | null;
        squareVariationId?: string;
        shopifyVariantId?: string;
        amazonSku?: string;
        amazonAsin?: string;
    }) => {
        setSelectedVariation(variationData);
        setDialogOpen(true);
    };

    const handleDialogSuccess = () => {
        // Reload tracked SKUs after successful add
        loadTrackedSkus();
    };

    const isSkuTracked = (sku: string | undefined): boolean => {
        if (!sku) return false;
        return trackedSkus.has(sku);
    };

    const renderSquareTab = () => (
        <TabsContent value="square" className="space-y-6">
            {squareState.error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{squareState.error}</AlertDescription>
                </Alert>
            )}

            {/* <div className="flex gap-4 items-center">
                <Button onClick={loadSquareCatalog} disabled={squareState.loading}>
                    {squareState.loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Loading...
                        </>
                    ) : (
                        <>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Refresh
                        </>
                    )}
                </Button>

                {squareState.count > 0 && (
                    <Badge variant="secondary" className="flex items-center gap-2 px-4 py-2">
                        <Package className="h-4 w-4" />
                        {squareState.count} {squareState.count === 1 ? 'item' : 'items'}
                    </Badge>
                )}
            </div> */}

            {squareState.items.length === 0 && !squareState.loading ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground mb-4">
                            No items found in your Square catalog
                        </p>
                        <Button onClick={loadSquareCatalog}>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Try Again
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-6">
                    {squareState.items.map((item: SquareItem) => (
                        <Card key={item.id}>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <CardTitle className="text-xl">{item.name}</CardTitle>
                                        {item.description && (
                                            <CardDescription className="mt-1">
                                                {item.description}
                                            </CardDescription>
                                        )}
                                    </div>
                                    <Badge variant="outline">
                                        {item.variations.length} variation{item.variations.length !== 1 ? 's' : ''}
                                    </Badge>
                                </div>

                                <div className="flex items-center gap-2 mt-2">
                                    <span className="text-sm text-muted-foreground">Item ID:</span>
                                    <code className="text-xs bg-muted px-2 py-1 rounded">
                                        {item.id}
                                    </code>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0"
                                        onClick={() => copyToClipboard(item.id, 'Item ID')}
                                    >
                                        {copiedId === item.id ? (
                                            <Check className="h-3 w-3 text-green-600" />
                                        ) : (
                                            <Copy className="h-3 w-3" />
                                        )}
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Variation</TableHead>
                                            <TableHead>SKU</TableHead>
                                            <TableHead>Price</TableHead>
                                            <TableHead>Variation ID</TableHead>
                                            <TableHead className="w-12"></TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {item.variations.map((variation) => (
                                            <TableRow key={variation.id}>
                                                <TableCell className="font-medium">
                                                    {variation.name}
                                                </TableCell>
                                                <TableCell>
                                                    {variation.sku ? (
                                                        <code className="text-xs bg-muted px-2 py-1 rounded">
                                                            {variation.sku}
                                                        </code>
                                                    ) : (
                                                        <span className="text-muted-foreground text-sm">No SKU</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {variation.price !== null ? (
                                                        <span>
                                                            ${variation.price.toFixed(2)} {variation.priceCurrency}
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted-foreground text-sm">No price</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <code className="text-xs bg-muted px-2 py-1 rounded">
                                                        {variation.id}
                                                    </code>
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 w-6 p-0"
                                                        onClick={() => copyToClipboard(variation.id, 'Variation ID')}
                                                    >
                                                        {copiedId === variation.id ? (
                                                            <Check className="h-3 w-3 text-green-600" />
                                                        ) : (
                                                            <Copy className="h-3 w-3" />
                                                        )}
                                                    </Button>
                                                </TableCell>
                                                <TableCell>
                                                    {loadingSkus ? (
                                                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                                    ) : isSkuTracked(variation.sku) ? (
                                                        <Badge variant="secondary" className="gap-1">
                                                            <CheckCircle2 className="h-3 w-3" />
                                                            Tracked
                                                        </Badge>
                                                    ) : variation.sku ? (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-8 gap-1"
                                                            onClick={() => handleAddToInventory({
                                                                name: variation.name,
                                                                sku: variation.sku,
                                                                price: variation.price,
                                                                squareVariationId: variation.id,
                                                            })}
                                                        >
                                                            <Plus className="h-3 w-3" />
                                                            Add to Inventory
                                                        </Button>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">No SKU</span>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </TabsContent>
    );

    const renderShopifyTab = () => (
        <TabsContent value="shopify" className="space-y-6">
            {shopifyState.error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{shopifyState.error}</AlertDescription>
                </Alert>
            )}

            <div className="flex gap-4 items-center">
                <Button onClick={loadShopifyCatalog} disabled={shopifyState.loading}>
                    {shopifyState.loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Loading...
                        </>
                    ) : (
                        <>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Refresh
                        </>
                    )}
                </Button>

                {shopifyState.count > 0 && (
                    <Badge variant="secondary" className="flex items-center gap-2 px-4 py-2">
                        <Package className="h-4 w-4" />
                        {shopifyState.count} {shopifyState.count === 1 ? 'product' : 'products'}
                    </Badge>
                )}
            </div>

            {shopifyState.items.length === 0 && !shopifyState.loading ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <ShoppingBag className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground mb-4">
                            No products found in your Shopify catalog
                        </p>
                        <Button onClick={loadShopifyCatalog}>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Try Again
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-6">
                    {shopifyState.items.map((item: ShopifyItem) => (
                        <Card key={item.id}>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <CardTitle className="text-xl">{item.name}</CardTitle>
                                        {item.description && (
                                            <CardDescription className="mt-1">
                                                {item.description.substring(0, 200)}
                                                {item.description.length > 200 ? '...' : ''}
                                            </CardDescription>
                                        )}
                                        {item.vendor && (
                                            <div className="mt-2">
                                                <Badge variant="secondary">{item.vendor}</Badge>
                                            </div>
                                        )}
                                    </div>
                                    <Badge variant="outline">
                                        {item.variations.length} variant{item.variations.length !== 1 ? 's' : ''}
                                    </Badge>
                                </div>

                                <div className="flex items-center gap-2 mt-2">
                                    <span className="text-sm text-muted-foreground">Product ID:</span>
                                    <code className="text-xs bg-muted px-2 py-1 rounded">
                                        {item.id}
                                    </code>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0"
                                        onClick={() => copyToClipboard(item.id, 'Product ID')}
                                    >
                                        {copiedId === item.id ? (
                                            <Check className="h-3 w-3 text-green-600" />
                                        ) : (
                                            <Copy className="h-3 w-3" />
                                        )}
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Variant</TableHead>
                                            <TableHead>SKU</TableHead>
                                            <TableHead>Price</TableHead>
                                            <TableHead>Stock</TableHead>
                                            <TableHead>Variant ID</TableHead>
                                            <TableHead className="w-12"></TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {item.variations.map((variation) => (
                                            <TableRow key={variation.id}>
                                                <TableCell className="font-medium">
                                                    {variation.name}
                                                </TableCell>
                                                <TableCell>
                                                    {variation.sku ? (
                                                        <code className="text-xs bg-muted px-2 py-1 rounded">
                                                            {variation.sku}
                                                        </code>
                                                    ) : (
                                                        <span className="text-muted-foreground text-sm">No SKU</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {variation.price !== null ? (
                                                        <span>${variation.price.toFixed(2)}</span>
                                                    ) : (
                                                        <span className="text-muted-foreground text-sm">No price</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={variation.inventoryQuantity > 0 ? 'default' : 'destructive'}>
                                                        {variation.inventoryQuantity}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <code className="text-xs bg-muted px-2 py-1 rounded">
                                                        {variation.id}
                                                    </code>
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 w-6 p-0"
                                                        onClick={() => copyToClipboard(variation.id, 'Variant ID')}
                                                    >
                                                        {copiedId === variation.id ? (
                                                            <Check className="h-3 w-3 text-green-600" />
                                                        ) : (
                                                            <Copy className="h-3 w-3" />
                                                        )}
                                                    </Button>
                                                </TableCell>
                                                <TableCell>
                                                    {loadingSkus ? (
                                                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                                    ) : isSkuTracked(variation.sku) ? (
                                                        <Badge variant="secondary" className="gap-1">
                                                            <CheckCircle2 className="h-3 w-3" />
                                                            Tracked
                                                        </Badge>
                                                    ) : variation.sku ? (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-8 gap-1"
                                                            onClick={() => handleAddToInventory({
                                                                name: variation.name,
                                                                sku: variation.sku,
                                                                price: variation.price,
                                                                shopifyVariantId: variation.id,
                                                            })}
                                                        >
                                                            <Plus className="h-3 w-3" />
                                                            Add to Inventory
                                                        </Button>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">No SKU</span>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </TabsContent>
    );

    const renderAmazonTab = () => (
        <TabsContent value="amazon" className="space-y-6">
            {amazonState.error && (
                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{amazonState.error}</AlertDescription>
                </Alert>
            )}

            <div className="flex gap-4 items-center">
                <Button onClick={loadAmazonCatalog} disabled={amazonState.loading}>
                    {amazonState.loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Loading...
                        </>
                    ) : (
                        <>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Refresh
                        </>
                    )}
                </Button>

                {amazonState.count > 0 && (
                    <Badge variant="secondary" className="flex items-center gap-2 px-4 py-2">
                        <Package className="h-4 w-4" />
                        {amazonState.count} {amazonState.count === 1 ? 'item' : 'items'}
                    </Badge>
                )}
            </div>

            {amazonState.items.length === 0 && !amazonState.loading ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Store className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground mb-4">
                            Amazon SP-API integration not yet configured
                        </p>
                        <p className="text-sm text-muted-foreground text-center max-w-md">
                            This requires additional setup including AWS credentials, LWA authentication,
                            and the Selling Partner API SDK. See the documentation for details.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-6">
                    {amazonState.items.map((item: AmazonItem) => (
                        <Card key={item.id}>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <CardTitle className="text-xl">{item.name}</CardTitle>
                                        {item.description && (
                                            <CardDescription className="mt-1">
                                                {item.description}
                                            </CardDescription>
                                        )}
                                    </div>
                                    <Badge variant="outline">
                                        {item.variations.length} variation{item.variations.length !== 1 ? 's' : ''}
                                    </Badge>
                                </div>

                                <div className="flex items-center gap-4 mt-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-muted-foreground">ASIN:</span>
                                        <code className="text-xs bg-muted px-2 py-1 rounded">
                                            {item.asin}
                                        </code>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 w-6 p-0"
                                            onClick={() => copyToClipboard(item.asin, 'ASIN')}
                                        >
                                            {copiedId === item.asin ? (
                                                <Check className="h-3 w-3 text-green-600" />
                                            ) : (
                                                <Copy className="h-3 w-3" />
                                            )}
                                        </Button>
                                    </div>
                                    {item.sku && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-muted-foreground">SKU:</span>
                                            <code className="text-xs bg-muted px-2 py-1 rounded">
                                                {item.sku}
                                            </code>
                                        </div>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Variation</TableHead>
                                            <TableHead>SKU</TableHead>
                                            <TableHead>ASIN</TableHead>
                                            <TableHead>Price</TableHead>
                                            <TableHead className="w-12"></TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {item.variations.map((variation) => (
                                            <TableRow key={variation.id}>
                                                <TableCell className="font-medium">
                                                    {variation.name}
                                                </TableCell>
                                                <TableCell>
                                                    {variation.sku ? (
                                                        <code className="text-xs bg-muted px-2 py-1 rounded">
                                                            {variation.sku}
                                                        </code>
                                                    ) : (
                                                        <span className="text-muted-foreground text-sm">No SKU</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <code className="text-xs bg-muted px-2 py-1 rounded">
                                                        {variation.asin}
                                                    </code>
                                                </TableCell>
                                                <TableCell>
                                                    {variation.price !== null ? (
                                                        <span>${variation.price.toFixed(2)}</span>
                                                    ) : (
                                                        <span className="text-muted-foreground text-sm">No price</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 w-6 p-0"
                                                        onClick={() => copyToClipboard(variation.asin, 'ASIN')}
                                                    >
                                                        {copiedId === variation.asin ? (
                                                            <Check className="h-3 w-3 text-green-600" />
                                                        ) : (
                                                            <Copy className="h-3 w-3" />
                                                        )}
                                                    </Button>
                                                </TableCell>
                                                <TableCell>
                                                    {loadingSkus ? (
                                                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                                    ) : isSkuTracked(variation.sku) ? (
                                                        <Badge variant="secondary" className="gap-1">
                                                            <CheckCircle2 className="h-3 w-3" />
                                                            Tracked
                                                        </Badge>
                                                    ) : variation.sku ? (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-8 gap-1"
                                                            onClick={() => handleAddToInventory({
                                                                name: variation.name,
                                                                sku: variation.sku,
                                                                price: variation.price,
                                                                amazonSku: variation.sku,
                                                                amazonAsin: variation.asin,
                                                            })}
                                                        >
                                                            <Plus className="h-3 w-3" />
                                                            Add to Inventory
                                                        </Button>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">No SKU</span>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </TabsContent>
    );

    if (authLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    const isLoading = squareState.loading || shopifyState.loading || amazonState.loading;
    const totalCount = squareState.count + shopifyState.count + amazonState.count;

    return (
        <>
            <Header />
            <div className="container mx-auto p-6 max-w-7xl">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold mb-2">Multi-Platform Catalog</h1>
                    <p className="text-muted-foreground">
                        Compare products, SKUs, and identifiers across Square, Shopify, and Amazon
                    </p>
                </div>

                <div className="flex gap-4 mb-6">
                    <Button onClick={loadAllCatalogs} disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Loading...
                            </>
                        ) : (
                            <>
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Refresh All
                            </>
                        )}
                    </Button>

                    {totalCount > 0 && (
                        <Badge variant="secondary" className="flex items-center gap-2 px-4 py-2">
                            <Package className="h-4 w-4" />
                            {totalCount} total items
                        </Badge>
                    )}
                </div>

                <Tabs defaultValue="square" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="square" className="gap-2">
                            <ShoppingCart className="h-4 w-4" />
                            Square ({squareState.count})
                        </TabsTrigger>
                        <TabsTrigger value="shopify" className="gap-2">
                            <ShoppingBag className="h-4 w-4" />
                            Shopify ({shopifyState.count})
                        </TabsTrigger>
                        <TabsTrigger value="amazon" className="gap-2">
                            <Store className="h-4 w-4" />
                            Amazon ({amazonState.count})
                        </TabsTrigger>
                    </TabsList>

                    {renderSquareTab()}
                    {renderShopifyTab()}
                    {renderAmazonTab()}
                </Tabs>

                {totalCount > 0 && (
                    <Card className="mt-6 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                        <CardHeader>
                            <CardTitle className="text-lg">Using Platform Identifiers</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm space-y-3">
                            <div>
                                <strong>Square:</strong> Use <code className="bg-white dark:bg-gray-900 px-1 py-0.5 rounded">Item ID</code> and <code className="bg-white dark:bg-gray-900 px-1 py-0.5 rounded">Variation ID</code> for product mapping
                            </div>
                            <div>
                                <strong>Shopify:</strong> Use <code className="bg-white dark:bg-gray-900 px-1 py-0.5 rounded">Product ID</code> and <code className="bg-white dark:bg-gray-900 px-1 py-0.5 rounded">Variant ID</code> for inventory tracking
                            </div>
                            <div>
                                <strong>Amazon:</strong> Use <code className="bg-white dark:bg-gray-900 px-1 py-0.5 rounded">ASIN</code> and <code className="bg-white dark:bg-gray-900 px-1 py-0.5 rounded">SKU</code> for product identification
                            </div>
                            <p className="mt-4">
                                💡 <strong>Tip:</strong> Click the copy button next to any ID to copy it to your clipboard for easy mapping.
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>

            <AddToInventoryDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                variationData={selectedVariation}
                onSuccess={handleDialogSuccess}
            />
        </>
    );
}

