import { NextRequest, NextResponse } from 'next/server';
import { LocationService } from '@/lib/location-service';
import type { LocationFormData } from '@/types';

// GET - Fetch all locations or active locations only
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const activeOnly = searchParams.get('activeOnly') === 'true';

        const locations = activeOnly
            ? await LocationService.getActiveLocations()
            : await LocationService.getAllLocations();

        return NextResponse.json({
            success: true,
            locations,
            count: locations.length,
        });
    } catch (error) {
        console.error('Error fetching locations:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch locations',
            },
            { status: 500 }
        );
    }
}

// POST - Create a new location
export async function POST(request: NextRequest) {
    try {
        const body: LocationFormData = await request.json();

        // Validation
        if (!body.name || !body.type) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Name and type are required',
                },
                { status: 400 }
            );
        }

        const locationId = await LocationService.createLocation(body);

        return NextResponse.json({
            success: true,
            locationId,
            message: 'Location created successfully',
        });
    } catch (error) {
        console.error('Error creating location:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to create location',
            },
            { status: 500 }
        );
    }
}

// PUT - Update an existing location
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, ...locationData } = body;

        if (!id) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Location ID is required',
                },
                { status: 400 }
            );
        }

        await LocationService.updateLocation(id, locationData);

        return NextResponse.json({
            success: true,
            message: 'Location updated successfully',
        });
    } catch (error) {
        console.error('Error updating location:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to update location',
            },
            { status: 500 }
        );
    }
}

// DELETE - Delete a location
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Location ID is required',
                },
                { status: 400 }
            );
        }

        await LocationService.deleteLocation(id);

        return NextResponse.json({
            success: true,
            message: 'Location deleted successfully',
        });
    } catch (error: any) {
        console.error('Error deleting location:', error);
        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Failed to delete location',
            },
            { status: 500 }
        );
    }
}



