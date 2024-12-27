import nextPWA from 'next-pwa';

/** @type {import('next').NextConfig} */
const nextConfig = nextPWA({
  dest: 'public', // ไฟล์ Service Worker จะถูกสร้างใน public
  register: true, // ลงทะเบียน Service Worker โดยอัตโนมัติ
  skipWaiting: true, // ข้าม Waiting State และบังคับให้ SW ใหม่ใช้งานได้ทันที
  disable: process.env.NODE_ENV === 'development', // ปิด PWA ในโหมด Development
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/example\.com\/.*$/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 3600,
        },
      },
    },
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|ico)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'image-cache',
        expiration: {
          maxEntries: 20,
          maxAgeSeconds: 86400,
        },
      },
    },
  ],
})({
  env: {
    DATABASE: process.env.DATABASE,
    WEB_AUTH_CLIENT_ID: process.env.WEB_AUTH_CLIENT_ID,
    NEXT_PUBLIC_GEMINI_API_KEY: process.env.NEXT_PUBLIC_GEMINI_API_KEY,
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*',
        port: '',
        pathname: '/**',
      },
    ],
  },
});

export default nextConfig;