import type { PlatformProduct, Platform } from '@/types';

/**
 * Unified service to fetch products from all e-commerce platforms
 */
export class PlatformFetcher {
    /**
     * Fetch products from Shopify
     */
    static async fetchShopifyProducts(): Promise<PlatformProduct[]> {
        try {
            const response = await fetch('/api/shopify');

            if (!response.ok) {
                throw new Error(`Shopify API error: ${response.statusText}`);
            }

            const data = await response.json();

            // Transform Shopify response to PlatformProduct format
            const products: PlatformProduct[] = [];

            if (data.products && Array.isArray(data.products)) {
                for (const product of data.products) {
                    // Shopify products can have multiple variants
                    for (const variant of product.variants || []) {
                        products.push({
                            id: product.id.toString(),
                            variantId: variant.id.toString(),
                            sku: variant.sku || '',
                            name: variant.title !== 'Default Title'
                                ? `${product.title} - ${variant.title}`
                                : product.title,
                            description: product.body_html || '',
                            price: parseFloat(variant.price || '0'),
                            imageUrl: product.image?.src || product.images?.[0]?.src || '',
                            inventory: variant.inventory_quantity || 0,
                            platform: 'shopify',
                            rawData: { product, variant }
                        });
                    }
                }
            }

            return products;
        } catch (error) {
            console.error('Error fetching Shopify products:', error);
            throw error;
        }
    }

    /**
     * Fetch products from Square
     */
    static async fetchSquareProducts(): Promise<PlatformProduct[]> {
        try {
            const response = await fetch('/api/square');

            if (!response.ok) {
                throw new Error(`Square API error: ${response.statusText}`);
            }

            const data = await response.json();

            // Transform Square response to PlatformProduct format
            const products: PlatformProduct[] = [];

            if (data.counts && Array.isArray(data.counts)) {
                for (const count of data.counts) {
                    const catalogObjectId = count.catalog_object_id;
                    const itemVariationId = count.catalog_object_id;

                    // We'll need to fetch catalog details to get name, SKU, etc.
                    // For now, create a basic structure
                    products.push({
                        id: catalogObjectId,
                        variantId: itemVariationId,
                        sku: '', // Will need catalog API to get this
                        name: '', // Will need catalog API to get this
                        inventory: parseFloat(count.quantity || '0'),
                        platform: 'square',
                        rawData: count
                    });
                }
            }

            return products;
        } catch (error) {
            console.error('Error fetching Square products:', error);
            throw error;
        }
    }

    /**
     * Fetch products from Amazon
     */
    static async fetchAmazonProducts(): Promise<PlatformProduct[]> {
        try {
            const response = await fetch('/api/amazon');

            if (!response.ok) {
                throw new Error(`Amazon API error: ${response.statusText}`);
            }

            const data = await response.json();

            // Transform Amazon SP-API response to PlatformProduct format
            const products: PlatformProduct[] = [];

            if (data.payload && Array.isArray(data.payload)) {
                for (const item of data.payload) {
                    products.push({
                        id: item.asin || '',
                        sku: item.sellerSku || '',
                        name: item.itemName || '',
                        description: item.itemDescription || '',
                        price: parseFloat(item.price?.amount || '0'),
                        imageUrl: item.mainImage?.link || '',
                        inventory: item.summaries?.[0]?.totalQuantity || 0,
                        platform: 'amazon',
                        rawData: item
                    });
                }
            }

            return products;
        } catch (error) {
            console.error('Error fetching Amazon products:', error);
            throw error;
        }
    }

    /**
     * Fetch products from all platforms
     */
    static async fetchAllProducts(): Promise<{
        shopify: PlatformProduct[];
        square: PlatformProduct[];
        amazon: PlatformProduct[];
        errors: { platform: Platform; error: string }[];
    }> {
        const results = {
            shopify: [] as PlatformProduct[],
            square: [] as PlatformProduct[],
            amazon: [] as PlatformProduct[],
            errors: [] as { platform: Platform; error: string }[]
        };

        // Fetch from all platforms in parallel
        const [shopifyResult, squareResult, amazonResult] = await Promise.allSettled([
            this.fetchShopifyProducts(),
            this.fetchSquareProducts(),
            this.fetchAmazonProducts()
        ]);

        if (shopifyResult.status === 'fulfilled') {
            results.shopify = shopifyResult.value;
        } else {
            results.errors.push({
                platform: 'shopify',
                error: shopifyResult.reason?.message || 'Unknown error'
            });
        }

        if (squareResult.status === 'fulfilled') {
            results.square = squareResult.value;
        } else {
            results.errors.push({
                platform: 'square',
                error: squareResult.reason?.message || 'Unknown error'
            });
        }

        if (amazonResult.status === 'fulfilled') {
            results.amazon = amazonResult.value;
        } else {
            results.errors.push({
                platform: 'amazon',
                error: amazonResult.reason?.message || 'Unknown error'
            });
        }

        return results;
    }

    /**
     * Fetch products from a specific platform
     */
    static async fetchFromPlatform(platform: Platform): Promise<PlatformProduct[]> {
        switch (platform) {
            case 'shopify':
                return this.fetchShopifyProducts();
            case 'square':
                return this.fetchSquareProducts();
            case 'amazon':
                return this.fetchAmazonProducts();
            default:
                throw new Error(`Unknown platform: ${platform}`);
        }
    }
}



