import { adminDb } from './firebase-admin';
import { TransactionService } from './transaction-service';
import { LocationService } from './location-service';

const PRODUCTS_COLLECTION = 'products';

export class InventoryService {
    // Transfer inventory between locations
    static async transferInventory(
        productId: string,
        fromLocationId: string,
        toLocationId: string,
        quantity: number,
        userId?: string,
        notes?: string
    ): Promise<{ success: boolean; message: string }> {
        try {
            // Validation
            if (quantity <= 0) {
                throw new Error('Quantity must be positive');
            }

            if (fromLocationId === toLocationId) {
                throw new Error('Cannot transfer to the same location');
            }

            // Get product
            const productDoc = await adminDb.collection(PRODUCTS_COLLECTION).doc(productId).get();

            if (!productDoc.exists) {
                throw new Error('Product not found');
            }

            const product = productDoc.data();
            const locations = product?.locations || {};

            // Check if source location has enough inventory
            const fromLocation = locations[fromLocationId] || { quantity: 0 };
            if (fromLocation.quantity < quantity) {
                throw new Error(`Insufficient inventory at source location. Available: ${fromLocation.quantity}`);
            }

            // Perform the transfer
            const updatedLocations = { ...locations };

            // Deduct from source
            updatedLocations[fromLocationId] = {
                ...fromLocation,
                quantity: fromLocation.quantity - quantity,
            };

            // Add to destination
            const toLocation = updatedLocations[toLocationId] || { quantity: 0 };
            updatedLocations[toLocationId] = {
                ...toLocation,
                quantity: toLocation.quantity + quantity,
            };

            // Calculate new total (should remain the same)
            const totalQuantity = Object.values(updatedLocations).reduce(
                (sum: number, loc: any) => sum + (loc.quantity || 0),
                0
            );

            // Update product
            await productDoc.ref.update({
                locations: updatedLocations,
                totalQuantity,
                updatedAt: new Date(),
            });

            // Create transaction record
            await TransactionService.createTransferTransaction(
                productId,
                quantity,
                fromLocationId,
                toLocationId,
                userId,
                notes
            );

            return {
                success: true,
                message: `Successfully transferred ${quantity} units`,
            };
        } catch (error: any) {
            console.error('Error transferring inventory:', error);
            throw error;
        }
    }

    // Add production to inventory
    static async addProduction(
        productId: string,
        quantity: number,
        toLocationId: string,
        batchNumber?: string,
        productionDate?: Date,
        expirationDate?: Date,
        userId?: string,
        notes?: string
    ): Promise<{ success: boolean; message: string }> {
        try {
            // Validation
            if (quantity <= 0) {
                throw new Error('Quantity must be positive');
            }

            // Get product
            const productDoc = await adminDb.collection(PRODUCTS_COLLECTION).doc(productId).get();

            if (!productDoc.exists) {
                throw new Error('Product not found');
            }

            const product = productDoc.data();
            const locations = product?.locations || {};

            // Add to destination location
            const toLocation = locations[toLocationId] || { quantity: 0, minStockLevel: 0 };
            const updatedLocations = {
                ...locations,
                [toLocationId]: {
                    ...toLocation,
                    quantity: toLocation.quantity + quantity,
                },
            };

            // Calculate new total
            const totalQuantity = Object.values(updatedLocations).reduce(
                (sum: number, loc: any) => sum + (loc.quantity || 0),
                0
            );

            // Update product
            await productDoc.ref.update({
                locations: updatedLocations,
                totalQuantity,
                updatedAt: new Date(),
            });

            // Create transaction record
            await TransactionService.createProductionTransaction(
                productId,
                quantity,
                toLocationId,
                batchNumber,
                productionDate,
                expirationDate,
                userId,
                notes
            );

            return {
                success: true,
                message: `Successfully added ${quantity} units to inventory`,
            };
        } catch (error: any) {
            console.error('Error adding production:', error);
            throw error;
        }
    }

