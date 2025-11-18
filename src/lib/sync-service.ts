import {
    collection,
    getDocs,
    query,
    where,
    addDoc,
    updateDoc,
    doc,
    serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { ProductService } from './product-service';
import { PlatformFetcher } from './platform-fetcher';
import type {
    Product,
    ProductMapping,
    PlatformProduct,
    Platform,
    SyncLog,
    InventoryDiscrepancy
} from '@/types';

/**
 * Service for synchronizing inventory across platforms
 */
export class SyncService {
    /**
     * Get all product mappings from Firestore
     */
    static async getAllMappings(): Promise<ProductMapping[]> {
        try {
            const mappingsRef = collection(db, 'product_mappings');
            const querySnapshot = await getDocs(mappingsRef);

            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                matchedAt: doc.data().matchedAt?.toDate() || new Date(),
                createdAt: doc.data().createdAt?.toDate(),
                updatedAt: doc.data().updatedAt?.toDate()
            })) as ProductMapping[];
        } catch (error) {
            console.error('Error fetching mappings:', error);
            return [];
        }
    }

    /**
     * Get mapping for a specific local product and platform
     */
    static async getMapping(localProductId: string, platform?: Platform): Promise<ProductMapping | null> {
        try {
            const mappingsRef = collection(db, 'product_mappings');
            const q = query(mappingsRef, where('localProductId', '==', localProductId));
            const querySnapshot = await getDocs(q);

            for (const docSnap of querySnapshot.docs) {
                const mapping = {
                    id: docSnap.id,
                    ...docSnap.data(),
                    matchedAt: docSnap.data().matchedAt?.toDate() || new Date(),
                } as ProductMapping;

                // If platform specified, check if this mapping has that platform
                if (platform) {
                    if (platform === 'shopify' && mapping.shopifyProductId) return mapping;
                    if (platform === 'square' && mapping.squareItemVariationId) return mapping;
                    if (platform === 'amazon' && mapping.amazonAsin) return mapping;
                } else {
                    return mapping;
                }
            }

            return null;
        } catch (error) {
            console.error('Error fetching mapping:', error);
            return null;
        }
    }

    /**
     * Detect inventory discrepancies between local and platform stock
     */
    static async detectDiscrepancies(): Promise<InventoryDiscrepancy[]> {
        const discrepancies: InventoryDiscrepancy[] = [];

        try {
            // Get all local products
            const localProducts = await ProductService.getAllProducts();

            // Get all mappings
            const mappings = await this.getAllMappings();

            // Get platform products
            const platformData = await PlatformFetcher.fetchAllProducts();

            // Create lookup maps
            const productMap = new Map(localProducts.map(p => [p.id, p]));
            const mappingsByProduct = new Map(mappings.map(m => [m.localProductId, m]));

            // Check Shopify discrepancies
            for (const platformProduct of platformData.shopify) {
                const mapping = mappings.find(m =>
                    m.shopifyProductId === platformProduct.id ||
                    m.shopifyVariantId === platformProduct.variantId
                );

                if (mapping) {
                    const localProduct = productMap.get(mapping.localProductId);
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
                    const localProduct = productMap.get(mapping.localProductId);
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
                    const localProduct = productMap.get(mapping.localProductId);
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

            return discrepancies;
        } catch (error) {
            console.error('Error detecting discrepancies:', error);
            return discrepancies;
        }
    }

    /**
     * Sync inventory from platforms to local database
     */
    static async syncFromPlatforms(): Promise<SyncLog[]> {
        const logs: SyncLog[] = [];

        try {
            const platformData = await PlatformFetcher.fetchAllProducts();
            const mappings = await this.getAllMappings();

            // Sync Shopify
            const shopifyLog = await this.syncPlatform('shopify', platformData.shopify, mappings);
            logs.push(shopifyLog);

            // Sync Square
            const squareLog = await this.syncPlatform('square', platformData.square, mappings);
            logs.push(squareLog);

            // Sync Amazon
            const amazonLog = await this.syncPlatform('amazon', platformData.amazon, mappings);
            logs.push(amazonLog);

            // Save logs to Firestore
            for (const log of logs) {
                await this.saveSyncLog(log);
            }

            return logs;
        } catch (error) {
            console.error('Error syncing from platforms:', error);
            return logs;
        }
    }

    /**
     * Sync a specific platform
     */
    private static async syncPlatform(
        platform: Platform,
        platformProducts: PlatformProduct[],
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
                        // Get local product
                        const localProduct = await ProductService.getProduct(mapping.localProductId);

                        if (localProduct) {
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

                                await ProductService.updateStock(localProduct.id, newStock);
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

    /**
     * Push local inventory to platforms
     */
    static async pushToplatforms(productId?: string): Promise<SyncLog[]> {
        const logs: SyncLog[] = [];

        try {
            // Get products to push
            const products = productId
                ? [await ProductService.getProduct(productId)].filter(p => p !== null) as Product[]
                : await ProductService.getAllProducts();

            for (const product of products) {
                // Get mapping
                const mapping = await this.getMapping(product.id);

                if (!mapping) continue;

                // Push to each platform where mapped
                if (mapping.shopifyProductId) {
                    // TODO: Implement Shopify inventory update
                    // await fetch('/api/shopify', { method: 'POST', ... });
                }

                if (mapping.squareItemVariationId) {
                    // TODO: Implement Square inventory update
                    // await fetch('/api/square', { method: 'POST', ... });
                }

                if (mapping.amazonAsin) {
                    // TODO: Implement Amazon inventory update
                    // await fetch('/api/amazon', { method: 'POST', ... });
                }
            }

            return logs;
        } catch (error) {
            console.error('Error pushing to platforms:', error);
            return logs;
        }
    }

    /**
     * Save sync log to Firestore
     */
    private static async saveSyncLog(log: SyncLog): Promise<void> {
        try {
            await addDoc(collection(db, 'sync_logs'), {
                platform: log.platform,
                action: log.action,
                status: log.status,
                itemsProcessed: log.itemsProcessed,
                itemsFailed: log.itemsFailed,
                message: log.message,
                details: log.details,
                createdAt: serverTimestamp()
            });
        } catch (error) {
            console.error('Error saving sync log:', error);
        }
    }

    /**
     * Get recent sync logs
     */
    static async getRecentLogs(limit: number = 20): Promise<SyncLog[]> {
        try {
            const logsRef = collection(db, 'sync_logs');
            const querySnapshot = await getDocs(logsRef);

            const logs = querySnapshot.docs
                .map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate() || new Date()
                })) as SyncLog[];

            // Sort by date (newest first)
            logs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

            return logs.slice(0, limit);
        } catch (error) {
            console.error('Error fetching sync logs:', error);
            return [];
        }
    }
}



