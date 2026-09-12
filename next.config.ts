import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.externals.push("pino-pretty", "lokijs", "encoding");
    config.resolve.fallback = { fs: false, net: false, tls: false };
    // Wallet connectors use the browser SDK, including while prerendering the UI.
    // Its node entry imports unrelated server payment dependencies.
    config.resolve.alias = config.resolve.alias || {};
    config.resolve.alias["@base-org/account$"] = "@base-org/account/browser";
    return config;
  },
};

export default nextConfig;
