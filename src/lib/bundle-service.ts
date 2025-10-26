import { adminDb } from './firebase-admin';
import { InventoryService } from './inventory-service';
import type { ProductBundle, BundleFormData } from '@/types';

const BUNDLES_COLLECTION = 'product_bundles';
const PRODUCTS_COLLECTION = 'products';

export class BundleService {
    // Get all bundles
    static async getAllBundles(): Promise<ProductBundle[]> {
        try {
            const snapshot = await adminDb
                .collection(BUNDLES_COLLECTION)
                .orderBy('bundleProductName')
                .get();

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate(),
                updatedAt: doc.data().updatedAt?.toDate(),
            })) as ProductBundle[];
        } catch (error) {
            console.error('Error fetching bundles:', error);
            throw new Error('Failed to fetch bundles');
        }
    }

    // Get active bundles only
    static async getActiveBundles(): Promise<ProductBundle[]> {
        try {
            const snapshot = await adminDb
                .collection(BUNDLES_COLLECTION)
                .where('isActive', '==', true)
                .orderBy('bundleProductName')
                .get();

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate(),
                updatedAt: doc.data().updatedAt?.toDate(),
            })) as ProductBundle[];
        } catch (error) {
            console.error('Error fetching active bundles:', error);
            throw new Error('Failed to fetch active bundles');
        }
    }

    // Get bundle by bundle product ID
    static async getBundleByProductId(bundleProductId: string): Promise<ProductBundle | null> {
        try {
            const snapshot = await adminDb
                .collection(BUNDLES_COLLECTION)
                .where('bundleProductId', '==', bundleProductId)
                .where('isActive', '==', true)
                .limit(1)
                .get();

            if (snapshot.empty) {
                return null;
            }

            const doc = snapshot.docs[0];
            return {
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate(),
                updatedAt: doc.data().updatedAt?.toDate(),
            } as ProductBundle;
        } catch (error) {
            console.error('Error fetching bundle by product ID:', error);
            throw new Error('Failed to fetch bundle');
        }
    }

    // Get bundle by SKU
    static async getBundleBySku(sku: string): Promise<ProductBundle | null> {
        try {
            const snapshot = await adminDb
                .collection(BUNDLES_COLLECTION)
                .where('bundleSku', '==', sku)
                .where('isActive', '==', true)
                .limit(1)
                .get();

            if (snapshot.empty) {
                return null;
            }

            const doc = snapshot.docs[0];
            return {
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate(),
                updatedAt: doc.data().updatedAt?.toDate(),
            } as ProductBundle;
        } catch (error) {
            console.error('Error fetching bundle by SKU:', error);
            throw new Error('Failed to fetch bundle');
        }
    }

    // Create a new bundle
    static async createBundle(data: {
        bundleProductId: string;
        componentProducts: Array<{ productId: string; quantity: number }>;
        isActive: boolean;
    }): Promise<string> {
        try {
            // Get bundle product details
            const bundleProductDoc = await adminDb
                .collection(PRODUCTS_COLLECTION)
                .doc(data.bundleProductId)
                .get();

            if (!bundleProductDoc.exists) {
                throw new Error('Bundle product not found');
            }

            const bundleProduct = bundleProductDoc.data();

            // Get component product details
            const componentProducts = await Promise.all(
                data.componentProducts.map(async (component) => {
                    const productDoc = await adminDb
                        .collection(PRODUCTS_COLLECTION)
                        .doc(component.productId)
                        .get();

                    if (!productDoc.exists) {
                        throw new Error(`Component product ${component.productId} not found`);
                    }

                    const product = productDoc.data();
                    return {
                        productId: component.productId,
                        productName: product?.name || '',
                        productSku: product?.sku || '',
                        quantity: component.quantity,
                    };
                })
            );

            // Mark the bundle product as a bundle
            await bundleProductDoc.ref.update({
                isBundle: true,
                bundleComponents: data.componentProducts,
                updatedAt: new Date(),
            });

            // Create bundle record
            const docRef = await adminDb.collection(BUNDLES_COLLECTION).add({
                bundleProductId: data.bundleProductId,
                bundleProductName: bundleProduct?.name || '',
                bundleSku: bundleProduct?.sku || '',
                componentProducts,
                isActive: data.isActive,
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            return docRef.id;
        } catch (error) {
            console.error('Error creating bundle:', error);
            throw error;
        }
    }

    // Update a bundle
    static async updateBundle(
        bundleId: string,
        data: Partial<BundleFormData>
    ): Promise<void> {
        try {
            const updateData: any = {
                ...data,
                updatedAt: new Date(),
            };

            // If component products are updated, fetch their details
            if (data.componentProducts) {
                updateData.componentProducts = await Promise.all(
                    data.componentProducts.map(async (component) => {
                        const productDoc = await adminDb
                            .collection(PRODUCTS_COLLECTION)
                            .doc(component.productId)
                            .get();

                        const product = productDoc.data();
                        return {
                            productId: component.productId,
                            productName: product?.name || '',
                            productSku: product?.sku || '',
                            quantity: component.quantity,
                        };
                    })
                );
            }

            await adminDb.collection(BUNDLES_COLLECTION).doc(bundleId).update(updateData);
        } catch (error) {
            console.error('Error updating bundle:', error);
            throw new Error('Failed to update bundle');
        }
    }

    // Delete a bundle
    static async deleteBundle(bundleId: string): Promise<void> {
        try {
            const bundleDoc = await adminDb.collection(BUNDLES_COLLECTION).doc(bundleId).get();

            if (!bundleDoc.exists) {
                throw new Error('Bundle not found');
            }

            const bundle = bundleDoc.data();

            // Remove bundle flag from product
            if (bundle?.bundleProductId) {
                await adminDb.collection(PRODUCTS_COLLECTION).doc(bundle.bundleProductId).update({
                    isBundle: false,
                    bundleComponents: null,
                    updatedAt: new Date(),
                });
            }

            // Delete bundle
            await bundleDoc.ref.delete();
        } catch (error) {
            console.error('Error deleting bundle:', error);
            throw error;
        }
    }

    // Process a bundle sale (deduct component products from inventory)
    static async processBundleSale(
        bundleProductId: string,
        quantity: number,
        locationId: string,
        source: 'square' | 'shopify' | 'amazon' | 'manual',
        orderId?: string
    ): Promise<{ success: boolean; message: string }> {
        try {
            // Get bundle definition
            const bundle = await this.getBundleByProductId(bundleProductId);

            if (!bundle) {
                throw new Error('Bundle not found or inactive');
            }

            // Deduct each component product
            for (const component of bundle.componentProducts) {
                const componentQuantity = component.quantity * quantity;

                await InventoryService.recordSale(
                    component.productId,
                    componentQuantity,
                    locationId,
                    source,
                    orderId
                );
            }

            return {
                success: true,
                message: `Successfully processed bundle sale of ${quantity} units`,
            };
        } catch (error: any) {
            console.error('Error processing bundle sale:', error);
            throw error;
        }
    }

    // Check if product is a bundle
    static async isBundle(productId: string): Promise<boolean> {
        try {
            const bundle = await this.getBundleByProductId(productId);
            return bundle !== null;
        } catch (error) {
            return false;
        }
    }

    // Get bundle inventory status (checks if all components are available)
    static async getBundleInventoryStatus(bundleProductId: string, locationId: string): Promise<{
        canFulfill: boolean;
        maxBundles: number;
        componentStatus: Array<{
            productId: string;
            productName: string;
            required: number;
            available: number;
            canFulfill: boolean;
        }>;
    }> {
        try {
            const bundle = await this.getBundleByProductId(bundleProductId);

            if (!bundle) {
                throw new Error('Bundle not found');
            }

            // Check each component
            const componentStatus = await Promise.all(
                bundle.componentProducts.map(async (component) => {
                    const productDoc = await adminDb
                        .collection(PRODUCTS_COLLECTION)
                        .doc(component.productId)
                        .get();

                    const product = productDoc.data();
                    const available = product?.locations?.[locationId]?.quantity || 0;
                    const maxFromThis = Math.floor(available / component.quantity);

                    return {
                        productId: component.productId,
                        productName: component.productName,
                        required: component.quantity,
                        available,
                        canFulfill: available >= component.quantity,
                        maxBundles: maxFromThis,
                    };
                })
            );

            // Calculate maximum bundles that can be made
            const maxBundles = Math.min(...componentStatus.map(c => c.maxBundles));
            const canFulfill = componentStatus.every(c => c.canFulfill);

            return {
                canFulfill,
                maxBundles,
                componentStatus: componentStatus.map(({ maxBundles, ...rest }) => rest),
            };
        } catch (error) {
            console.error('Error getting bundle inventory status:', error);
            throw new Error('Failed to get bundle inventory status');
        }
    }
}


