import { adminDb } from './firebase-admin';
import type { InventoryTransaction, TransactionFormData, TransactionType, TransactionSource } from '@/types';

const TRANSACTIONS_COLLECTION = 'inventory_transactions';
const PRODUCTS_COLLECTION = 'products';

export class TransactionService {
    // Get all transactions with optional filters
    static async getTransactions(filters?: {
        productId?: string;
        type?: TransactionType;
        locationId?: string;
        startDate?: Date;
        endDate?: Date;
        limit?: number;
    }): Promise<InventoryTransaction[]> {
        try {
            let query = adminDb.collection(TRANSACTIONS_COLLECTION).orderBy('createdAt', 'desc');

            if (filters?.productId) {
                query = query.where('productId', '==', filters.productId) as any;
            }

            if (filters?.type) {
                query = query.where('type', '==', filters.type) as any;
            }

            if (filters?.startDate) {
                query = query.where('createdAt', '>=', filters.startDate) as any;
            }

            if (filters?.endDate) {
                query = query.where('createdAt', '<=', filters.endDate) as any;
            }

            if (filters?.limit) {
                query = query.limit(filters.limit) as any;
            }

            const snapshot = await query.get();

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate(),
                productionDate: doc.data().productionDate?.toDate(),
                expirationDate: doc.data().expirationDate?.toDate(),
            })) as InventoryTransaction[];
        } catch (error) {
            console.error('Error fetching transactions:', error);
            throw new Error('Failed to fetch transactions');
        }
    }

    // Get transactions for a specific product
    static async getProductTransactions(productId: string, limit = 50): Promise<InventoryTransaction[]> {
        return this.getTransactions({ productId, limit });
    }

    // Get recent transactions
    static async getRecentTransactions(limit = 100): Promise<InventoryTransaction[]> {
        return this.getTransactions({ limit });
    }

    // Create a new transaction
    static async createTransaction(data: {
        type: TransactionType;
        productId: string;
        quantity: number;
        fromLocationId?: string;
        toLocationId?: string;
        batchNumber?: string;
        productionDate?: Date;
        expirationDate?: Date;
        source: TransactionSource;
        userId?: string;
        notes?: string;
        orderId?: string;
    }): Promise<string> {
        try {
            // Get product details
            const productDoc = await adminDb.collection(PRODUCTS_COLLECTION).doc(data.productId).get();

            if (!productDoc.exists) {
                throw new Error('Product not found');
            }

            const product = productDoc.data();

            // Get location names if provided
            let fromLocationName: string | undefined;
            let toLocationName: string | undefined;

            if (data.fromLocationId) {
                const fromLoc = await adminDb.collection('locations').doc(data.fromLocationId).get();
                fromLocationName = fromLoc.data()?.name;
            }

            if (data.toLocationId) {
                const toLoc = await adminDb.collection('locations').doc(data.toLocationId).get();
                toLocationName = toLoc.data()?.name;
            }

            // Create transaction record (filter out undefined values for Firestore)
            const transactionData: any = {
                type: data.type,
                productId: data.productId,
                productName: product?.name || '',
                productSku: product?.sku || '',
                quantity: data.quantity,
                source: data.source,
                createdAt: new Date(),
            };

            // Only add defined fields
            if (data.fromLocationId) transactionData.fromLocationId = data.fromLocationId;
            if (fromLocationName) transactionData.fromLocationName = fromLocationName;
            if (data.toLocationId) transactionData.toLocationId = data.toLocationId;
            if (toLocationName) transactionData.toLocationName = toLocationName;
            if (data.batchNumber) transactionData.batchNumber = data.batchNumber;
            if (data.productionDate) transactionData.productionDate = data.productionDate;
            if (data.expirationDate) transactionData.expirationDate = data.expirationDate;
            if (data.userId) transactionData.userId = data.userId;
            if (data.notes) transactionData.notes = data.notes;
            if (data.orderId) transactionData.orderId = data.orderId;

            const docRef = await adminDb.collection(TRANSACTIONS_COLLECTION).add(transactionData);

            return docRef.id;
        } catch (error) {
            console.error('Error creating transaction:', error);
            throw error;
        }
    }

    // Create a sale transaction
    static async createSaleTransaction(
        productId: string,
        quantity: number,
        locationId: string,
        source: TransactionSource,
        orderId?: string
    ): Promise<string> {
        return this.createTransaction({
            type: 'sale',
            productId,
            quantity: -Math.abs(quantity), // Always negative for sales
            fromLocationId: locationId,
            source,
            orderId,
        });
    }

    // Create a transfer transaction
    static async createTransferTransaction(
        productId: string,
        quantity: number,
        fromLocationId: string,
        toLocationId: string,
        userId?: string,
        notes?: string
    ): Promise<string> {
        if (!fromLocationId || !toLocationId) {
            throw new Error('Both from and to locations are required for transfers');
        }

        if (fromLocationId === toLocationId) {
            throw new Error('Cannot transfer to the same location');
        }

        return this.createTransaction({
            type: 'transfer',
            productId,
            quantity,
            fromLocationId,
            toLocationId,
            source: 'manual',
            userId,
            notes,
        });
    }

    // Create a production transaction
    static async createProductionTransaction(
        productId: string,
        quantity: number,
        toLocationId: string,
        batchNumber?: string,
        productionDate?: Date,
        expirationDate?: Date,
        userId?: string,
        notes?: string
    ): Promise<string> {
        if (!toLocationId) {
            throw new Error('Destination location is required for production');
        }

        return this.createTransaction({
            type: 'production',
            productId,
            quantity: Math.abs(quantity), // Always positive for production
            toLocationId,
            batchNumber,
            productionDate,
            expirationDate,
            source: 'manual',
            userId,
            notes,
        });
    }

    // Create an adjustment transaction
    static async createAdjustmentTransaction(
        productId: string,
        quantity: number,
        locationId: string,
        userId?: string,
        notes?: string
    ): Promise<string> {
        if (!locationId) {
            throw new Error('Location is required for adjustments');
        }

        return this.createTransaction({
            type: 'adjustment',
            productId,
            quantity,
            toLocationId: quantity > 0 ? locationId : undefined,
            fromLocationId: quantity < 0 ? locationId : undefined,
            source: 'manual',
            userId,
            notes,
        });
    }

    // Get transaction statistics
    static async getTransactionStats(productId?: string): Promise<{
        totalSales: number;
        totalProduction: number;
        totalTransfers: number;
        totalAdjustments: number;
    }> {
        try {
            let query = adminDb.collection(TRANSACTIONS_COLLECTION);

            if (productId) {
                query = query.where('productId', '==', productId) as any;
            }

            const snapshot = await query.get();

            const stats = {
                totalSales: 0,
                totalProduction: 0,
                totalTransfers: 0,
                totalAdjustments: 0,
            };

            snapshot.docs.forEach(doc => {
                const data = doc.data();
                switch (data.type) {
                    case 'sale':
                        stats.totalSales += Math.abs(data.quantity);
                        break;
                    case 'production':
                        stats.totalProduction += Math.abs(data.quantity);
                        break;
                    case 'transfer':
                        stats.totalTransfers += Math.abs(data.quantity);
                        break;
                    case 'adjustment':
                        stats.totalAdjustments += Math.abs(data.quantity);
                        break;
                }
            });

            return stats;
        } catch (error) {
            console.error('Error getting transaction stats:', error);
            throw new Error('Failed to get transaction statistics');
        }
    }
}

