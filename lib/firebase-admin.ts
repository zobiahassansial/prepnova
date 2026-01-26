import "server-only";
import admin from "firebase-admin";

function formatPrivateKey(key: string | undefined) {
    return key?.replace(/\\n/g, "\n");
}

export async function verifyIdToken(token: string) {
    if (!admin.apps.length) {
        if (!process.env.FIREBASE_PRIVATE_KEY) {
            // In build environment, this might be missing. We shouldn't crash top-level.
            // But if we are called, we must fail.
            throw new Error("Missing FIREBASE_PRIVATE_KEY");
        }

        console.log("[Firebase Admin] Initializing...", {
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
            privateKeyLength: process.env.FIREBASE_PRIVATE_KEY?.length
        });

        try {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    privateKey: formatPrivateKey(process.env.FIREBASE_PRIVATE_KEY),
                }),
                storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
            });
            console.log("[Firebase Admin] Initialization successful");
        } catch (error) {
            console.error("[Firebase Admin] Initialization FAILED:", error);
            throw error;
        }
    }

    return admin.auth().verifyIdToken(token);
}
