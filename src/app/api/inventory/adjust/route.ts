import { NextRequest, NextResponse } from 'next/server';
import { InventoryService } from '@/lib/inventory-service';

// POST - Adjust inventory at a location
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            productId,
            locationId,
            newQuantity,
            userId,
            notes,
        } = body;

        // Validation
        if (!productId || !locationId || newQuantity === undefined || newQuantity === null) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'productId, locationId, and newQuantity are required',
                },
                { status: 400 }
            );
        }

        const result = await InventoryService.adjustInventory(
            productId,
            locationId,
            parseInt(newQuantity),
            userId,
            notes
        );

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Error adjusting inventory:', error);
        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Failed to adjust inventory',
            },
            { status: 500 }
        );
    }
}


