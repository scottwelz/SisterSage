import { NextRequest, NextResponse } from 'next/server';

// Get Shopify credentials from environment variables
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_API_KEY;
const SHOPIFY_STORE_URL = process.env.SHOPIFY_STORE_URL;

export async function GET(request: NextRequest) {
    try {
        if (!SHOPIFY_ACCESS_TOKEN || !SHOPIFY_STORE_URL) {
            return NextResponse.json(
                { error: 'Shopify credentials not configured. Please set SHOPIFY_API_KEY and SHOPIFY_STORE_URL in .env.local' },
                { status: 500 }
            );
        }

        // Fetch products from Shopify store
        const shopifyResponse = await fetch(`https://${SHOPIFY_STORE_URL}/admin/api/2024-01/products.json`, {
            headers: {
                'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
                'Content-Type': 'application/json',
            },
        });

        if (!shopifyResponse.ok) {
            const errorText = await shopifyResponse.text();
            console.error('Shopify API error:', errorText);
            return NextResponse.json(
                { error: 'Failed to fetch from Shopify', details: errorText },
                { status: shopifyResponse.status }
            );
        }

        const data = await shopifyResponse.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Shopify API error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch data from Shopify' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        if (!SHOPIFY_ACCESS_TOKEN || !SHOPIFY_STORE_URL) {
            return NextResponse.json(
                { error: 'Shopify credentials not configured. Please set SHOPIFY_API_KEY and SHOPIFY_STORE_URL in .env.local' },
                { status: 500 }
            );
        }

        const body = await request.json();

        // Update inventory in Shopify store
        const shopifyResponse = await fetch(`https://${SHOPIFY_STORE_URL}/admin/api/2024-01/inventory_levels/set.json`, {
            method: 'POST',
            headers: {
                'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!shopifyResponse.ok) {
            const errorText = await shopifyResponse.text();
            console.error('Shopify API error:', errorText);
            return NextResponse.json(
                { error: 'Failed to update Shopify inventory', details: errorText },
                { status: shopifyResponse.status }
            );
        }

        const data = await shopifyResponse.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Shopify API error:', error);
        return NextResponse.json(
            { error: 'Failed to update Shopify inventory' },
            { status: 500 }
        );
    }
} 