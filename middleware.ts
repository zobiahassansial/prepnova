import NextAuth from "next-auth"
import { authConfig } from "./auth.config"

const { auth } = NextAuth(authConfig)

export default auth(async (req) => {
    const isLoggedIn = !!req.auth
    const { nextUrl } = req

    console.log("[Middleware] Processing request:", nextUrl.pathname, { isLoggedIn });

    const isDashboard = nextUrl.pathname.startsWith('/dashboard')
    const isAuthPage = nextUrl.pathname === '/login' || nextUrl.pathname === '/signup'

    // If authenticated and on auth page, redirect to dashboard
    if (isLoggedIn && isAuthPage) {
        return Response.redirect(new URL('/dashboard', nextUrl))
    }

    // If not authenticated and on dashboard, redirect to login
    if (!isLoggedIn && isDashboard) {
        return Response.redirect(new URL('/login', nextUrl))
    }

    return
})

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
