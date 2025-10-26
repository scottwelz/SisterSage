import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { PlatformFetcher } from '@/lib/platform-fetcher';
import { FieldValue } from 'firebase-admin/firestore';
import type { SyncLog, Platform, ProductMapping } from '@/types';

/**
 * API route to run inventory sync from platforms
 * POST /api/sync/run
 */
export async function POST() {
    try {
        const logs: SyncLog[] = [];
        const platformData = await PlatformFetcher.fetchAllProducts();

        // Get all mappings using Admin SDK
        const mappingsSnapshot = await adminDb.collection('product_mappings').get();
        const mappings = mappingsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as ProductMapping[];

        // Sync each platform
        for (const platform of ['shopify', 'square', 'amazon'] as Platform[]) {
            const log = await syncPlatform(platform, platformData[platform], mappings);
            logs.push(log);

            // Save log to Firestore
            await adminDb.collection('sync_logs').add({
                platform: log.platform,
                action: log.action,
                status: log.status,
                itemsProcessed: log.itemsProcessed,
                itemsFailed: log.itemsFailed,
                message: log.message,
                details: log.details,
                createdAt: FieldValue.serverTimestamp()
            });
        }

        const hasErrors = logs.some(log => log.status === 'failed');

        return NextResponse.json({
            success: !hasErrors,
            logs,
            message: hasErrors
                ? 'Some platforms failed to sync. Check logs for details.'
                : 'Sync completed successfully'
        });
    } catch (error) {
        console.error('Error syncing:', error);
        return NextResponse.json(
            { error: 'Failed to sync inventory', details: (error as Error).message },
            { status: 500 }
        );
    }
}

async function syncPlatform(
    platform: Platform,
    platformProducts: any[],
    mappings: ProductMapping[]
): Promise<SyncLog> {
    const log: SyncLog = {
        id: '',
        platform,
        action: 'sync',
        status: 'success',
        itemsProcessed: 0,
        itemsFailed: 0,
        createdAt: new Date()
    };

    try {
        for (const platformProduct of platformProducts) {
            try {
                // Find mapping for this platform product
                const mapping = mappings.find(m => {
                    if (platform === 'shopify') {
                        return m.shopifyProductId === platformProduct.id ||
                            m.shopifyVariantId === platformProduct.variantId;
                    } else if (platform === 'square') {
                        return m.squareCatalogObjectId === platformProduct.id ||
                            m.squareItemVariationId === platformProduct.variantId;
                    } else if (platform === 'amazon') {
                        return m.amazonAsin === platformProduct.id ||
                            m.amazonSku === platformProduct.sku;
                    }
                    return false;
                });

                if (mapping) {
                    // Get local product using Admin SDK
                    const productDoc = await adminDb
                        .collection('products')
                        .doc(mapping.localProductId)
                        .get();

                    if (productDoc.exists) {
                        const localProduct: any = { id: productDoc.id, ...productDoc.data() };

                        // Update local inventory if different
                        const platformStock = platformProduct.inventory || 0;
                        let currentStock = 0;

                        if (platform === 'shopify') {
                            currentStock = localProduct.stock.shopify;
                        } else if (platform === 'square') {
                            currentStock = localProduct.stock.square;
                        } else if (platform === 'amazon') {
                            currentStock = localProduct.stock.amazon || 0;
                        }

                        if (currentStock !== platformStock) {
                            const newStock = { ...localProduct.stock };
                            if (platform === 'shopify') newStock.shopify = platformStock;
                            else if (platform === 'square') newStock.square = platformStock;
                            else if (platform === 'amazon') newStock.amazon = platformStock;

                            await adminDb
                                .collection('products')
                                .doc(localProduct.id)
                                .update({
                                    stock: newStock,
                                    updatedAt: FieldValue.serverTimestamp()
                                });
                        }

                        log.itemsProcessed++;
                    }
                }
            } catch (error) {
                console.error(`Error syncing product ${platformProduct.id}:`, error);
                log.itemsFailed++;
            }
        }

        if (log.itemsFailed > 0) {
            log.status = 'partial';
        }
    } catch (error) {
        console.error(`Error syncing ${platform}:`, error);
        log.status = 'failed';
        log.message = (error as Error).message;
    }

    return log;
}

