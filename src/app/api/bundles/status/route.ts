import { NextRequest, NextResponse } from 'next/server';
import { BundleService } from '@/lib/bundle-service';

// GET - Get bundle inventory status
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const bundleProductId = searchParams.get('bundleProductId');
        const locationId = searchParams.get('locationId');

        if (!bundleProductId || !locationId) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'bundleProductId and locationId are required',
                },
                { status: 400 }
            );
        }

        const status = await BundleService.getBundleInventoryStatus(
            bundleProductId,
            locationId
        );

        return NextResponse.json({
            success: true,
            status,
        });
    } catch (error: any) {
        console.error('Error getting bundle status:', error);
        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Failed to get bundle status',
            },
            { status: 500 }
        );
    }
}



