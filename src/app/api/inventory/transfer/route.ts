import { NextRequest, NextResponse } from 'next/server';
import { InventoryService } from '@/lib/inventory-service';

// POST - Transfer inventory between locations
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            productId,
            fromLocationId,
            toLocationId,
            quantity,
            userId,
            notes,
        } = body;

        // Validation
        if (!productId || !fromLocationId || !toLocationId || !quantity) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'productId, fromLocationId, toLocationId, and quantity are required',
                },
                { status: 400 }
            );
        }

        const result = await InventoryService.transferInventory(
            productId,
            fromLocationId,
            toLocationId,
            parseInt(quantity),
            userId,
            notes
        );

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Error transferring inventory:', error);
        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Failed to transfer inventory',
            },
            { status: 500 }
        );
    }
}


