import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// Without nonces: they don't work with the static shells from cacheComponents.
// The dev server needs 'unsafe-eval' for hot reload.
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""};
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data:;
  font-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`;

const nextConfig: NextConfig = {
  cacheComponents: true,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: cspHeader.replace(/\s{2,}/g, " ").trim(),
          },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
    ];
  },
  // The notes app moved from /notes to /workspace. Old links keep working.
  async redirects() {
    return [
      { source: "/notes", destination: "/workspace", permanent: false },
      { source: "/notes/:id", destination: "/workspace/:id", permanent: false },
    ];
  },
};

export default nextConfig;
