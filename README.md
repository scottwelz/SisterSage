# Sister Sage Herbs - Inventory Management System

A single-tenant inventory management system built with Next.js, Firebase, and integrations for Shopify, Square, and Amazon with AI-powered product matching.

## Features

- 🔐 Secure Firebase Authentication
- 📦 Product inventory management with Firebase Firestore
- 🖼️ Product image storage with Firebase Storage
- 🛍️ Shopify integration for online store inventory
- 💳 Square integration for POS inventory
- 📦 Amazon SP-API integration for marketplace inventory
- 🤖 **AI-Powered Product Matching** using Google Gemini
  - Intelligent SKU and name matching across platforms
  - Confidence scoring for match suggestions
  - Human-in-the-loop approval workflow
  - Continuous learning from your decisions
- 🔄 Real-time inventory sync between platforms
- 📊 Inventory discrepancy detection
- 📈 Sync history and monitoring dashboard
- 🎨 Modern UI with Tailwind CSS and shadcn/ui

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Firebase project
- Google AI API key (for AI matching)
- Shopify store (optional)
- Square account (optional)
- Amazon Seller account (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd sistersage
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Firebase**
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication (Email/Password)
   - Enable Firestore Database
   - Enable Storage
   - Copy your Firebase config credentials

4. **Configure environment variables**
   
   Create a `.env.local` file in the root directory with the following:
   
   ```bash
   # Firebase Configuration
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

   # Shopify Configuration (optional)
   SHOPIFY_API_KEY=your_shopify_api_key
   SHOPIFY_API_SECRET=your_shopify_api_secret
   SHOPIFY_STORE_URL=your-store.myshopify.com
   SHOPIFY_WEBHOOK_SECRET=your_shopify_webhook_secret

   # Square Configuration (optional)
   SQUARE_ACCESS_TOKEN=your_square_access_token
   SQUARE_LOCATION_ID=your_square_location_id
   SQUARE_WEBHOOK_SIGNATURE_KEY=your_square_webhook_signature_key
   ```

5. **Deploy Firestore rules**
   ```bash
   firebase deploy --only firestore:rules
   ```

6. **Deploy Storage rules**
   ```bash
   firebase deploy --only storage
   ```

7. **Create your admin account**
   
   Run the development server and navigate to the login page. Since this is a single-tenant app, create one account for your business:
   
   ```bash
   npm run dev
   ```
   
   Navigate to `http://localhost:3000/login` and use the "Reset Password" option to set up your account email in Firebase Authentication first, or manually create a user in the Firebase Console.

### Getting API Credentials

#### Shopify

1. Go to your Shopify Admin panel
2. Navigate to **Apps** > **Develop apps** > **Create an app**
3. Configure Admin API scopes (read/write for products and inventory)
4. Install the app and copy the API credentials
5. Set up webhooks for inventory updates

#### Square

1. Go to [Square Developer Dashboard](https://developer.squareup.com/)
2. Create a new application
3. Generate an access token
4. Copy your location ID from the Locations page
5. Set up webhooks for inventory updates

## 🤖 AI Product Matching

The system uses Google Gemini AI to intelligently match your local products with products from Shopify, Square, and Amazon.

### How It Works

1. **Add your products** to the local Firestore database (your source of truth)
2. **Generate matches** - AI analyzes SKU, name, and price to suggest matches
3. **Review suggestions** - Approve or reject matches with confidence scores
4. **AI learns** - The system improves over time based on your decisions
5. **Auto-sync** - Once mapped, inventory syncs automatically across platforms

### Quick Start

```bash
# 1. Navigate to Match Review page
# 2. Click "Generate AI Matches"
# 3. Review and approve suggested matches
# 4. Monitor sync status on Sync dashboard
```

📚 **For detailed instructions**, see [AI_MATCHING_GUIDE.md](./AI_MATCHING_GUIDE.md)

## Project Structure

```
src/
├── ai/               # Genkit AI configuration
├── app/              # Next.js app router pages
│   ├── api/          # API routes
│   │   ├── amazon/   # Amazon SP-API integration
│   │   ├── shopify/  # Shopify integration
│   │   ├── square/   # Square integration
│   │   └── webhooks/ # Webhook handlers
│   ├── dashboard/    # Main inventory dashboard
│   ├── match-review/ # AI match review interface
│   ├── sync/         # Inventory sync dashboard
│   ├── login/        # Authentication page
│   └── layout.tsx    # Root layout
├── components/       # React components
│   └── ui/          # shadcn/ui components
├── context/         # React context providers
├── hooks/           # Custom React hooks
├── lib/             # Utility functions and services
│   ├── ai-matcher.ts       # AI matching logic
│   ├── platform-fetcher.ts # Platform API client
│   ├── sync-service.ts     # Inventory sync service
│   └── product-service.ts  # Product CRUD operations
└── types/           # TypeScript type definitions
```

## Deployment

This app is designed to work with Firebase App Hosting or any Next.js hosting platform (Vercel, etc.).

### Firebase App Hosting

```bash
firebase deploy
```

### Vercel

```bash
npm run build
vercel deploy
```

Make sure to set all environment variables in your hosting platform's settings.

## Security Notes

- This is a **single-tenant application** - all authenticated users have full access
- API credentials are stored securely in environment variables, not in the database
- Never commit your `.env.local` file to version control
- Use Firebase Authentication to protect your data
- Consider adding deployment-level protection (password protection, IP allowlisting, etc.)

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

## License

MIT
