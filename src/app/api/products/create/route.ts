import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

const PRODUCTS_COLLECTION = 'products';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            name,
            sku,
            description,
            price,
            quantity,
            locationId,
            notes,
            squareVariationId,
            shopifyVariantId,
            amazonSku,
            amazonAsin,
        } = body;

        // Validate required fields
        if (!name || !sku) {
            return NextResponse.json(
                { success: false, error: 'Name and SKU are required' },
                { status: 400 }
            );
        }

        // Check for duplicate SKU
        const existingProducts = await adminDb
            .collection(PRODUCTS_COLLECTION)
            .where('sku', '==', sku)
            .get();

        if (!existingProducts.empty) {
            return NextResponse.json(
                { success: false, error: 'A product with this SKU already exists' },
                { status: 409 }
            );
        }

        // Prepare product data
        const productData: any = {
            name,
            sku,
            description: description || '',
            price: price || null,
            imageUrl: '',
            imageHint: '',
            stock: {
                shopify: 0,
                square: 0,
                amazon: 0,
            },
            locations: {},
            totalQuantity: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        // Add platform IDs if provided
        if (squareVariationId) productData.squareVariationId = squareVariationId;
        if (shopifyVariantId) productData.shopifyVariantId = shopifyVariantId;
        if (amazonSku) productData.amazonSku = amazonSku;
        if (amazonAsin) productData.amazonAsin = amazonAsin;

        // If quantity and location provided, initialize inventory
        if (quantity !== undefined && quantity > 0 && locationId) {
            productData.locations = {
                [locationId]: {
                    quantity: parseInt(quantity),
                    minStockLevel: 0,
                },
            };
            productData.totalQuantity = parseInt(quantity);
        }

        // Create product document
        const docRef = await adminDb.collection(PRODUCTS_COLLECTION).add(productData);

        // Create transaction record if inventory was added
        if (quantity !== undefined && quantity > 0 && locationId) {
            const locationDoc = await adminDb.collection('locations').doc(locationId).get();
            const locationName = locationDoc.data()?.name || locationId;

            await adminDb.collection('transactions').add({
                type: 'production',
                productId: docRef.id,
                productName: name,
                productSku: sku,
                quantity: parseInt(quantity),
                toLocationId: locationId,
                toLocationName: locationName,
                source: 'manual',
                notes: notes || 'Initial inventory from catalog import',
                createdAt: new Date(),
            });
        }

        return NextResponse.json({
            success: true,
            productId: docRef.id,
            message: 'Product added to inventory successfully',
        });
    } catch (error: any) {
        console.error('Error creating product:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to create product' },
            { status: 500 }
        );
    }
}

