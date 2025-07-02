import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// IMPORTANT:
// 1. Create a new Firebase project at https://console.firebase.google.com/
// 2. In your project, go to Project Settings > General.
// 3. Scroll down to "Your apps" and click the Web icon (</>) to create a new web app.
// 4. Give your app a name and click "Register app".
// 5. Firebase will provide you with a `firebaseConfig` object.
// 6. Copy the values from that object and paste them into the placeholders below.

const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "YOUR_AUTH_DOMAIN_HERE",
  projectId: "YOUR_PROJECT_ID_HERE",
  storageBucket: "YOUR_STORAGE_BUCKET_HERE",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID_HERE",
  appId: "YOUR_APP_ID_HERE",
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

export { app, auth };
