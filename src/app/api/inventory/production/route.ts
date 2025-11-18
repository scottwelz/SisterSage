import { NextRequest, NextResponse } from 'next/server';
import { InventoryService } from '@/lib/inventory-service';

// POST - Add production to inventory
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            productId,
            quantity,
            toLocationId,
            batchNumber,
            productionDate,
            expirationDate,
            userId,
            notes,
        } = body;

        // Validation
        if (!productId || !quantity || !toLocationId) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'productId, quantity, and toLocationId are required',
                },
                { status: 400 }
            );
        }

        const result = await InventoryService.addProduction(
            productId,
            parseInt(quantity),
            toLocationId,
            batchNumber,
            productionDate ? new Date(productionDate) : undefined,
            expirationDate ? new Date(expirationDate) : undefined,
            userId,
            notes
        );

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Error adding production:', error);
        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Failed to add production',
            },
            { status: 500 }
        );
    }
}



