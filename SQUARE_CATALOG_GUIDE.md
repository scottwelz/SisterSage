# Square Catalog Viewer Guide

## Overview

The Square Catalog page displays all products from your Square account, showing their IDs, variations, SKUs, and prices. This makes it easy to see what products exist in Square and get the IDs you need for product matching.

## Accessing the Page

Navigate to: **Square Catalog** in the top navigation menu

Or directly: `/square-catalog`

## What You'll See

### Product Cards

Each product is displayed in a card showing:

**Header:**
- Product name and description
- Number of variations
- Item ID (the main catalog object ID)

**Variations Table:**
- **Variation Name** - Size, color, or other variant (e.g., "Small", "Large")
- **SKU** - Your custom SKU if you set one in Square
- **Price** - Price in cents (divided by 100 for display)
- **Variation ID** - The unique ID for this specific variation
- **Copy Button** - Click to copy any ID to clipboard

## Understanding the IDs

### Item ID (Catalog Object ID)
```
Example: "ABC123XYZ789"
```
- The main product ID in Square
- Used as `squareCatalogObjectId` in product mappings
- Represents the parent item with all its variations

### Variation ID (Item Variation ID)
```
Example: "DEF456UVW123"
```
- The ID for a specific variant (size, color, etc.)
- Used as `squareItemVariationId` in product mappings
- Used for inventory tracking and orders
- **This is the ID used in webhooks!**

## Using the IDs for Product Matching

When the AI matching system creates suggestions or you manually create mappings, you need:

### For AI Matching
1. The AI will automatically fetch these IDs from Square
2. It compares SKUs and names with your local products
3. When you approve a match, it saves both IDs to the mapping

### For Manual Mapping

If you need to manually create a product mapping in Firestore:

**Collection:** `product_mappings`

**Document:**
```json
{
  "localProductId": "your_firestore_product_id",
  "localSku": "LAV-OIL-30ML",
  "squareCatalogObjectId": "ABC123XYZ789",  // ← Item ID from catalog
  "squareItemVariationId": "DEF456UVW123",  // ← Variation ID from catalog
  "matchedAt": "2024-01-15T10:00:00Z",
  "matchedBy": "manual",
  "confidence": 1.0
}
```

## Common Scenarios

### Scenario 1: Product with Single Variation

```
Product: Lavender Essential Oil
  ├─ Item ID: ABC123
  └─ Variation: "Regular" (ID: DEF456)
      ├─ SKU: LAV-OIL-30ML
      └─ Price: $24.99
```

**Mapping:**
- `squareCatalogObjectId` = `ABC123`
- `squareItemVariationId` = `DEF456`

### Scenario 2: Product with Multiple Variations

```
Product: Chamomile Tea
  ├─ Item ID: XYZ789
  ├─ Variation: "Small 50g" (ID: AAA111)
  │   ├─ SKU: CHM-TEA-50G
  │   └─ Price: $12.99
  └─ Variation: "Large 100g" (ID: BBB222)
      ├─ SKU: CHM-TEA-100G
      └─ Price: $22.99
```

**You need TWO mappings:**

**Mapping 1 (Small):**
- `localProductId` = Your "Chamomile Tea 50g" product
- `squareCatalogObjectId` = `XYZ789`
- `squareItemVariationId` = `AAA111`
- `localSku` = `CHM-TEA-50G`

**Mapping 2 (Large):**
- `localProductId` = Your "Chamomile Tea 100g" product
- `squareCatalogObjectId` = `XYZ789`
- `squareItemVariationId` = `BBB222`
- `localSku` = `CHM-TEA-100G`

## Features

### Copy to Clipboard
- Click the copy icon next to any ID
- A checkmark appears when copied successfully
- Toast notification confirms the copy

### Refresh Button
- Fetches latest catalog data from Square
- Shows loading spinner while fetching
- Displays count of items found

### No Items Found
- If your Square catalog is empty
- Check that products exist in Square Dashboard
- Verify your `SQUARE_ACCESS_TOKEN` is correct

## Troubleshooting

### Error: "Square credentials not configured"

**Solution:** Add `SQUARE_ACCESS_TOKEN` to `.env.local`:
```bash
SQUARE_ACCESS_TOKEN=your_access_token_here
```

### Error: "Failed to fetch from Square Catalog API"

**Possible causes:**
1. Invalid or expired access token
2. Insufficient permissions (need `ITEMS_READ` scope)
3. Network connectivity issues

**Solution:**
1. Verify your Square access token in Developer Dashboard
2. Regenerate token with correct permissions
3. Update `.env.local` with new token

### No SKUs Showing

**This is normal if:**
- You haven't assigned SKUs in Square
- Products were created without SKUs

**Solution:**
- Add SKUs in Square Dashboard
- Or use product names for matching

### No Variations for Item

**This happens when:**
- Item was created without variations
- Variations were deleted

**Square automatically creates a default variation**
- Even products without explicit variations have one

## Best Practices

### 1. Organize SKUs Consistently

Use a consistent SKU format across all platforms:
```
PRODUCT-TYPE-SIZE
LAV-OIL-30ML
CHM-PWD-100G
ROS-CAP-60CT
```

### 2. Use Descriptive Variation Names

Instead of "Default", use:
- Size-based: "30ml", "100g", "Large"
- Type-based: "Oil", "Powder", "Capsule"
- Count-based: "60 count", "120 count"

### 3. Keep Prices Updated

- Prices shown are from Square
- Update in Square Dashboard
- Changes reflect immediately in catalog view

### 4. Document Your Mappings

Keep a spreadsheet or note of:
- Local SKU → Square Variation ID
- Product Name → Square Item ID
- Helps troubleshoot sync issues

## Integration with Other Features

### Match Review Page
- AI matching uses these IDs automatically
- Compares Square SKUs with your local SKUs
- Creates mappings when you approve matches

### Sync Dashboard
- Uses variation IDs to update inventory
- Tracks discrepancies by variation
- Shows which Square products are mapped

### Webhooks
- Use variation IDs to identify products
- Update inventory based on these IDs
- Match webhook `catalog_object_id` to your mappings

## API Details

The Square Catalog viewer uses:

**Endpoint:** `GET /api/square/catalog`

**Square API Called:** 
```
GET https://connect.squareup.com/v2/catalog/list?types=ITEM
```

**Authentication:** 
- Bearer token from `SQUARE_ACCESS_TOKEN`
- Requires `ITEMS_READ` permission

**Data Transformation:**
- Converts Square's nested structure to flat format
- Calculates prices (divides by 100)
- Extracts SKUs from item_variation_data

## Next Steps

After viewing your catalog:

1. ✅ **Copy IDs** you need for manual mappings
2. ✅ **Go to Match Review** to generate AI matches
3. ✅ **Approve matches** to create mappings automatically
4. ✅ **Check Sync Dashboard** to verify connections
5. ✅ **Test webhooks** with these IDs

## Related Documentation

- [WEBHOOK_TESTING_GUIDE.md](./WEBHOOK_TESTING_GUIDE.md) - Testing webhooks with catalog IDs
- [AI_MATCHING_GUIDE.md](./AI_MATCHING_GUIDE.md) - Using AI to match products
- [Square Catalog API Documentation](https://developer.squareup.com/docs/catalog-api/what-it-does)


