import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

let app: App;

// Initialize Firebase Admin SDK (server-side only)
if (!getApps().length) {
    try {
        // This single call handles both production and local development:
        // 1. Production (App Hosting): It automatically finds the 
        //    GOOGLE_APPLICATION_CREDENTIALS environment variable 
        //    you set in apphosting.yaml.
        // 2. Local Development: It finds the GOOGLE_APPLICATION_CREDENTIALS
        //    environment variable if you set it in your terminal.
        app = initializeApp({
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        });

        console.log('Firebase Admin initialized with Application Default Credentials');

    } catch (error) {
        console.error('Error initializing Firebase Admin:', error);
        console.error('----------------------------------------------------');
        console.error('ERROR: Could not initialize Firebase Admin.');
        console.error('For local development (npm run dev), make sure you have');
        console.error('set the GOOGLE_APPLICATION_CREDENTIALS environment');
        console.error('variable in your terminal before running the app.');
        console.error('\nExample:');
        console.error('export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/service-account-key.json"');
        console.error('npm run dev');
        console.error('----------------------------------------------------');
        throw error;
    }
} else {
    // Reuse the existing app instance
    app = getApps()[0];
}

// Get Firestore instance with admin privileges
export const adminDb = getFirestore(app);

// Export the app if needed
export { app as adminApp };
