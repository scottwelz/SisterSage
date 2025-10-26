# Setup Guide - Sister Sage Herbs Inventory

This guide will help you set up your single-tenant inventory management system from scratch.

## 🎯 Overview

This is a **single-tenant application**, meaning:
- One business account
- One admin login
- API credentials stored in environment variables (more secure)
- All authenticated users have full access to inventory

## 📋 Prerequisites Checklist

- [ ] Node.js 18+ installed
- [ ] Firebase account created
- [ ] (Optional) Shopify store with admin access
- [ ] (Optional) Square account with developer access

## 🚀 Step-by-Step Setup

### 1. Firebase Project Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** or **"Create a project"**
3. Follow the wizard:
   - Enter project name (e.g., "sister-sage-inventory")
   - Enable/disable Google Analytics (optional)
   - Click **"Create project"**

### 2. Enable Firebase Authentication

1. In your Firebase project, click **"Authentication"** in the left menu
2. Click **"Get started"**
3. Select **"Email/Password"** as a sign-in method
4. Toggle **"Email/Password"** to **Enabled**
5. Click **"Save"**

### 3. Enable Firestore Database

1. Click **"Firestore Database"** in the left menu
2. Click **"Create database"**
3. Choose **"Start in production mode"** (we'll deploy custom rules)
4. Select a location close to your users
5. Click **"Enable"**

### 4. Enable Firebase Storage

1. Click **"Storage"** in the left menu
2. Click **"Get started"**
3. Accept the default security rules (we'll deploy custom rules)
4. Select the same location as your Firestore
5. Click **"Done"**

### 5. Get Firebase Config Credentials

1. In Firebase Console, click the **gear icon** ⚙️ next to "Project Overview"
2. Select **"Project settings"**
3. Scroll down to **"Your apps"**
4. Click the **web icon** `</>` to create a web app
5. Enter app nickname (e.g., "Sister Sage Web")
6. Click **"Register app"**
7. Copy the `firebaseConfig` object values - you'll need these for `.env.local`

### 6. Create Your Admin Account

**Option A: Using Firebase Console (Recommended)**
1. In Firebase Console, go to **"Authentication"** > **"Users"**
2. Click **"Add user"**
3. Enter your email and create a strong password
4. Click **"Add user"**

**Option B: Using the App**
1. Temporarily restore the signup page
2. Create your account through the app
3. Delete the signup page again

### 7. Configure Environment Variables

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your Firebase credentials from step 5:
   ```bash
   NEXT_PUBLIC_FIREBASE_API_KEY=your_key_here
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain_here
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket_here
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

### 8. (Optional) Configure Shopify Integration

#### Get Shopify Credentials

1. Log in to your Shopify Admin panel
2. Go to **"Apps"** > **"App and sales channel settings"**
3. Click **"Develop apps"** (at the bottom)
4. If prompted, click **"Allow custom app development"**
5. Click **"Create an app"**
6. Enter app name (e.g., "Sister Sage Inventory")
7. Click **"Create app"**

#### Configure API Scopes

1. Click **"Configure Admin API scopes"**
2. Select these scopes:
   - `read_products`
   - `write_products`
   - `read_inventory`
   - `write_inventory`
3. Click **"Save"**

#### Install and Get Credentials

1. Click **"Install app"**
2. Click **"Install"**
3. Copy the **Admin API access token** (shown once!)
4. Also note your store URL (e.g., `your-store.myshopify.com`)

#### Add to .env.local

```bash
SHOPIFY_API_KEY=your_admin_api_access_token
SHOPIFY_API_SECRET=your_api_secret_key
SHOPIFY_STORE_URL=your-store.myshopify.com
```

### 9. (Optional) Configure Square Integration

#### Get Square Credentials

1. Go to [Square Developer Dashboard](https://developer.squareup.com/)
2. Sign in with your Square account
3. Click **"Create your first application"** or **"+ Create App"**
4. Enter application name (e.g., "Sister Sage Inventory")
5. Click **"Create Application"**

#### Get Access Token

1. In your app dashboard, go to **"Credentials"**
2. Choose **"Sandbox"** (for testing) or **"Production"**
3. Copy the **Access Token**
4. ⚠️ **For production**: Click **"Generate Production Access Token"** and store it securely

#### Get Location ID

1. In your app dashboard, go to **"Locations"**
2. Copy the **Location ID** for your store location

#### Add to .env.local

```bash
SQUARE_ACCESS_TOKEN=your_access_token
SQUARE_LOCATION_ID=your_location_id
```

### 10. Configure AI Matching (Required for Product Matching)

The AI product matching system uses Google's Gemini AI to intelligently match products across platforms.

#### Get Google AI API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Copy the API key

#### Add to .env.local

```bash
GOOGLE_GENAI_API_KEY=your_google_ai_api_key_here
```

⚠️ **Important:** The AI matching features won't work without this API key.

### 11. Install Dependencies and Deploy Rules

1. Install project dependencies:
   ```bash
   npm install
   ```
   
   This includes:
   - Firebase Client SDK (for browser/UI)
   - Firebase Admin SDK (for API routes/server-side)
   - Genkit AI (for product matching)
   - Next.js and React
   - UI components (shadcn/ui)

2. Install Firebase CLI globally (if not already installed):
   ```bash
   npm install -g firebase-tools
   ```

3. Login to Firebase:
   ```bash
   firebase login
   ```

4. Initialize Firebase in your project (if `.firebaserc` doesn't exist):
   ```bash
   firebase init
   ```
   - Select your project
   - Don't overwrite existing files

5. Deploy Firestore and Storage security rules:
   ```bash
   firebase deploy --only firestore:rules,storage
   ```

### 12. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 13. First Login

1. Navigate to `http://localhost:3000/login`
2. Enter the email and password you created in step 6
3. You should be redirected to the dashboard!

## 🔒 Security Best Practices

1. **Never commit `.env.local`** to version control (it's already in .gitignore)
2. **Use strong passwords** for your Firebase admin account
3. **Enable 2FA** on your Firebase account
4. **Rotate API keys** regularly (Shopify and Square)
5. **Use production tokens** only in production deployments
6. **Monitor Firebase Console** for unusual activity

## 🚢 Deployment

### Deploy to Firebase App Hosting

```bash
firebase deploy
```

Make sure to set environment variables in Firebase Console:
1. Go to **"Hosting"** > **"App Hosting"**
2. Select your app
3. Go to **"Environment Variables"**
4. Add all your environment variables from `.env.local`

### Deploy to Vercel

1. Push your code to GitHub
2. Import project in [Vercel Dashboard](https://vercel.com)
3. Add environment variables in project settings
4. Deploy!

## 🐛 Troubleshooting

### "Firebase credentials not configured"
- Check that `.env.local` exists and has all required Firebase variables
- Restart your development server after adding environment variables

### "Shopify/Square credentials not configured"
- Ensure API keys are properly set in `.env.local`
- Verify the keys are correct (no extra spaces)
- Check that the keys have proper permissions/scopes

### "Permission denied" in Firestore
- Ensure you're logged in
- Deploy the security rules: `firebase deploy --only firestore:rules`
- Check Firebase Console > Firestore > Rules

### Can't log in
- Verify the user exists in Firebase Console > Authentication > Users
- Try password reset at `/reset-password`
- Check browser console for error messages

## 📞 Need Help?

- Check the [Firebase Documentation](https://firebase.google.com/docs)
- Review [Shopify API Docs](https://shopify.dev/api)
- Read [Square API Docs](https://developer.squareup.com/docs)

## 🤖 Using AI Product Matching

Once you have products in your system and platform credentials configured:

### Step 1: Add Your Products

1. Navigate to the **Dashboard** (`/dashboard`)
2. Add all your herbal products with:
   - Clear, consistent SKUs (e.g., `LAV-OIL-30ML`)
   - Descriptive names
   - Accurate prices

💡 **Tip:** Add all products to your local inventory before matching with platforms.

### Step 2: Generate Matches

1. Go to **Match Review** page (`/match-review`)
2. Click **"Generate AI Matches"**
3. The AI will:
   - Fetch products from all configured platforms
   - Analyze SKU, name, and price similarities
   - Create match suggestions with confidence scores

### Step 3: Review and Approve

1. Review suggestions organized by platform (Shopify, Square, Amazon)
2. Each suggestion shows:
   - Your local product (left)
   - Platform product (right)
   - AI confidence score
   - Reasoning for the match
3. **Approve** good matches or **Reject** incorrect ones
4. The AI learns from your decisions!

### Step 4: Monitor Sync

1. Go to **Sync** page (`/sync`)
2. Click **"Sync from Platforms"** to:
   - Pull current inventory from all platforms
   - Update your local database
   - Detect discrepancies
3. Review sync logs and address any issues

📚 **For detailed information**, see [AI_MATCHING_GUIDE.md](./AI_MATCHING_GUIDE.md)

## ✅ Post-Setup Checklist

- [ ] Firebase project created and configured
- [ ] Authentication enabled with admin account created
- [ ] Firestore and Storage enabled
- [ ] `.env.local` file created and populated
- [ ] Security rules deployed
- [ ] Can log in successfully
- [ ] Google AI API key configured
- [ ] Shopify integration configured (if applicable)
- [ ] Square integration configured (if applicable)
- [ ] Amazon integration configured (if applicable)
- [ ] Initial products added to inventory
- [ ] AI product matching tested
- [ ] App deployed to hosting platform

🎉 **You're all set!** Start managing your inventory across all platforms!

