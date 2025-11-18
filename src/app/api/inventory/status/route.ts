import { NextRequest, NextResponse } from 'next/server';
import { InventoryService } from '@/lib/inventory-service';

// GET - Get product inventory status across all locations
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const productId = searchParams.get('productId');

        if (!productId) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'productId is required',
                },
                { status: 400 }
            );
        }

        const status = await InventoryService.getProductInventoryStatus(productId);

        return NextResponse.json({
            success: true,
            status,
        });
    } catch (error: any) {
        console.error('Error getting inventory status:', error);
        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Failed to get inventory status',
            },
            { status: 500 }
        );
    }
}



