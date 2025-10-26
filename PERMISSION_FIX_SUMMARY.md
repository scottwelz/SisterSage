# Firebase Permission Error Fix

## Problem

API routes were failing with Firebase permission errors:
```
Error [FirebaseError]: Missing or insufficient permissions.
code: 'permission-denied'
```

### Root Causes

1. **API routes run server-side without user authentication** - They don't have `request.auth` context
2. **Firestore rules required authentication** - `allow read, write: if request.auth != null`
3. **New collections weren't in security rules** - `product_mappings`, `match_suggestions`, `match_training`, `sync_logs` were blocked

## Solution

### 1. Installed Firebase Admin SDK

```bash
npm install firebase-admin
```

The Admin SDK has **admin privileges** and bypasses security rules when running server-side.

### 2. Created Admin SDK Configuration

**File: `src/lib/firebase-admin.ts`**

- Initializes Firebase Admin SDK for server-side use
- Uses `NEXT_PUBLIC_FIREBASE_PROJECT_ID` for authentication
- Exports `adminDb` for Firestore access with admin privileges

**Key Benefits:**
- ✅ Bypasses security rules (server-side only)
- ✅ No user authentication required
- ✅ Works in API routes and Server Components
- ✅ Automatic authentication in production (Application Default Credentials)

### 3. Updated Firestore Security Rules

**File: `firestore.rules`**

Added rules for new collections:
```javascript
// Product mappings (AI matching system)
match /product_mappings/{mappingId} {
  allow read, write: if request.auth != null;
}

// Match suggestions (AI-generated)
match /match_suggestions/{suggestionId} {
  allow read, write: if request.auth != null;
}

// Match training data (AI learning)
match /match_training/{trainingId} {
  allow read, write: if request.auth != null;
}

// Sync logs (inventory sync history)
match /sync_logs/{logId} {
  allow read, write: if request.auth != null;
}
```

**Deployed:** ✅ `firebase deploy --only firestore:rules`

### 4. Updated API Routes to Use Admin SDK

All API routes now use `adminDb` instead of the client SDK:

**Updated Files:**
1. **`src/app/api/sync/detect/route.ts`**
   - Replaced `ProductService.getAllProducts()` with `adminDb.collection('products').get()`
   - Uses Admin SDK for all Firestore access
   - Implements discrepancy detection directly

2. **`src/app/api/sync/logs/route.ts`**
   - Replaced `SyncService.getRecentLogs()` with direct Admin SDK query
   - Orders and limits logs server-side

3. **`src/app/api/sync/run/route.ts`**
   - Replaced `SyncService.syncFromPlatforms()` with Admin SDK implementation
   - Fetches products, mappings, and updates using `adminDb`
   - Saves sync logs using `FieldValue.serverTimestamp()`

4. **`src/app/api/matches/generate/route.ts`**
   - Replaced `ProductService.getAllProducts()` with Admin SDK query
   - Saves match suggestions using `adminDb.collection('match_suggestions').add()`

## Architecture

### Before (❌ Failed)
```
API Route → ProductService → Client SDK → Firestore
                                            ↓
                                    ❌ Permission Denied
                                    (No request.auth)
```

### After (✅ Works)
```
API Route → Admin SDK → Firestore
                           ↓
                    ✅ Admin Access
                    (Bypasses rules)
```

## Key Differences: Client SDK vs Admin SDK

| Feature | Client SDK (`firebase`) | Admin SDK (`firebase-admin`) |
|---------|------------------------|------------------------------|
| **Use Case** | Browser, Client Components | API Routes, Server Components |
| **Authentication** | User login required | Admin privileges |
| **Security Rules** | Must pass rules | Bypasses rules |
| **Environment** | Client-side | Server-side only |
| **Access Level** | Limited to user permissions | Full database access |

## When to Use Each

### Use Client SDK (`src/lib/firebase.ts`)
- ✅ Client Components (`'use client'`)
- ✅ User authentication flows
- ✅ Direct browser-to-Firestore access
- ✅ Real-time listeners in UI
- ✅ When security rules provide protection

### Use Admin SDK (`src/lib/firebase-admin.ts`)
- ✅ API Routes
- ✅ Server Components
- ✅ Background jobs
- ✅ Admin operations
- ✅ When bypassing rules is needed

## Important Notes

1. **Admin SDK is server-only** - Never import in client components
2. **No new environment variables needed** - Uses existing `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
3. **Production auto-authenticates** - Uses Application Default Credentials in Firebase App Hosting
4. **Security rules still protect client access** - Only server-side code has admin access

## Testing

After these changes:
- ✅ API routes work without authentication errors
- ✅ Match generation succeeds
- ✅ Sync operations complete successfully
- ✅ Logs are retrieved and saved
- ✅ Discrepancy detection works

## Files Changed

### New Files (1)
- `src/lib/firebase-admin.ts` - Firebase Admin SDK configuration

### Modified Files (5)
- `firestore.rules` - Added rules for new collections
- `src/app/api/sync/detect/route.ts` - Use Admin SDK
- `src/app/api/sync/logs/route.ts` - Use Admin SDK
- `src/app/api/sync/run/route.ts` - Use Admin SDK
- `src/app/api/matches/generate/route.ts` - Use Admin SDK

### Deployed
- ✅ Firestore security rules deployed to production

## Prevention

To avoid similar issues:

1. **Always use Admin SDK in API routes** - Never use client SDK for server-side operations
2. **Update security rules** - Add rules for any new collections
3. **Test API routes** - Verify they work without user authentication
4. **Check terminal output** - Look for Firebase permission errors

## References

- [Firebase Admin SDK Documentation](https://firebase.google.com/docs/admin/setup)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)


