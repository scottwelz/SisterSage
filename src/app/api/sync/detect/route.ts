import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { PlatformFetcher } from '@/lib/platform-fetcher';
import type { InventoryDiscrepancy, ProductMapping } from '@/types';

/**
 * API route to detect inventory discrepancies
 * GET /api/sync/detect
 */
export async function GET() {
    try {
        const discrepancies: InventoryDiscrepancy[] = [];

        // Get all local products using Admin SDK
        const productsSnapshot = await adminDb.collection('products').get();
        const localProducts = productsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Get all mappings
        const mappingsSnapshot = await adminDb.collection('product_mappings').get();
        const mappings = mappingsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as ProductMapping[];

        // Get platform products
        const platformData = await PlatformFetcher.fetchAllProducts();

        // Create lookup maps
        const productMap = new Map(localProducts.map((p: any) => [p.id, p]));

        // Check Shopify discrepancies
        for (const platformProduct of platformData.shopify) {
            const mapping = mappings.find(m =>
                m.shopifyProductId === platformProduct.id ||
                m.shopifyVariantId === platformProduct.variantId
            );

            if (mapping) {
                const localProduct: any = productMap.get(mapping.localProductId);
                if (localProduct) {
                    const localStock = localProduct.stock.shopify;
                    const platformStock = platformProduct.inventory || 0;

                    if (localStock !== platformStock) {
                        discrepancies.push({
                            id: `${mapping.localProductId}-shopify`,
                            productId: localProduct.id,
                            sku: localProduct.sku,
                            productName: localProduct.name,
                            platform: 'shopify',
                            localStock,
                            platformStock,
                            difference: localStock - platformStock,
                            detectedAt: new Date(),
                            resolved: false
                        });
                    }
                }
            }
        }

        // Check Square discrepancies
        for (const platformProduct of platformData.square) {
            const mapping = mappings.find(m =>
                m.squareCatalogObjectId === platformProduct.id ||
                m.squareItemVariationId === platformProduct.variantId
            );

            if (mapping) {
                const localProduct: any = productMap.get(mapping.localProductId);
                if (localProduct) {
                    const localStock = localProduct.stock.square;
                    const platformStock = platformProduct.inventory || 0;

                    if (localStock !== platformStock) {
                        discrepancies.push({
                            id: `${mapping.localProductId}-square`,
                            productId: localProduct.id,
                            sku: localProduct.sku,
                            productName: localProduct.name,
                            platform: 'square',
                            localStock,
                            platformStock,
                            difference: localStock - platformStock,
                            detectedAt: new Date(),
                            resolved: false
                        });
                    }
                }
            }
        }

        // Check Amazon discrepancies
        for (const platformProduct of platformData.amazon) {
            const mapping = mappings.find(m =>
                m.amazonAsin === platformProduct.id ||
                m.amazonSku === platformProduct.sku
            );

            if (mapping) {
                const localProduct: any = productMap.get(mapping.localProductId);
                if (localProduct && localProduct.stock.amazon !== undefined) {
                    const localStock = localProduct.stock.amazon;
                    const platformStock = platformProduct.inventory || 0;

                    if (localStock !== platformStock) {
                        discrepancies.push({
                            id: `${mapping.localProductId}-amazon`,
                            productId: localProduct.id,
                            sku: localProduct.sku,
                            productName: localProduct.name,
                            platform: 'amazon',
                            localStock,
                            platformStock,
                            difference: localStock - platformStock,
                            detectedAt: new Date(),
                            resolved: false
                        });
                    }
                }
            }
        }

        return NextResponse.json({
            success: true,
            discrepancies,
            count: discrepancies.length
        });
    } catch (error) {
        console.error('Error detecting discrepancies:', error);
        return NextResponse.json(
            { error: 'Failed to detect discrepancies', details: (error as Error).message },
            { status: 500 }
        );
    }
}

