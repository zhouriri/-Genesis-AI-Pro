import type { NextConfig } from "next";

const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  workboxOptions: {
    disableDevLogs: true,
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/api\.coingecko\.com\/.*/i,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'coingecko-api',
          expiration: {
            maxEntries: 10,
            maxAgeSeconds: 60, // 缓存60秒
          },
        },
      },
      {
        urlPattern: /^https:\/\/api\.binance\.com\/.*/i,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'binance-api',
          expiration: {
            maxEntries: 10,
            maxAgeSeconds: 30, // 缓存30秒
          },
        },
      },
      {
        urlPattern: /\.(?:png|jpg|jpeg|gif|webp|svg)$/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'images',
          expiration: {
            maxEntries: 60,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30天
          },
        },
      },
      {
        urlPattern: /\.(?:js|css)$/i,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'static-resources',
        },
      },
    ],
  },
});

const nextConfig: NextConfig = {
  devIndicators: false,
  reactStrictMode: true,
  output: 'standalone',
  experimental: {
    scrollRestoration: true,
    ppr: true,
  },
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        {
          key: 'X-DNS-Prefetch-Control',
          value: 'on',
        },
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=31536000; includeSubDomains; preload',
        },
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin',
        },
      ],
    },
  ],
};

module.exports = process.env.NODE_ENV === 'production' ? withPWA(nextConfig) : nextConfig;
