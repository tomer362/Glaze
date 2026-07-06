import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Google account avatars (from Google OAuth sign-in)
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      // Vercel Blob public URLs (fired-glaze photos)
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
  },
};

export default nextConfig;
