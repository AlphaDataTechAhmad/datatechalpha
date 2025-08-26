import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current directory.
  const env = loadEnv(mode, process.cwd(), '')
  
  // Debug: Log environment variables
  console.log('VITE_PUBLIC_RAZORPAY_KEY_ID:', env.VITE_PUBLIC_RAZORPAY_KEY_ID ? '***' + env.VITE_PUBLIC_RAZORPAY_KEY_ID.slice(-4) : 'Not found')
  console.log('VITE_RAZORPAY_KEY_SECRET:', env.VITE_RAZORPAY_KEY_SECRET ? '***' + env.VITE_RAZORPAY_KEY_SECRET.slice(-4) : 'Not found')

  // Define environment variables that should be exposed to the client
  const clientEnv = {
    // Appwrite
    'import.meta.env.VITE_APPWRITE_ENDPOINT': JSON.stringify(env.VITE_APPWRITE_ENDPOINT),
    'import.meta.env.VITE_APPWRITE_PROJECT_ID': JSON.stringify(env.VITE_APPWRITE_PROJECT_ID),
    'import.meta.env.VITE_APPWRITE_DATABASE_ID': JSON.stringify(env.VITE_APPWRITE_DATABASE_ID),
    'import.meta.env.VITE_APPWRITE_STUDY_MATERIALS_BUCKET_ID': JSON.stringify(env.VITE_APPWRITE_STUDY_MATERIALS_BUCKET_ID),
    'import.meta.env.VITE_APPWRITE_LIVE_LECTURES_COLLECTION_ID': JSON.stringify(env.VITE_APPWRITE_LIVE_LECTURES_COLLECTION_ID),
    'import.meta.env.VITE_APPWRITE_PAYMENTS_COLLECTION_ID': JSON.stringify(env.VITE_APPWRITE_PAYMENTS_COLLECTION_ID),
    
    // Razorpay
    'import.meta.env.VITE_PUBLIC_RAZORPAY_KEY_ID': JSON.stringify(env.VITE_PUBLIC_RAZORPAY_KEY_ID || env.NEXT_PUBLIC_RAZORPAY_KEY_ID || ''),
    'import.meta.env.VITE_RAZORPAY_KEY_SECRET': JSON.stringify(env.VITE_RAZORPAY_KEY_SECRET || env.RAZORPAY_KEY_SECRET || ''),
    
    // Polyfill for process
    'process.env': {},
    'process.platform': JSON.stringify('browser'),
    'process.browser': true,
    'global': 'window',
  };

  return {
    base: '/',
    define: clientEnv,
    plugins: [react()],
    server: {
      port: 5173,
      strictPort: true,
      host: true, // Listen on all network interfaces
      open: true, // Open browser on server start
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
          ws: true,
          rewrite: (path) => path.replace(/^\/api/, '')
        }
      }
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@components': path.resolve(__dirname, './src/components'),
        '@lib': path.resolve(__dirname, './src/lib'),
        '@utils': path.resolve(__dirname, './src/utils'),
        '@types': path.resolve(__dirname, './src/types'),
        '@hooks': path.resolve(__dirname, './src/hooks'),
        '@services': path.resolve(__dirname, './src/services'),
      }
    },
    optimizeDeps: {
      include: ['pdfjs-dist'],
      esbuildOptions: {
        define: {
          global: 'globalThis',
        },
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (id.includes('pdfjs-dist')) {
              return 'pdfjs';
            }
            return null;
          },
          globals: {
            process: 'process/browser',
            Buffer: 'buffer',
          }
        }
      }
    },
    logLevel: 'info',
    envPrefix: ['VITE_', 'NEXT_PUBLIC_']
  }
})