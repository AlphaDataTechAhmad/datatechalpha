/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['localhost'], // Add your image domains here
  },
  webpack: (config) => {
    // This makes the 'process' variable available in the browser
    config.resolve.fallback = { 
      ...config.resolve.fallback,
      fs: false, // Don't include fs module in the browser
      path: false, // Don't include path module in the browser
      os: false, // Don't include os module in the browser
      process: false, // Use the built-in process polyfill
    };
    return config;
  },
  env: {
    // Define any environment variables you need
  },
};

module.exports = nextConfig;
