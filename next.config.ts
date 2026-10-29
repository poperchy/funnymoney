import type { NextConfig } from "next";

// GitHub Pages serves the site from /<repo>; CI sets this. Locally it's empty and the app lives at the root.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  // The app is fully client-side (state lives in localStorage), so it ships as static files.
  output: "export",
  basePath,
  // /app → /app/index.html, which static hosts like GitHub Pages serve without rewrites.
  trailingSlash: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
