import { NextRequest, NextResponse } from 'next/server';
import { BundleService } from '@/lib/bundle-service';

// POST - Process a bundle sale (deduct component products)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { bundleProductId, quantity, locationId, source, orderId } = body;

        // Validation
        if (!bundleProductId || !quantity || !locationId || !source) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'bundleProductId, quantity, locationId, and source are required',
                },
                { status: 400 }
            );
        }

        const result = await BundleService.processBundleSale(
            bundleProductId,
            parseInt(quantity),
            locationId,
            source,
            orderId
        );

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Error processing bundle sale:', error);
        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Failed to process bundle sale',
            },
            { status: 500 }
        );
    }
}



