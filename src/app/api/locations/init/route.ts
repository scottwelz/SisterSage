import { NextRequest, NextResponse } from 'next/server';
import { LocationService } from '@/lib/location-service';

// POST - Initialize default locations
export async function POST(request: NextRequest) {
    try {
        await LocationService.initializeDefaultLocations();

        return NextResponse.json({
            success: true,
            message: 'Default locations initialized successfully',
        });
    } catch (error) {
        console.error('Error initializing locations:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to initialize locations',
            },
            { status: 500 }
        );
    }
}