    // Adjust inventory at a location
    static async adjustInventory(
        productId: string,
        locationId: string,
        newQuantity: number,
        userId?: string,
        notes?: string
    ): Promise<{ success: boolean; message: string }> {
        try {
            // Validation
            if (newQuantity < 0) {
                throw new Error('Quantity cannot be negative');
            }

            // Get product
            const productDoc = await adminDb.collection(PRODUCTS_COLLECTION).doc(productId).get();

            if (!productDoc.exists) {
                throw new Error('Product not found');
            }

            const product = productDoc.data();
            const locations = product?.locations || {};
            const currentLocation = locations[locationId] || { quantity: 0 };
            const difference = newQuantity - currentLocation.quantity;

            // Update location
            const updatedLocations = {
                ...locations,
                [locationId]: {
                    ...currentLocation,
                    quantity: newQuantity,
                },
            };

            // Calculate new total
            const totalQuantity = Object.values(updatedLocations).reduce(
                (sum: number, loc: any) => sum + (loc.quantity || 0),
                0
            );

            // Update product
            await productDoc.ref.update({
                locations: updatedLocations,
                totalQuantity,
                updatedAt: new Date(),
            });

            // Create transaction record
            if (difference !== 0) {
                await TransactionService.createAdjustmentTransaction(
                    productId,
                    difference,
                    locationId,
                    userId,
                    notes || `Adjusted from ${currentLocation.quantity} to ${newQuantity}`
                );
            }

            return {
                success: true,
                message: `Successfully adjusted inventory to ${newQuantity} units`,
            };
        } catch (error: any) {
            console.error('Error adjusting inventory:', error);
            throw error;
        }
    }

    // Record a sale (deducts from location)
    static async recordSale(
        productId: string,
        quantity: number,
        locationId: string,
        source: 'square' | 'shopify' | 'amazon' | 'manual',
        orderId?: string
    ): Promise<{ success: boolean; message: string }> {
        try {
            // Validation
            if (quantity <= 0) {
                throw new Error('Quantity must be positive');
            }

            // Get product
            const productDoc = await adminDb.collection(PRODUCTS_COLLECTION).doc(productId).get();

            if (!productDoc.exists) {
                throw new Error('Product not found');
            }

            const product = productDoc.data();
            const locations = product?.locations || {};

            // Check if location has enough inventory
            const location = locations[locationId] || { quantity: 0 };
            if (location.quantity < quantity) {
                throw new Error(`Insufficient inventory. Available: ${location.quantity}, Requested: ${quantity}`);
            }

            // Deduct from location
            const updatedLocations = {
                ...locations,
                [locationId]: {
                    ...location,
                    quantity: location.quantity - quantity,
                },
            };

            // Calculate new total
            const totalQuantity = Object.values(updatedLocations).reduce(
                (sum: number, loc: any) => sum + (loc.quantity || 0),
                0
            );

            // Update product
            await productDoc.ref.update({
                locations: updatedLocations,
                totalQuantity,
                updatedAt: new Date(),
            });

            // Create transaction record
            await TransactionService.createSaleTransaction(
                productId,
                quantity,
                locationId,
                source === 'manual' ? 'manual' : 'webhook',
                orderId
            );

            return {
                success: true,
                message: `Successfully recorded sale of ${quantity} units`,
            };
        } catch (error: any) {
            console.error('Error recording sale:', error);
            throw error;
        }
    }

    // Get product inventory status across all locations
    static async getProductInventoryStatus(productId: string): Promise<{
        productId: string;
        productName: string;
        totalQuantity: number;
        locations: Array<{
            locationId: string;
            locationName: string;
            quantity: number;
            minStockLevel?: number;
            isLowStock: boolean;
        }>;
    }> {
        try {
            const productDoc = await adminDb.collection(PRODUCTS_COLLECTION).doc(productId).get();

            if (!productDoc.exists) {
                throw new Error('Product not found');
            }

            const product = productDoc.data();
            const locations = product?.locations || {};

            // Get location details
            const locationDetails = await Promise.all(
                Object.entries(locations).map(async ([locationId, data]: [string, any]) => {
                    const locationDoc = await adminDb.collection('locations').doc(locationId).get();
                    const locationName = locationDoc.data()?.name || locationId;

                    return {
                        locationId,
                        locationName,
                        quantity: data.quantity || 0,
                        minStockLevel: data.minStockLevel,
                        isLowStock: data.minStockLevel ? data.quantity <= data.minStockLevel : false,
                    };
                })
            );

            const totalQuantity = locationDetails.reduce((sum, loc) => sum + loc.quantity, 0);

            return {
                productId,
                productName: product?.name || '',
                totalQuantity,
                locations: locationDetails,
            };
        } catch (error) {
            console.error('Error getting inventory status:', error);
            throw new Error('Failed to get inventory status');
        }
    }
}


