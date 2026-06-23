import NextAuth from "next-auth"
import { authConfig } from "./auth.config"
import { NextResponse } from "next/server"

const { auth } = NextAuth(authConfig)

export default auth(async (req) => {
    const isLoggedIn = !!req.auth
    const { nextUrl } = req

    if (process.env.NODE_ENV === 'development') {
        console.log("[Middleware] Processing request:", nextUrl.pathname, { isLoggedIn })
    }

    const isDashboard = nextUrl.pathname.startsWith('/dashboard')
    const isAuthPage = nextUrl.pathname === '/login' || nextUrl.pathname === '/signup'

    if (isLoggedIn && isAuthPage) {
        return NextResponse.redirect(new URL('/dashboard', nextUrl))
    }

    if (!isLoggedIn && isDashboard) {
        return NextResponse.redirect(new URL('/login', nextUrl))
    }

    // Generate a per-request CSP nonce for page routes in production.
    // API routes and static assets are excluded — they don't render HTML.
    const isStaticOrApi =
        nextUrl.pathname.startsWith('/api') ||
        nextUrl.pathname.startsWith('/_next')

    if (process.env.NODE_ENV !== 'development' && !isStaticOrApi) {
        // crypto.randomUUID() is a Web Crypto global available in the Edge Runtime.
        // Buffer is also available as a global in Next.js middleware.
        const nonce = Buffer.from(globalThis.crypto.randomUUID()).toString('base64')

        const csp = [
            "default-src 'self'",
            // 'strict-dynamic' lets nonce-trusted scripts load further scripts,
            // which is required by Next.js runtime chunks.
            `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://apis.google.com https://www.gstatic.com https://www.google.com https://www.googletagmanager.com`,
            // style-src keeps unsafe-inline because CSS-in-JS (Tailwind, shadcn) injects styles at runtime.
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com",
            "img-src 'self' data: blob: https://lh3.googleusercontent.com https://www.google.com https://firebasestorage.googleapis.com",
            [
                "connect-src 'self'",
                "https://securetoken.googleapis.com",
                "https://identitytoolkit.googleapis.com",
                "https://firestore.googleapis.com",
                "https://www.googleapis.com",
                "https://*.firebasestorage.googleapis.com",
                "https://sandbox.api.getsafepay.com",
                "https://api.getsafepay.com",
            ].join(' '),
            "frame-src 'self' https://*.firebase.google.com https://accounts.google.com https://sandbox.api.getsafepay.com https://api.getsafepay.com",
            "object-src 'none'",
            "base-uri 'self'",
        ].join('; ')

        // Attach nonce to request so server components can read it via headers().
        const requestHeaders = new Headers(req.headers)
        requestHeaders.set('x-nonce', nonce)

        const response = NextResponse.next({ request: { headers: requestHeaders } })
        response.headers.set('Content-Security-Policy', csp)
        return response
    }

    return NextResponse.next()
})

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
