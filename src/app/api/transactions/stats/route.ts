import { NextRequest, NextResponse } from 'next/server';
import { TransactionService } from '@/lib/transaction-service';

// GET - Get transaction statistics
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const productId = searchParams.get('productId') || undefined;

        const stats = await TransactionService.getTransactionStats(productId);

        return NextResponse.json({
            success: true,
            stats,
        });
    } catch (error) {
        console.error('Error fetching transaction stats:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch transaction statistics',
            },
            { status: 500 }
        );
    }
}



