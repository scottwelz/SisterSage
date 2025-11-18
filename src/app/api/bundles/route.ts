import { NextRequest, NextResponse } from 'next/server';
import { BundleService } from '@/lib/bundle-service';
import type { BundleFormData } from '@/types';

// GET - Fetch all bundles
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const activeOnly = searchParams.get('activeOnly') === 'true';

        const bundles = activeOnly
            ? await BundleService.getActiveBundles()
            : await BundleService.getAllBundles();

        return NextResponse.json({
            success: true,
            bundles,
            count: bundles.length,
        });
    } catch (error) {
        console.error('Error fetching bundles:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch bundles',
            },
            { status: 500 }
        );
    }
}

// POST - Create a new bundle
export async function POST(request: NextRequest) {
    try {
        const body: BundleFormData = await request.json();

        // Validation
        if (!body.bundleProductId || !body.componentProducts || body.componentProducts.length === 0) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'bundleProductId and componentProducts are required',
                },
                { status: 400 }
            );
        }

        const bundleId = await BundleService.createBundle(body);

        return NextResponse.json({
            success: true,
            bundleId,
            message: 'Bundle created successfully',
        });
    } catch (error: any) {
        console.error('Error creating bundle:', error);
        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Failed to create bundle',
            },
            { status: 500 }
        );
    }
}

// PUT - Update a bundle
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, ...bundleData } = body;

        if (!id) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Bundle ID is required',
                },
                { status: 400 }
            );
        }

        await BundleService.updateBundle(id, bundleData);

        return NextResponse.json({
            success: true,
            message: 'Bundle updated successfully',
        });
    } catch (error: any) {
        console.error('Error updating bundle:', error);
        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Failed to update bundle',
            },
            { status: 500 }
        );
    }
}

// DELETE - Delete a bundle
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Bundle ID is required',
                },
                { status: 400 }
            );
        }

        await BundleService.deleteBundle(id);

        return NextResponse.json({
            success: true,
            message: 'Bundle deleted successfully',
        });
    } catch (error: any) {
        console.error('Error deleting bundle:', error);
        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Failed to delete bundle',
            },
            { status: 500 }
        );
    }
}



