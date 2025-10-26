import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { PlatformFetcher } from '@/lib/platform-fetcher';
import { AIMatcher } from '@/lib/ai-matcher';
import type { Platform, Product } from '@/types';

/**
 * API route to generate AI match suggestions
 * POST /api/matches/generate
 */
export async function POST(request: NextRequest) {
    try {
        // Fetch all local products using Admin SDK
        const productsSnapshot = await adminDb.collection('products').get();
        const localProducts = productsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as Product[];

        if (localProducts.length === 0) {
            return NextResponse.json(
                { error: 'No products found in inventory. Add products first.' },
                { status: 400 }
            );
        }

        // Fetch platform products
        const platformData = await PlatformFetcher.fetchAllProducts();

        let totalGenerated = 0;
        const results: Record<string, number> = {};

        // Generate matches for each platform
        for (const platform of ['shopify', 'square', 'amazon'] as Platform[]) {
            const platformProducts = platformData[platform];

            if (platformProducts.length === 0) {
                console.log(`No products found on ${platform}`);
                results[platform] = 0;
                continue;
            }

            const newSuggestions = await AIMatcher.generateMatchSuggestions(
                localProducts,
                platformProducts,
                platform
            );

            if (newSuggestions.length > 0) {
                // Save suggestions using Admin SDK
                for (const suggestion of newSuggestions) {
                    await adminDb.collection('match_suggestions').add({
                        localProductId: suggestion.localProduct.id,
                        localProductSku: suggestion.localProduct.sku,
                        localProductName: suggestion.localProduct.name,
                        platformProductId: suggestion.platformProduct.id,
                        platformProductSku: suggestion.platformProduct.sku,
                        platformProductName: suggestion.platformProduct.name,
                        platform: suggestion.platform,
                        confidence: suggestion.confidence,
                        reasoning: suggestion.reasoning,
                        status: suggestion.status,
                        createdAt: new Date()
                    });
                }

                totalGenerated += newSuggestions.length;
                results[platform] = newSuggestions.length;
            } else {
                results[platform] = 0;
            }
        }

        if (totalGenerated > 0) {
            return NextResponse.json({
                success: true,
                totalGenerated,
                results,
                message: `Generated ${totalGenerated} match suggestions`
            });
        } else {
            return NextResponse.json(
                {
                    success: false,
                    error: 'No new matches found. All products may already be matched.',
                    results
                },
                { status: 404 }
            );
        }
    } catch (error) {
        console.error('Error generating matches:', error);
        return NextResponse.json(
            { error: 'Failed to generate matches', details: (error as Error).message },
            { status: 500 }
        );
    }
}

