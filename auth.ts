import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { verifyIdToken } from "@/lib/firebase-admin"
import { authConfig } from "./auth.config"

export const { handlers, signIn, signOut, auth } = NextAuth({
    ...authConfig,
    providers: [
        Credentials({
            credentials: {
                idToken: { label: "ID Token", type: "text" },
            },
            authorize: async (credentials) => {
                const idToken = credentials.idToken as string;
                console.log("[Auth] Authorize called with ID token length:", idToken?.length);
                try {
                    const decodedToken = await verifyIdToken(idToken);
                    console.log("[Auth] Token verified successfully for user:", decodedToken?.uid);
                    return {
                        id: decodedToken.uid,
                        email: decodedToken.email,
                        image: decodedToken.picture,
                        name: decodedToken.name || decodedToken.email?.split("@")[0],
                    };
                } catch (error) {
                    console.error("[Auth] Error verifying ID token:", error);
                    return null;
                }
            },
        }),
    ],
    session: {
        strategy: "jwt",
    },
});
