import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// TODO: Store the secret in environment variables
const SHOPIFY_WEBHOOK_SECRET = process.env.SHOPIFY_WEBHOOK_SECRET;

async function verifyShopifyWebhook(hmac: string | null, body: string) {
    if (!SHOPIFY_WEBHOOK_SECRET) {
        console.error('Shopify webhook secret is not set.');
        return false;
    }

    const hash = crypto
        .createHmac('sha256', SHOPIFY_WEBHOOK_SECRET)
        .update(body, 'utf8')
        .digest('base64');

    return hmac === hash;
}

export async function POST(request: NextRequest) {
    console.log('Received Shopify webhook');

    // Read the body once and use it for both verification and processing
    const body = await request.text();
    const hmac = request.headers.get('x-shopify-hmac-sha256');

    const isVerified = await verifyShopifyWebhook(hmac, body);

    if (!isVerified) {
        console.warn('Could not verify Shopify webhook request.');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Shopify webhook verified successfully.');

    try {
        const payload = JSON.parse(body);
        console.log('Shopify webhook payload:', JSON.stringify(payload, null, 2));

        // Handle different webhook topics
        const topic = request.headers.get('x-shopify-topic');

        if (topic === 'orders/create' || topic === 'orders/updated') {
            await handleOrderUpdate(payload);
        } else if (topic === 'inventory_levels/update') {
            await handleInventoryUpdate(payload);
        }

        return NextResponse.json({ status: 'success' }, { status: 200 });
    } catch (error) {
        console.error('Error processing Shopify webhook:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

async function handleOrderUpdate(order: any) {
    const { BundleService } = await import('@/lib/bundle-service');
    const { InventoryService } = await import('@/lib/inventory-service');
    const { LocationService } = await import('@/lib/location-service');
    const { adminDb } = await import('@/lib/firebase-admin');

    try {
        // Get the primary location for Shopify sales
        const primaryLocation = await LocationService.getPrimaryLocation();
        const locationId = primaryLocation?.id;

        if (!locationId) {
            console.error('No primary location found for Shopify sales');
            return;
        }

        console.log(`Processing Shopify order from location: ${primaryLocation.name}`);

        // Process each line item in the order
        for (const item of order.line_items || []) {
            const variantId = item.variant_id?.toString();

            if (!variantId) continue;

            // Find product mapping using Admin SDK
            const mappingsSnapshot = await adminDb
                .collection('product_mappings')
                .where('shopifyVariantId', '==', variantId)
                .get();

            if (!mappingsSnapshot.empty) {
                const mapping = mappingsSnapshot.docs[0].data();
                const localProductId = mapping.localProductId;
                const quantity = parseInt(item.quantity || '0');

                try {
                    // Check if this product is a bundle
                    const isBundle = await BundleService.isBundle(localProductId);

                    if (isBundle) {
                        // Process bundle sale (auto-deducts components)
                        await BundleService.processBundleSale(
                            localProductId,
                            quantity,
                            locationId,
                            'shopify',
                            order.id?.toString()
                        );
                        console.log(`Processed bundle sale for product ${localProductId}: -${quantity} bundles`);
                    } else {
                        // Process regular sale
                        await InventoryService.recordSale(
                            localProductId,
                            quantity,
                            locationId,
                            'shopify',
                            order.id?.toString()
                        );
                        console.log(`Recorded sale for product ${localProductId}: -${quantity}`);
                    }
                } catch (error: any) {
                    console.error(`Error processing sale for product ${localProductId}:`, error.message);
                    // Continue processing other items even if one fails
                }
            }
        }
    } catch (error) {
        console.error('Error handling Shopify order update:', error);
    }
}

async function handleInventoryUpdate(payload: any) {
    const { InventoryService } = await import('@/lib/inventory-service');
    const { LocationService } = await import('@/lib/location-service');
    const { adminDb } = await import('@/lib/firebase-admin');

    try {
        const variantId = payload.inventory_item_id?.toString();
        const newQuantity = parseInt(payload.available || '0');

        if (!variantId) return;

        // Get the primary location for Shopify inventory
        const primaryLocation = await LocationService.getPrimaryLocation();
        const locationId = primaryLocation?.id;

        if (!locationId) {
            console.error('No primary location found for Shopify inventory sync');
            return;
        }

        // Find product mapping using Admin SDK
        const mappingsSnapshot = await adminDb
            .collection('product_mappings')
            .where('shopifyVariantId', '==', variantId)
            .get();

        if (!mappingsSnapshot.empty) {
            const mapping = mappingsSnapshot.docs[0].data();
            const localProductId = mapping.localProductId;

            try {
                // Adjust inventory to match Shopify's count
                await InventoryService.adjustInventory(
                    localProductId,
                    locationId,
                    newQuantity,
                    undefined,
                    `Shopify inventory sync: ${newQuantity} units`
                );

                console.log(`Synced inventory from Shopify for product ${localProductId} to ${newQuantity} at ${primaryLocation.name}`);
            } catch (error: any) {
                console.error(`Error syncing inventory for product ${localProductId}:`, error.message);
            }
        }
    } catch (error) {
        console.error('Error handling Shopify inventory update:', error);
    }
}
