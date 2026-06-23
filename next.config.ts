import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    // Static security headers applied to every response.
    // The Content-Security-Policy (with per-request nonce) is set by middleware.ts
    // for page routes; it is not duplicated here to avoid a nonce mismatch.
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // COOP allows Firebase Auth / SafePay popups while keeping
          // cross-origin isolation benefits for same-origin navigation.
          ...(process.env.NODE_ENV !== 'development'
            ? [
                { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
                { key: "Cross-Origin-Embedder-Policy", value: "unsafe-none" },
              ]
            : []),
        ],
      },
    ]
  },
}

export default nextConfig;
