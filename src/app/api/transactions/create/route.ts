import { NextRequest, NextResponse } from 'next/server';
import { TransactionService } from '@/lib/transaction-service';
import type { TransactionType, TransactionSource } from '@/types';

// POST - Create a manual transaction
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            type,
            productId,
            quantity,
            fromLocationId,
            toLocationId,
            batchNumber,
            productionDate,
            expirationDate,
            notes,
            userId,
        } = body;

        // Validation
        if (!type || !productId || !quantity) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Type, productId, and quantity are required',
                },
                { status: 400 }
            );
        }

        let transactionId: string;

        // Create transaction based on type
        switch (type as TransactionType) {
            case 'transfer':
                if (!fromLocationId || !toLocationId) {
                    return NextResponse.json(
                        {
                            success: false,
                            error: 'Both fromLocationId and toLocationId are required for transfers',
                        },
                        { status: 400 }
                    );
                }
                transactionId = await TransactionService.createTransferTransaction(
                    productId,
                    quantity,
                    fromLocationId,
                    toLocationId,
                    userId,
                    notes
                );
                break;

            case 'production':
                if (!toLocationId) {
                    return NextResponse.json(
                        {
                            success: false,
                            error: 'toLocationId is required for production',
                        },
                        { status: 400 }
                    );
                }
                transactionId = await TransactionService.createProductionTransaction(
                    productId,
                    quantity,
                    toLocationId,
                    batchNumber,
                    productionDate ? new Date(productionDate) : undefined,
                    expirationDate ? new Date(expirationDate) : undefined,
                    userId,
                    notes
                );
                break;

            case 'adjustment':
                const locationId = fromLocationId || toLocationId;
                if (!locationId) {
                    return NextResponse.json(
                        {
                            success: false,
                            error: 'Location is required for adjustments',
                        },
                        { status: 400 }
                    );
                }
                transactionId = await TransactionService.createAdjustmentTransaction(
                    productId,
                    quantity,
                    locationId,
                    userId,
                    notes
                );
                break;

            case 'sale':
                if (!fromLocationId) {
                    return NextResponse.json(
                        {
                            success: false,
                            error: 'fromLocationId is required for sales',
                        },
                        { status: 400 }
                    );
                }
                transactionId = await TransactionService.createSaleTransaction(
                    productId,
                    quantity,
                    fromLocationId,
                    'manual'
                );
                break;

            default:
                return NextResponse.json(
                    {
                        success: false,
                        error: 'Invalid transaction type',
                    },
                    { status: 400 }
                );
        }

        return NextResponse.json({
            success: true,
            transactionId,
            message: 'Transaction created successfully',
        });
    } catch (error: any) {
        console.error('Error creating transaction:', error);
        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Failed to create transaction',
            },
            { status: 500 }
        );
    }
}


