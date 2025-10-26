import { NextResponse } from 'next/server';

// Get Square credentials from environment variables
const SQUARE_ACCESS_TOKEN = process.env.SQUARE_ACCESS_TOKEN;
const SQUARE_ENVIRONMENT = process.env.SQUARE_ENVIRONMENT || 'production'; // 'sandbox' or 'production'

/**
 * API route to fetch Square catalog items
 * GET /api/square/catalog
 */
export async function GET() {
    try {
        if (!SQUARE_ACCESS_TOKEN) {
            return NextResponse.json(
                { error: 'Square credentials not configured. Please set SQUARE_ACCESS_TOKEN in .env.local' },
                { status: 500 }
            );
        }

        // Determine the correct API endpoint based on environment
        const baseUrl = SQUARE_ENVIRONMENT === 'sandbox'
            ? 'https://connect.squareupsandbox.com'
            : 'https://connect.squareup.com';

        console.log(`Fetching Square catalog from ${SQUARE_ENVIRONMENT} environment...`);
        console.log(`Using URL: ${baseUrl}/v2/catalog/list`);

        // Fetch catalog items from Square
        const squareResponse = await fetch(`${baseUrl}/v2/catalog/list?types=ITEM`, {
            method: 'GET',
            headers: {
                'Square-Version': '2024-01-18',
                'Authorization': `Bearer ${SQUARE_ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
            },
        });

        if (!squareResponse.ok) {
            const errorText = await squareResponse.text();
            console.error('Square Catalog API error:', errorText);
            console.error('Status:', squareResponse.status);
            console.error('Environment:', SQUARE_ENVIRONMENT);

            let errorMessage = 'Failed to fetch from Square Catalog API';

            if (squareResponse.status === 401) {
                errorMessage = 'Unauthorized: Check your Square access token and permissions. ' +
                    'Make sure the token has ITEMS_READ permission and matches your environment ' +
                    `(currently set to: ${SQUARE_ENVIRONMENT}).`;
            }

            return NextResponse.json(
                {
                    error: errorMessage,
                    details: errorText,
                    environment: SQUARE_ENVIRONMENT,
                    status: squareResponse.status
                },
                { status: squareResponse.status }
            );
        }

        const data = await squareResponse.json();

        // Transform the data to make it easier to work with
        const items = (data.objects || []).map((item: any) => {
            const itemData = item.item_data || {};
            const variations = (itemData.variations || []).map((v: any) => ({
                id: v.id,
                name: v.item_variation_data?.name || 'Default',
                sku: v.item_variation_data?.sku || '',
                price: v.item_variation_data?.price_money?.amount ?
                    (v.item_variation_data.price_money.amount / 100) : null,
                priceCurrency: v.item_variation_data?.price_money?.currency || 'USD',
            }));

            return {
                id: item.id,
                type: item.type,
                name: itemData.name || 'Unnamed Item',
                description: itemData.description || '',
                abbreviation: itemData.abbreviation || '',
                categoryId: itemData.category_id || null,
                variations: variations,
                updatedAt: item.updated_at,
                version: item.version,
            };
        });

        return NextResponse.json({
            success: true,
            items,
            count: items.length,
            cursor: data.cursor // For pagination if needed
        });
    } catch (error) {
        console.error('Square Catalog API error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch catalog data from Square', details: (error as Error).message },
            { status: 500 }
        );
    }
}

