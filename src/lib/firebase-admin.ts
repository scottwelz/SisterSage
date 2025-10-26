import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

let app: App;

// Initialize Firebase Admin SDK (server-side only)
if (!getApps().length) {
    try {
        // Check if we have a service account key in environment variables
        const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

        if (serviceAccountKey) {
            // Parse the service account key JSON
            const serviceAccount = JSON.parse(serviceAccountKey);

            app = initializeApp({
                credential: cert(serviceAccount),
                projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            });

            console.log('Firebase Admin initialized with service account credentials');
        } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
            // Use GOOGLE_APPLICATION_CREDENTIALS path
            app = initializeApp({
                projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            });

            console.log('Firebase Admin initialized with GOOGLE_APPLICATION_CREDENTIALS');
        } else {
            // Try Application Default Credentials (works on Firebase Hosting, Cloud Run, etc.)
            app = initializeApp({
                projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            });

            console.log('Firebase Admin initialized with Application Default Credentials');
        }
    } catch (error) {
        console.error('Error initializing Firebase Admin:', error);
        console.error('Please set FIREBASE_SERVICE_ACCOUNT_KEY in your .env.local file');
        throw error;
    }
} else {
    app = getApps()[0];
}

// Get Firestore instance with admin privileges
export const adminDb = getFirestore(app);

// Export the app if needed
export { app as adminApp };

