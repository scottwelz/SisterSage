# Firebase Admin SDK Setup

## The Issue

You're seeing this error:
```
Error: Could not load the default credentials
```

This happens because the Firebase Admin SDK (used for server-side operations) needs authentication credentials.

---

## Quick Fix (2 Minutes)

### Step 1: Get Your Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **stock-pilot-aup48**
3. Click the **gear icon** ⚙️ (Settings) → **Project settings**
4. Navigate to the **Service accounts** tab
5. Click **"Generate new private key"**
6. Click **"Generate key"** in the popup
7. A JSON file will download (e.g., `stock-pilot-aup48-firebase-adminsdk-xxxxx.json`)

### Step 2: Add to .env.local

You have **two options**:

#### Option A: Environment Variable (Recommended for Development)

1. Open the downloaded JSON file
2. Copy the ENTIRE contents
3. Minify it to a single line (remove all newlines)
4. Add to `.env.local`:

```bash
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"stock-pilot-aup48",...}'
```

**Important:** The entire JSON must be on ONE LINE and wrapped in single quotes.

#### Option B: File Path (Alternative)

1. Move the downloaded JSON file to your project root (don't commit it!)
2. Add to `.env.local`:

```bash
GOOGLE_APPLICATION_CREDENTIALS=./stock-pilot-aup48-firebase-adminsdk-xxxxx.json
```

3. Add to `.gitignore`:

```
# Firebase service account keys
*-firebase-adminsdk-*.json
```

### Step 3: Restart Your Dev Server

```bash
# Stop the server (Ctrl+C)
# Start it again
npm run dev
```

---

## Verification

After restarting, you should see in your terminal:
```
Firebase Admin initialized with service account credentials
```

And the `/locations` page should load successfully!

---

## For Production (Firebase Hosting/Cloud Run)

When you deploy to Firebase Hosting or Cloud Run, the service account is automatically available through Application Default Credentials. No configuration needed!

---

## Security Notes

⚠️ **NEVER commit service account keys to Git!**

The `.gitignore` already excludes:
- `.env.local`
- `*-firebase-adminsdk-*.json`

Make sure these stay excluded!

---

## Troubleshooting

### Still getting errors?

1. **Check the JSON is valid:**
   ```bash
   # In your .env.local, the JSON should start with:
   FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'
   ```

2. **Check for newlines:**
   The JSON must be on ONE LINE. No line breaks!

3. **Check for proper quotes:**
   Use single quotes around the JSON: `'{ ... }'`

4. **Verify project ID matches:**
   ```bash
   # In .env.local, these should match:
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=stock-pilot-aup48
   FIREBASE_SERVICE_ACCOUNT_KEY='{"project_id":"stock-pilot-aup48",...}'
   ```

### Need to regenerate?

You can generate multiple service account keys. Old ones remain valid unless you explicitly revoke them in the Firebase Console.

---

## What This Enables

With Firebase Admin SDK configured, you can now:

✅ Create and manage locations
✅ Record inventory transactions
✅ Create bundles
✅ Use all the server-side features
✅ Process webhooks from Square/Shopify

---

**Once configured, everything will work perfectly!** 🚀



