import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async headers() {
    // Define headers for all environments
    const headers = [
      {
        key: "X-Content-Type-Options",
        value: "nosniff",
      },
      {
        key: "X-Frame-Options",
        value: "DENY",
      },
      {
        key: "Referrer-Policy",
        value: "strict-origin-when-cross-origin",
      },
    ];

    // Security headers (COOP/COEP/CSP) can break dev tools (Fast Refresh) and local popups.
    // We strictly apply them in production or when not in development.
    if (process.env.NODE_ENV !== 'development') {
      headers.push(
        {
          key: "Cross-Origin-Opener-Policy",
          value: "same-origin-allow-popups",
        },
        {
          key: "Cross-Origin-Embedder-Policy",
          value: "unsafe-none",
        },
        {
          key: "Content-Security-Policy",
          value: `
                    default-src 'self';
                    script-src 'self' 'unsafe-inline' https://apis.google.com https://www.gstatic.com https://www.google.com https://www.googletagmanager.com;
                    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
                    font-src 'self' https://fonts.gstatic.com;
                    img-src 'self' data: https://lh3.googleusercontent.com https://www.google.com;
                    connect-src 'self' https://securetoken.googleapis.com https://identitytoolkit.googleapis.com https://firestore.googleapis.com https://www.googleapis.com;
                    frame-src 'self' https://*.firebase.google.com https://accounts.google.com;
                    object-src 'none';
                    base-uri 'self';
                `.replace(/\s{2,}/g, ' ').trim()
        }
      );
    }

    return [
      {
        source: "/:path*",
        headers,
      },
    ];
  },
};

export default nextConfig;
