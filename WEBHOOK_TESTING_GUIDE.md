# Webhook Testing Guide

## Your Webhook URLs

Based on your Firebase project (`stock-pilot-aup48`), your webhook URLs are:

| Platform | Webhook URL |
|----------|-------------|
| **Shopify** | `https://stock-pilot-aup48.web.app/api/webhooks/shopify` |
| **Square** | `https://stock-pilot-aup48.web.app/api/webhooks/square` |
| **Amazon** | `https://stock-pilot-aup48.web.app/api/webhooks/amazon` |

## Testing Square Webhooks

### Step 1: Configure Square Webhook

1. Go to [Square Developer Dashboard](https://developer.squareup.com/)
2. Select your application
3. Click **"Webhooks"** in the sidebar
4. Click **"Add endpoint"** or **"Create webhook"**
5. Enter:
   - **URL:** `https://stock-pilot-aup48.web.app/api/webhooks/square`
   - **API Version:** `2024-01-18` (or latest)
6. Subscribe to events:
   - ✅ `inventory.count.updated`
   - ✅ `order.created`
   - ✅ `order.updated`
7. **Save** and copy the **Signature Key**

### Step 2: Add Signature Key to Environment

Update your `.env.local`:

```bash
SQUARE_WEBHOOK_SIGNATURE_KEY=your_signature_key_from_square
```

**Important:** After updating `.env.local`, you must **redeploy** your app:

```bash
firebase deploy
```

### Step 3: Test with Square's Test Tool

In the Square Developer Dashboard → Webhooks:

1. Find your webhook endpoint
2. Click **"Test"** or **"Send test event"**
3. Select **"inventory.count.updated"**
4. Click **"Send"**

#### Expected Test Payload

```json
{
  "merchant_id": "6SSW7HV8K2ST5",
  "type": "inventory.count.updated",
  "event_id": "df5f3813-a913-45a1-94e9-fdc3f7d5e3b6",
  "created_at": "2019-10-29T18:38:45.455006797Z",
  "data": {
    "type": "inventory_counts",
    "id": "84e4ac73-d605-4dbd-a9e5-ffff794ddb9d",
    "object": {
      "inventory_counts": [
        {
          "calculated_at": "2019-10-29T18:38:45.10296Z",
          "catalog_object_id": "FGQ5JJWT2PYTHF35CKZ2DSKP",
          "catalog_object_type": "ITEM_VARIATION",
          "location_id": "YYQR03DGCTXA4",
          "quantity": "10",
          "state": "IN_STOCK"
        }
      ]
    }
  }
}
```

### Step 4: Verify Receipt

Check your Firebase Functions logs:

```bash
firebase functions:log
```

Or in Firebase Console → Functions → Logs

You should see:
```
Received Square webhook
Square webhook verified successfully
Square webhook payload: { ... }
```

### What Happens When the Webhook Fires

#### For `inventory.count.updated`:

1. ✅ Webhook received at `/api/webhooks/square`
2. ✅ Signature verified using HMAC-SHA256
3. ✅ Extracts `catalog_object_id` from payload
4. ✅ Looks up product mapping in Firestore:
   ```
   product_mappings
   WHERE squareCatalogObjectId == "FGQ5JJWT2PYTHF35CKZ2DSKP"
   ```
5. ✅ If mapping found, updates local product:
   ```
   products/{id}
   stock.square = 10 (from webhook)
   ```
6. ✅ Logs: `"Synced inventory for LAV-OIL-30ML from Square to 10"`

#### For `order.created` or `order.updated`:

1. ✅ Webhook received and verified
2. ✅ Loops through each line item in order
3. ✅ For each item, finds product mapping by `catalog_object_id`
4. ✅ **Decreases** local inventory by quantity ordered:
   ```
   stock.square = current - quantity_ordered
   ```
5. ✅ Logs: `"Updated inventory for LAV-OIL-30ML: -2"`

## Testing Without Product Mappings

**Important:** The webhook will only update products that have been **matched** via the AI matching system.

### Prerequisites for Successful Test:

1. ✅ Have at least one product in your Firestore `products` collection
2. ✅ Have a product mapping in `product_mappings` with `squareCatalogObjectId`
3. ✅ The `catalog_object_id` in the test payload matches your mapping

### If No Mapping Exists:

The webhook will:
- ✅ Still receive and process successfully
- ✅ Return `200 OK` to Square
- ⚠️ But won't update any products (no mapping found)
- 📝 Log: `"No mapping found for catalog_object_id: ..."`

This is **expected behavior** - you need to create product mappings first!

## Creating Test Product Mappings

For testing purposes, you can manually create a mapping in Firestore Console:

### Collection: `product_mappings`

```json
{
  "localProductId": "your_firestore_product_id",
  "localSku": "LAV-OIL-30ML",
  "squareCatalogObjectId": "FGQ5JJWT2PYTHF35CKZ2DSKP",
  "squareItemVariationId": "FGQ5JJWT2PYTHF35CKZ2DSKP",
  "matchedAt": "2024-01-15T10:00:00Z",
  "matchedBy": "manual",
  "confidence": 1.0
}
```

**Replace:**
- `localProductId` with your actual product ID from Firestore
- `squareCatalogObjectId` with the ID from Square test payload
- `localSku` with your product's SKU

## Testing Shopify Webhooks

### Step 1: Configure Shopify Webhook

1. Go to Shopify Admin → **Settings** → **Notifications**
2. Scroll to **Webhooks**
3. Click **"Create webhook"**
4. Select event type:
   - `Order creation` → `https://stock-pilot-aup48.web.app/api/webhooks/shopify`
   - `Inventory levels update` → `https://stock-pilot-aup48.web.app/api/webhooks/shopify`
5. Format: **JSON**
6. Save and note the **Webhook signing secret**

### Step 2: Add Webhook Secret

Update `.env.local`:

```bash
SHOPIFY_WEBHOOK_SECRET=your_webhook_secret_from_shopify
```

Then redeploy:

```bash
firebase deploy
```

### Step 3: Test

Create a test order in Shopify or manually adjust inventory for a product.

## Troubleshooting

### Issue: "Unauthorized" (401 error)

**Cause:** Signature verification failed

**Solutions:**
1. Check `SQUARE_WEBHOOK_SIGNATURE_KEY` is set correctly
2. Verify you're using the signature key from the correct webhook
3. Ensure you redeployed after adding the key
4. Check environment variables in Firebase Console

### Issue: Webhook received but inventory doesn't update

**Cause:** No product mapping exists

**Solutions:**
1. Check if product mapping exists in Firestore:
   ```
   product_mappings
   WHERE squareCatalogObjectId == "your_catalog_id"
   ```
2. Create mapping manually or use AI matching system
3. Verify the `catalog_object_id` in webhook matches your mapping

### Issue: "Permission denied" errors in logs

**Cause:** Webhooks were using client SDK (already fixed!)

**Solution:** ✅ Already resolved - webhooks now use Admin SDK

### Issue: Can't see logs

**Check logs in:**
1. Firebase Console → Functions → Logs
2. Terminal: `firebase functions:log`
3. Your deployed app's logs viewer

### Issue: Webhook not received at all

**Check:**
1. Webhook URL is correct (must be deployed URL, not localhost)
2. Webhook is active in Square/Shopify dashboard
3. App is deployed: `firebase deploy`
4. No firewall blocking Square/Shopify IPs

## Complete Testing Workflow

### End-to-End Test:

1. **Setup:**
   ```bash
   # 1. Add product to your app
   # Go to Dashboard → Add New Product
   # SKU: LAV-OIL-30ML
   # Shopify: 50, Square: 20
   
   # 2. Create same product in Square
   # With catalog_object_id: ABC123
   
   # 3. Generate AI match or create manual mapping
   # Match Review page → Generate Matches → Approve
   ```

2. **Configure webhook:**
   ```bash
   # In Square Dashboard
   # Add webhook → https://stock-pilot-aup48.web.app/api/webhooks/square
   # Copy signature key
   
   # Add to .env.local
   SQUARE_WEBHOOK_SIGNATURE_KEY=xyz...
   
   # Deploy
   firebase deploy
   ```

3. **Test:**
   ```bash
   # Option A: Square Test Tool
   # Send test event with your catalog_object_id
   
   # Option B: Real change
   # In Square Dashboard → Inventory
   # Change quantity from 20 → 15
   ```

4. **Verify:**
   ```bash
   # Check Firestore Console
   # products/{id}/stock/square should be 15
   
   # Check logs
   firebase functions:log
   # Should see: "Synced inventory for LAV-OIL-30ML from Square to 15"
   ```

## Next Steps

After testing webhooks:

1. ✅ **Set up all three platforms** (Shopify, Square, Amazon)
2. ✅ **Use AI matching** to create product mappings
3. ✅ **Monitor sync dashboard** for discrepancies
4. ✅ **Test with real orders** to verify automatic updates
5. ✅ **Set up monitoring** for webhook failures

## Security Notes

- ✅ All webhooks verify signatures before processing
- ✅ Use environment variables for secrets (never commit)
- ✅ Admin SDK bypasses security rules (server-side only)
- ✅ Webhooks only update products with valid mappings
- ✅ Failed webhooks return appropriate status codes

## Reference

- [Square Webhooks Documentation](https://developer.squareup.com/docs/webhooks/overview)
- [Shopify Webhooks Documentation](https://shopify.dev/docs/api/admin-rest/2024-01/resources/webhook)
- [Amazon Notifications Documentation](https://developer-docs.amazon.com/sp-api/docs/notifications-api-v1-reference)


