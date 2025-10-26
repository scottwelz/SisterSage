import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Square webhook signature key
const SQUARE_WEBHOOK_SIGNATURE_KEY = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;

/**
 * Verify Square webhook signature
 * Square sends webhooks with HMAC-SHA256 signatures
 */
async function verifySquareWebhook(signature: string | null, body: string, url: string): Promise<boolean> {
    if (!SQUARE_WEBHOOK_SIGNATURE_KEY || !signature) {
        return false;
    }

    try {
        // Square signature verification: HMAC-SHA256(notification_url + request_body)
        const hmac = crypto
            .createHmac('sha256', SQUARE_WEBHOOK_SIGNATURE_KEY)
            .update(url + body)
            .digest('base64');

        return signature === hmac;
    } catch (error) {
        console.error('Error verifying Square webhook:', error);
        return false;
    }
}

export async function POST(request: NextRequest) {
    console.log('Received Square webhook');

    const body = await request.text();
    const signature = request.headers.get('x-square-hmacsha256-signature');
    const url = request.url;

    // Verify webhook signature in production
    const isVerified = await verifySquareWebhook(signature, body, url);

    if (!isVerified && process.env.NODE_ENV === 'production') {
        console.warn('Could not verify Square webhook request');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Square webhook verified successfully');

    try {
        const payload = JSON.parse(body);
        console.log('Square webhook payload:', JSON.stringify(payload, null, 2));

        // Handle different event types
        const eventType = payload.type;

        if (eventType === 'order.created' || eventType === 'order.updated') {
            await handleOrderUpdate(payload);
        } else if (eventType === 'inventory.count.updated') {
            await handleInventoryUpdate(payload);
        }

        return NextResponse.json({ status: 'success' }, { status: 200 });
    } catch (error) {
        console.error('Error processing Square webhook:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

async function handleOrderUpdate(event: any) {
    const { BundleService } = await import('@/lib/bundle-service');
    const { InventoryService } = await import('@/lib/inventory-service');
    const { LocationService } = await import('@/lib/location-service');
    const { adminDb } = await import('@/lib/firebase-admin');

    try {
        const order = event.data?.object?.order;

        if (!order || !order.line_items) return;

        // Get the primary location for Square sales
        const primaryLocation = await LocationService.getPrimaryLocation();
        const locationId = primaryLocation?.id;

        if (!locationId) {
            console.error('No primary location found for Square sales');
            return;
        }

        console.log(`Processing Square order from location: ${primaryLocation.name}`);

        // Process each line item
        for (const item of order.line_items) {
            const catalogObjectId = item.catalog_object_id;

            if (!catalogObjectId) continue;

            // Find product mapping using Admin SDK
            const mappingsSnapshot = await adminDb
                .collection('product_mappings')
                .where('squareCatalogObjectId', '==', catalogObjectId)
                .get();

            if (!mappingsSnapshot.empty) {
                const mapping = mappingsSnapshot.docs[0].data();
                const localProductId = mapping.localProductId;
                const quantity = parseFloat(item.quantity || '0');

                try {
                    // Check if this product is a bundle
                    const isBundle = await BundleService.isBundle(localProductId);

                    if (isBundle) {
                        // Process bundle sale (auto-deducts components)
                        await BundleService.processBundleSale(
                            localProductId,
                            quantity,
                            locationId,
                            'square',
                            order.id
                        );
                        console.log(`Processed bundle sale for product ${localProductId}: -${quantity} bundles`);
                    } else {
                        // Process regular sale
                        await InventoryService.recordSale(
                            localProductId,
                            quantity,
                            locationId,
                            'square',
                            order.id
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
        console.error('Error handling Square order update:', error);
    }
}

async function handleInventoryUpdate(event: any) {
    const { InventoryService } = await import('@/lib/inventory-service');
    const { LocationService } = await import('@/lib/location-service');
    const { adminDb } = await import('@/lib/firebase-admin');

    try {
        const inventoryCount = event.data?.object?.inventory_counts?.[0];

        if (!inventoryCount) return;

        const catalogObjectId = inventoryCount.catalog_object_id;
        const newQuantity = parseFloat(inventoryCount.quantity || '0');

        // Get the primary location for Square inventory
        const primaryLocation = await LocationService.getPrimaryLocation();
        const locationId = primaryLocation?.id;

        if (!locationId) {
            console.error('No primary location found for Square inventory sync');
            return;
        }

        // Find product mapping using Admin SDK
        const mappingsSnapshot = await adminDb
            .collection('product_mappings')
            .where('squareCatalogObjectId', '==', catalogObjectId)
            .get();

        if (!mappingsSnapshot.empty) {
            const mapping = mappingsSnapshot.docs[0].data();
            const localProductId = mapping.localProductId;

            try {
                // Adjust inventory to match Square's count
                await InventoryService.adjustInventory(
                    localProductId,
                    locationId,
                    newQuantity,
                    undefined,
                    `Square inventory sync: ${newQuantity} units`
                );

                console.log(`Synced inventory from Square for product ${localProductId} to ${newQuantity} at ${primaryLocation.name}`);
            } catch (error: any) {
                console.error(`Error syncing inventory for product ${localProductId}:`, error.message);
            }
        }
    } catch (error) {
        console.error('Error handling Square inventory update:', error);
    }
}
