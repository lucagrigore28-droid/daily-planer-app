
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  serverExternalPackages: ['sharp'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  env: {
    NEXT_PUBLIC_VAPID_KEY: process.env.NEXT_PUBLIC_VAPID_KEY,
    NEXT_PUBLIC_FIREBASE_API_KEY: "AIzaSyCcD3JASDRZYeRnGSEakgF8-yKRmSpyYJw",
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: "studio-524597312-3104b",
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: "451317985684",
    NEXT_PUBLIC_FIREBASE_APP_ID: "1:451317985684:web:5f70b71ee8dab7346b5f81"
  }
};

export default nextConfig;
