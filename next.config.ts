import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  // The notes app moved from /notes to /workspace. Old links keep working.
  async redirects() {
    return [
      { source: "/notes", destination: "/workspace", permanent: false },
      { source: "/notes/:id", destination: "/workspace/:id", permanent: false },
    ];
  },
};

export default nextConfig;
