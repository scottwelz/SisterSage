# AI Product Matching System Guide

## Overview

The AI Product Matching System uses **Google Gemini 2.0 Flash** to intelligently match your local inventory products with products from Shopify, Square, and Amazon. This guide explains how to use the system effectively.

## How It Works

### 1. Source of Truth

Your **Firestore database** is the central source of truth for all inventory. Products in external platforms (Shopify, Square, Amazon) are matched to your local products rather than the other way around.

### 2. Matching Process

```
Local Products (Firestore) → AI Analysis → Match Suggestions → Human Approval → Product Mappings
                                ↓
                          Platform Products (Shopify/Square/Amazon)
```

The AI analyzes products based on:
- **SKU similarity (70% weight)**: Exact matches, substring matches, or similar patterns
- **Name similarity (20% weight)**: Product names, herb types, forms (oil, powder, capsule)
- **Price similarity (10% weight)**: Similar pricing increases confidence

### 3. Confidence Scores

The AI assigns confidence scores to each match:
- **≥ 0.9 (90%+)**: Very high confidence - likely the same product
- **0.7-0.89 (70-89%)**: High confidence - probably matches, review recommended
- **0.5-0.69 (50-69%)**: Medium confidence - uncertain, human review needed
- **< 0.5 (<50%)**: Low confidence - likely different products

### 4. Learning System

The system learns from your decisions:
- ✅ When you **approve** a match, it's saved as training data
- ❌ When you **reject** a match, it's also saved
- Over time, the AI learns your SKU patterns and naming conventions
- Future suggestions become more accurate

## Getting Started

### Prerequisites

1. **Add Your Products First**
   - Add all your herbal products to Firestore with consistent SKUs
   - Having a clean foundation is crucial for accurate matching

2. **Set Up Platform Credentials**
   - Configure Shopify API credentials (optional)
   - Configure Square API credentials (optional)
   - Configure Amazon SP-API credentials (optional)

3. **Configure AI**
   - Get a Google AI Studio API key: https://aistudio.google.com/app/apikey
   - Add to `.env.local`: `GOOGLE_GENAI_API_KEY=your_key_here`

### Step-by-Step Workflow

#### Step 1: Generate Match Suggestions

1. Navigate to **Match Review** page
2. Click **"Generate AI Matches"**
3. The system will:
   - Fetch all local products
   - Fetch products from all configured platforms
   - Use AI to analyze and suggest matches
   - Save suggestions to Firestore

#### Step 2: Review Suggestions

The Match Review page shows suggestions organized by platform (Shopify, Square, Amazon).

For each suggestion, you'll see:
- **Your local product** (left side)
  - SKU
  - Name
  
- **Platform product** (right side)
  - SKU
  - Name
  - Price
  
- **AI confidence score** (badge at top)
- **AI reasoning** (blue box at bottom)

#### Step 3: Approve or Reject

**To Approve a Match:**
1. Review the product details
2. Click the green **"Approve"** button
3. The system will:
   - Create a product mapping
   - Save to training data (for AI learning)
   - Remove from pending suggestions

**To Reject a Match:**
1. If the products don't match
2. Click the red **"Reject"** button
3. The system will:
   - Save rejection to training data
   - Remove from pending suggestions
   - Help AI avoid similar mistakes

**Bulk Approve:**
- Click **"Bulk Approve High Confidence"**
- Automatically approves all matches with ≥90% confidence
- Useful for processing many obvious matches quickly

## Using the Sync Dashboard

### Monitoring Inventory

The **Sync** page provides:

1. **Platform Status Cards**
   - Last sync time
   - Items processed
   - Success/failure status

2. **Discrepancy Detection**
   - Identifies when local and platform inventory don't match
   - Shows which products need attention
   - Displays the difference for each platform

3. **Sync History**
   - View all past synchronization attempts
   - Filter by platform
   - See success/failure rates

### Running Syncs

**Sync from Platforms:**
1. Click **"Sync from Platforms"**
2. Fetches current inventory from all platforms
3. Updates your local database based on mappings
4. Logs results

**Note:** This pulls platform inventory → local database

## Best Practices

### SKU Management

✅ **Do:**
- Use consistent SKU patterns across all platforms
- Keep SKUs simple and meaningful (e.g., `LAV-OIL-30ML`)
- Document your SKU naming convention

❌ **Don't:**
- Use random or generated SKUs that vary by platform
- Include platform-specific codes in SKUs
- Change SKUs after products are mapped

### Matching Strategy

