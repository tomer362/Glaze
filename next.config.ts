import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Serve AVIF when the browser supports it (falls back to WebP), which
    // meaningfully shrinks the fired-glaze photos over WebP-only.
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      // Google account avatars (from Google OAuth sign-in)
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      // Vercel Blob public URLs (fired-glaze photos)
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
  },
};

export default nextConfig;
