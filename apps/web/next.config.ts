import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Paquets du monorepo publiés en TypeScript source.
  transpilePackages: ["@educationplus/shared", "@educationplus/db", "@educationplus/ui-tokens"],
  serverExternalPackages: ["pg"],
};

export default nextConfig;