**For New Products:**
1. Add to local database first with clear SKU and name
2. Add to platforms using the same SKU
3. Run AI matching
4. Approve high-confidence matches

**For Existing Products:**
1. Ensure local database has all products
2. Generate AI matches
3. Start with high-confidence (≥90%) - bulk approve
4. Review medium-confidence (50-89%) individually
5. Investigate low-confidence (<50%) manually

### Ongoing Maintenance

**Weekly:**
- Run "Sync from Platforms" to catch inventory changes
- Review any new discrepancies

**Monthly:**
- Generate new matches for any unmapped products
- Review sync logs for patterns or issues

**As Needed:**
- When adding new products to platforms
- After making bulk changes to inventory
- If discrepancies persist

## Troubleshooting

### "No matches found"

**Possible causes:**
- All products are already mapped
- SKUs don't match between local and platform
- Platform credentials not configured

**Solutions:**
- Check if mappings already exist in Firestore
- Verify SKUs are similar on both sides
- Test platform API connections

### Low confidence scores

**Possible causes:**
- SKU mismatch
- Different naming conventions
- First-time use (no training data yet)

**Solutions:**
- Update SKUs to be more consistent
- Approve/reject more matches to build training data
- Check product names are similar

### Sync failures

**Possible causes:**
- API credentials expired or invalid
- Platform API rate limits hit
- Network connectivity issues

**Solutions:**
- Verify API credentials in `.env.local`
- Check sync logs for specific error messages
- Wait and retry if rate limited

### AI not learning

**Possible causes:**
- Not enough training data yet
- Very inconsistent product information

**Solutions:**
- Approve/reject at least 10-20 matches
- Be consistent in your decisions
- Ensure SKU patterns make sense

## Advanced Features

### Manual Product Mapping

If AI doesn't find a match, you can manually create mappings in Firestore:

Collection: `product_mappings`

```javascript
{
  localProductId: "local_product_id",
  localSku: "LAV-OIL-30ML",
  shopifyProductId: "12345678",
  shopifyVariantId: "98765432",
  squareItemVariationId: "ABC123",
  amazonAsin: "B08XYZ",
  matchedAt: timestamp,
  matchedBy: "manual",
  confidence: 1.0
}
```

### Webhook Integration

For real-time inventory updates:

1. **Shopify Webhooks**
   - Set up webhooks for `orders/create` and `inventory_levels/update`
   - Point to: `https://your-domain.com/api/webhooks/shopify`
   - Add `SHOPIFY_WEBHOOK_SECRET` to environment

2. **Square Webhooks**
   - Configure webhooks for order and inventory events
   - Point to: `https://your-domain.com/api/webhooks/square`
   - Add `SQUARE_WEBHOOK_SIGNATURE_KEY` to environment

3. **Amazon Notifications**
   - Set up EventBridge notifications
   - Point to: `https://your-domain.com/api/webhooks/amazon`
   - Add `AMAZON_WEBHOOK_SECRET` to environment

### API Endpoints

**Generate Matches:**
```typescript
// In your code
import { AIMatcher } from '@/lib/ai-matcher';
import { PlatformFetcher } from '@/lib/platform-fetcher';
import { ProductService } from '@/lib/product-service';

const localProducts = await ProductService.getAllProducts();
const { shopify } = await PlatformFetcher.fetchAllProducts();
const suggestions = await AIMatcher.generateMatchSuggestions(
  localProducts,
  shopify,
  'shopify'
);
```

**Sync Inventory:**
```typescript
import { SyncService } from '@/lib/sync-service';

// Detect discrepancies
const discrepancies = await SyncService.detectDiscrepancies();

// Sync from platforms
const logs = await SyncService.syncFromPlatforms();
```

## Data Collections

The system uses these Firestore collections:

1. **`products`** - Your local inventory
2. **`product_mappings`** - Approved product connections
3. **`match_suggestions`** - Pending AI suggestions
4. **`match_training`** - AI learning data
5. **`sync_logs`** - Synchronization history

## Security Notes

- API keys are stored in environment variables (never committed)
- Webhook signatures are verified before processing
- Only authenticated users can access matching features
- Firestore security rules protect data access

## Support

For issues or questions:
1. Check the [SETUP.md](./SETUP.md) for configuration help
2. Review Firestore Console for data issues
3. Check browser console for client-side errors
4. Review server logs for API errors

## Future Enhancements

Planned features:
- Batch product uploads via CSV
- Advanced filtering in Match Review
- Automatic low-confidence re-matching
- Product mapping history/audit log
- Multi-location inventory support
- Predictive stock alerts


