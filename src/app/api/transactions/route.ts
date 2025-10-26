import { NextRequest, NextResponse } from 'next/server';
import { TransactionService } from '@/lib/transaction-service';
import type { TransactionType } from '@/types';

// GET - Fetch transactions with optional filters
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);

        const filters: any = {};

        const productId = searchParams.get('productId');
        if (productId) filters.productId = productId;

        const type = searchParams.get('type');
        if (type) filters.type = type as TransactionType;

        const locationId = searchParams.get('locationId');
        if (locationId) filters.locationId = locationId;

        const startDate = searchParams.get('startDate');
        if (startDate) filters.startDate = new Date(startDate);

        const endDate = searchParams.get('endDate');
        if (endDate) filters.endDate = new Date(endDate);

        const limit = searchParams.get('limit');
        if (limit) filters.limit = parseInt(limit);

        const transactions = await TransactionService.getTransactions(filters);

        return NextResponse.json({
            success: true,
            transactions,
            count: transactions.length,
        });
    } catch (error) {
        console.error('Error fetching transactions:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch transactions',
            },
            { status: 500 }
        );
    }
}


