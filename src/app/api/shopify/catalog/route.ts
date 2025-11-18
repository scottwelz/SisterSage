import { NextRequest, NextResponse } from 'next/server';

// Get Shopify credentials from environment variables
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_API_KEY;
const SHOPIFY_STORE_URL = process.env.SHOPIFY_STORE_URL;

interface ShopifyVariant {
    id: number;
    product_id: number;
    title: string;
    sku: string;
    price: string;
    inventory_quantity: number;
    inventory_item_id: number;
}

interface ShopifyProduct {
    id: number;
    title: string;
    body_html: string;
    vendor: string;
    product_type: string;
    handle: string;
    variants: ShopifyVariant[];
    updated_at: string;
}

interface ShopifyVariationFormatted {
    id: string;
    name: string;
    sku: string;
    price: number | null;
    inventoryQuantity: number;
}

interface ShopifyItemFormatted {
    id: string;
    name: string;
    description: string;
    vendor: string;
    productType: string;
    variations: ShopifyVariationFormatted[];
    updatedAt: string;
}

export async function GET(request: NextRequest) {
    try {
        if (!SHOPIFY_ACCESS_TOKEN || !SHOPIFY_STORE_URL) {
            return NextResponse.json({
                success: false,
                error: 'Shopify credentials not configured. Please set SHOPIFY_API_KEY and SHOPIFY_STORE_URL in .env.local',
                items: []
            });
        }

        // Fetch products from Shopify store
        const shopifyResponse = await fetch(
            `https://${SHOPIFY_STORE_URL}/admin/api/2024-01/products.json?limit=250`,
            {
                headers: {
                    'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
                    'Content-Type': 'application/json',
                },
            }
        );

        if (!shopifyResponse.ok) {
            const errorText = await shopifyResponse.text();
            console.error('Shopify API error:', errorText);
            return NextResponse.json({
                success: false,
                error: `Shopify API returned ${shopifyResponse.status}. Check your credentials and permissions.`,
                items: []
            });
        }

        const data = await shopifyResponse.json();
        const products: ShopifyProduct[] = data.products || [];

        // Format products to match our catalog structure
        const formattedItems: ShopifyItemFormatted[] = products.map((product) => ({
            id: product.id.toString(),
            name: product.title,
            description: product.body_html?.replace(/<[^>]*>/g, '') || '', // Strip HTML tags
            vendor: product.vendor,
            productType: product.product_type,
            variations: product.variants.map((variant) => ({
                id: variant.id.toString(),
                name: variant.title,
                sku: variant.sku || '',
                price: variant.price ? parseFloat(variant.price) : null,
                inventoryQuantity: variant.inventory_quantity || 0,
            })),
            updatedAt: product.updated_at,
        }));

        return NextResponse.json({
            success: true,
            items: formattedItems,
            count: formattedItems.length,
        });
    } catch (error) {
        console.error('Shopify catalog API error:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to fetch Shopify catalog',
            items: []
        });
    }
}



