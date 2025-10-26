import { ai } from '@/ai/genkit';
import type { Product, PlatformProduct, MatchSuggestion, Platform, MatchTraining } from '@/types';
import {
    collection,
    addDoc,
    getDocs,
    query,
    where,
    orderBy,
    limit,
    serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';

interface MatchResult {
    confidence: number;
    reasoning: string;
    isMatch: boolean;
}

/**
 * AI-powered product matching service using Gemini
 */
export class AIMatcher {
    /**
     * Analyze if two products match using AI
     */
    static async analyzeMatch(
        localProduct: Product,
        platformProduct: PlatformProduct,
        trainingData?: MatchTraining[]
    ): Promise<MatchResult> {
        try {
            // Get historical training data if not provided
            if (!trainingData) {
                trainingData = await this.getRelevantTrainingData(localProduct.sku, platformProduct.platform);
            }

            // Build context from training data
            const trainingContext = trainingData.length > 0
                ? `\n\nPrevious matching decisions for reference:\n${trainingData
                    .map(t => `- Local SKU "${t.localSku}" ${t.wasMatch ? 'MATCHED' : 'DID NOT MATCH'} platform SKU "${t.platformSku}"`)
                    .join('\n')}`
                : '';

            // Create a structured prompt for Gemini
            const prompt = `You are an expert at matching herbal products across e-commerce platforms.

Your task: Determine if these two products are the same item.

LOCAL PRODUCT (Source of Truth):
- SKU: ${localProduct.sku}
- Name: ${localProduct.name}
- Description: ${localProduct.description || 'N/A'}
- Price: $${localProduct.price || 'N/A'}

PLATFORM PRODUCT (${platformProduct.platform.toUpperCase()}):
- SKU: ${platformProduct.sku || 'N/A'}
- Name: ${platformProduct.name}
- Description: ${platformProduct.description || 'N/A'}
- Price: $${platformProduct.price || 'N/A'}
${trainingContext}

MATCHING CRITERIA (in order of importance):
1. SKU Match (70% weight): Exact match is best, but consider substring matches or similar patterns
2. Name Similarity (20% weight): Consider herb names, forms (oil, powder, capsule), sizes, scents
3. Price Match (10% weight): Similar prices increase confidence

RESPONSE FORMAT:
Provide your analysis as a JSON object with these exact fields:
{
  "confidence": <number between 0 and 1>,
  "reasoning": "<brief explanation of your decision>",
  "isMatch": <true or false>
}

Rules:
- confidence >= 0.9: Very likely the same product
- confidence 0.7-0.89: Probably the same, but review recommended
- confidence 0.5-0.69: Uncertain, human review needed
- confidence < 0.5: Likely different products
- isMatch should be true only if confidence >= 0.7

Respond ONLY with the JSON object, no additional text.`;

            // Call Gemini
            const { text } = await ai.generate({
                prompt,
                config: {
                    temperature: 0.1, // Low temperature for consistent results
                }
            });

            // Parse the response
            const cleanedText = text().trim();
            const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);

            if (!jsonMatch) {
                throw new Error('Invalid AI response format');
            }

            const result: MatchResult = JSON.parse(jsonMatch[0]);

            // Validate the response
            if (typeof result.confidence !== 'number' ||
                typeof result.reasoning !== 'string' ||
                typeof result.isMatch !== 'boolean') {
                throw new Error('Invalid AI response structure');
            }

            // Ensure confidence is between 0 and 1
            result.confidence = Math.max(0, Math.min(1, result.confidence));

            return result;
        } catch (error) {
            console.error('Error analyzing match:', error);
            // Fallback to basic SKU matching
            return this.basicSkuMatch(localProduct, platformProduct);
        }
    }

    /**
     * Basic SKU matching as fallback
     */
    private static basicSkuMatch(localProduct: Product, platformProduct: PlatformProduct): MatchResult {
        const localSku = localProduct.sku.toLowerCase().trim();
        const platformSku = (platformProduct.sku || '').toLowerCase().trim();

        if (!platformSku) {
            return {
                confidence: 0,
                reasoning: 'Platform product has no SKU',
                isMatch: false
            };
        }

        // Exact match
        if (localSku === platformSku) {
            return {
                confidence: 0.95,
                reasoning: 'Exact SKU match',
                isMatch: true
            };
        }

        // Contains match
        if (localSku.includes(platformSku) || platformSku.includes(localSku)) {
            return {
                confidence: 0.75,
                reasoning: 'SKU substring match',
                isMatch: true
            };
        }

        // Name similarity check
        const localName = localProduct.name.toLowerCase();
        const platformName = platformProduct.name.toLowerCase();
        const nameWords = localName.split(/\s+/);
        const matchingWords = nameWords.filter(word =>
            word.length > 3 && platformName.includes(word)
        ).length;

        if (matchingWords >= 2) {
            return {
                confidence: 0.6,
                reasoning: `${matchingWords} matching words in product name`,
                isMatch: false // Below 0.7 threshold
            };
        }

        return {
            confidence: 0.2,
            reasoning: 'No significant matches found',
            isMatch: false
        };
    }

    /**
     * Generate match suggestions for all local products against platform products
     */
    static async generateMatchSuggestions(
        localProducts: Product[],
        platformProducts: PlatformProduct[],
        platform: Platform
    ): Promise<MatchSuggestion[]> {
        const suggestions: MatchSuggestion[] = [];

        // Get all training data for this platform at once
        const trainingData = await this.getAllTrainingData(platform);

        for (const localProduct of localProducts) {
            // Check if this product is already mapped
            const existingMapping = await this.hasExistingMapping(localProduct.id, platform);
            if (existingMapping) {
                console.log(`Skipping ${localProduct.sku} - already mapped to ${platform}`);
                continue;
            }

            // Filter platform products by SKU similarity first for efficiency
            const candidates = platformProducts.filter(pp => {
                if (!pp.sku) return false;
                const localSku = localProduct.sku.toLowerCase();
                const platformSku = pp.sku.toLowerCase();
                return localSku === platformSku ||
                    localSku.includes(platformSku) ||
                    platformSku.includes(localSku) ||
                    this.nameSimilarity(localProduct.name, pp.name) > 0.5;
            });

            // If no candidates, try the first few products anyway
            const productsToCheck = candidates.length > 0
                ? candidates
                : platformProducts.slice(0, 3);

            for (const platformProduct of productsToCheck) {
                const matchResult = await this.analyzeMatch(
                    localProduct,
                    platformProduct,
                    trainingData
                );

                // Only create suggestions for matches above threshold
                if (matchResult.confidence >= 0.5) {
                    suggestions.push({
                        id: '', // Will be set when saved to Firestore
                        localProduct,
                        platformProduct,
                        platform,
                        confidence: matchResult.confidence,
                        reasoning: matchResult.reasoning,
                        status: 'pending',
                        createdAt: new Date()
                    });
                }
            }
        }

        // Sort by confidence (highest first)
        suggestions.sort((a, b) => b.confidence - a.confidence);

        return suggestions;
    }

    /**
     * Save match suggestions to Firestore
     */
    static async saveSuggestions(suggestions: MatchSuggestion[]): Promise<void> {
        const suggestionsRef = collection(db, 'match_suggestions');

        for (const suggestion of suggestions) {
            await addDoc(suggestionsRef, {
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
                createdAt: serverTimestamp()
            });
        }
    }

    /**
     * Get relevant training data for a specific SKU and platform
     */
    private static async getRelevantTrainingData(
        sku: string,
        platform: Platform,
        maxResults: number = 10
    ): Promise<MatchTraining[]> {
        try {
            const trainingRef = collection(db, 'match_training');
            const q = query(
                trainingRef,
                where('platform', '==', platform),
                orderBy('createdAt', 'desc'),
                limit(maxResults)
            );

            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate() || new Date()
            })) as MatchTraining[];
        } catch (error) {
            console.error('Error fetching training data:', error);
            return [];
        }
    }

    /**
     * Get all training data for a platform
     */
    private static async getAllTrainingData(platform: Platform): Promise<MatchTraining[]> {
        return this.getRelevantTrainingData('', platform, 50);
    }

    /**
     * Check if a product already has a mapping for a platform
     */
    private static async hasExistingMapping(
        localProductId: string,
        platform: Platform
    ): Promise<boolean> {
        try {
            const mappingsRef = collection(db, 'product_mappings');
            const q = query(
                mappingsRef,
                where('localProductId', '==', localProductId)
            );

            const querySnapshot = await getDocs(q);

            for (const doc of querySnapshot.docs) {
                const data = doc.data();
                // Check if this mapping has the platform-specific ID
                if (platform === 'shopify' && data.shopifyProductId) return true;
                if (platform === 'square' && data.squareItemVariationId) return true;
                if (platform === 'amazon' && data.amazonAsin) return true;
            }

            return false;
        } catch (error) {
            console.error('Error checking existing mapping:', error);
            return false;
        }
    }

    /**
     * Simple name similarity score (0-1)
     */
    private static nameSimilarity(name1: string, name2: string): number {
        const words1 = name1.toLowerCase().split(/\s+/);
        const words2 = name2.toLowerCase().split(/\s+/);

        const matchingWords = words1.filter(word =>
            word.length > 3 && words2.some(w => w.includes(word) || word.includes(w))
        ).length;

        return matchingWords / Math.max(words1.length, words2.length);
    }
}


