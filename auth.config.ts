import type { NextAuthConfig } from "next-auth"

export const authConfig = {
    pages: {
        signIn: "/login",
    },
    callbacks: {
        authorized() {
            return true
        },
        async jwt({ token, user }) {
            console.log("[Auth] JWT Callback", { token: token?.sub, user: user?.id });
            if (user) {
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            console.log("[Auth] Session Callback", { sessionUser: session?.user?.email, tokenId: token?.id });
            if (session.user) {
                session.user.id = token.id as string;
            }
            return session;
        },
    },
    providers: [], // Providers preventing Edge compatibility are added in auth.ts
} satisfies NextAuthConfig
