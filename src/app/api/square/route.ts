import { NextRequest, NextResponse } from 'next/server';

// Get Square credentials from environment variables
const SQUARE_ACCESS_TOKEN = process.env.SQUARE_ACCESS_TOKEN;
const SQUARE_LOCATION_ID = process.env.SQUARE_LOCATION_ID;

export async function GET(request: NextRequest) {
    try {
        if (!SQUARE_ACCESS_TOKEN) {
            return NextResponse.json(
                { error: 'Square credentials not configured. Please set SQUARE_ACCESS_TOKEN in .env.local' },
                { status: 500 }
            );
        }

        // Fetch inventory from Square account
        const squareResponse = await fetch('https://connect.squareup.com/v2/inventory/counts/batch-retrieve', {
            method: 'POST',
            headers: {
                'Square-Version': '2024-01-18',
                'Authorization': `Bearer ${SQUARE_ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                location_ids: SQUARE_LOCATION_ID ? [SQUARE_LOCATION_ID] : undefined,
            }),
        });

        if (!squareResponse.ok) {
            const errorText = await squareResponse.text();
            console.error('Square API error:', errorText);
            return NextResponse.json(
                { error: 'Failed to fetch from Square', details: errorText },
                { status: squareResponse.status }
            );
        }

        const data = await squareResponse.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Square API error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch data from Square' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        if (!SQUARE_ACCESS_TOKEN) {
            return NextResponse.json(
                { error: 'Square credentials not configured. Please set SQUARE_ACCESS_TOKEN in .env.local' },
                { status: 500 }
            );
        }

        const body = await request.json();

        // Update inventory in Square account
        const squareResponse = await fetch('https://connect.squareup.com/v2/inventory/counts/batch-change', {
            method: 'POST',
            headers: {
                'Square-Version': '2024-01-18',
                'Authorization': `Bearer ${SQUARE_ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ...body,
                location_id: SQUARE_LOCATION_ID,
            }),
        });

        if (!squareResponse.ok) {
            const errorText = await squareResponse.text();
            console.error('Square API error:', errorText);
            return NextResponse.json(
                { error: 'Failed to update Square inventory', details: errorText },
                { status: squareResponse.status }
            );
        }

        const data = await squareResponse.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Square API error:', error);
        return NextResponse.json(
            { error: 'Failed to update Square inventory' },
            { status: 500 }
        );
    }
} 