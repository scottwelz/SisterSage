import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

// DELETE - Delete all products (for testing/development only)
export async function DELETE(request: NextRequest) {
    try {
        // Get all products
        const productsSnapshot = await adminDb.collection('products').get();

        // Delete in batches of 500 (Firestore limit)
        const batchSize = 500;
        let batch = adminDb.batch();
        let operationCount = 0;
        let totalDeleted = 0;

        for (const doc of productsSnapshot.docs) {
            batch.delete(doc.ref);
            operationCount++;
            totalDeleted++;

            if (operationCount === batchSize) {
                await batch.commit();
                batch = adminDb.batch();
                operationCount = 0;
            }
        }

        // Commit remaining operations
        if (operationCount > 0) {
            await batch.commit();
        }

        // Also delete all transactions
        const transactionsSnapshot = await adminDb.collection('transactions').get();
        batch = adminDb.batch();
        operationCount = 0;
        let transactionsDeleted = 0;

        for (const doc of transactionsSnapshot.docs) {
            batch.delete(doc.ref);
            operationCount++;
            transactionsDeleted++;

            if (operationCount === batchSize) {
                await batch.commit();
                batch = adminDb.batch();
                operationCount = 0;
            }
        }

        if (operationCount > 0) {
            await batch.commit();
        }

        return NextResponse.json({
            success: true,
            message: `Deleted ${totalDeleted} products and ${transactionsDeleted} transactions`,
            productsDeleted: totalDeleted,
            transactionsDeleted,
        });
    } catch (error: any) {
        console.error('Error deleting products:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to delete products' },
            { status: 500 }
        );
    }
}


