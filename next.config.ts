import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async headers() {
    const development = process.env.NODE_ENV === 'development';
    // Inline Next hydration and RainbowKit styles remain supported. No production eval.
    const csp = [
      "default-src 'self'", "object-src 'none'", "base-uri 'self'", "frame-ancestors 'self'", "form-action 'self'",
      `script-src 'self' 'unsafe-inline'${development ? " 'unsafe-eval'" : ''}`,
      "style-src 'self' 'unsafe-inline'", "font-src 'self' data:",
      "img-src 'self' https: data: blob:",
      `connect-src 'self' https: wss:${development ? ' http://localhost:* ws://localhost:*' : ''}`,
      `frame-src https:${development ? ' http://localhost:*' : ''}`,
    ].join('; ');
    return [{ source: '/:path*', headers: [
      { key: 'Content-Security-Policy', value: csp },
      { key: 'Referrer-Policy', value: 'no-referrer' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
    ] }];
  },
  webpack: (config) => {
    config.externals.push("pino-pretty", "lokijs", "encoding");
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      "@react-native-async-storage/async-storage": false,
    };
    // Wallet connectors use the browser SDK, including while prerendering the UI.
    // Its node entry imports unrelated server payment dependencies.
    config.resolve.alias = config.resolve.alias || {};
    config.resolve.alias["@base-org/account$"] = "@base-org/account/browser";
    return config;
  },
};

export default nextConfig;
