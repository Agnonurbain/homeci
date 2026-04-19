/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      filename: 'dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  build: {
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        manualChunks: {
          // Heavy libraries — split into separate chunks
          recharts: ['recharts'],
          leaflet: ['leaflet', 'react-leaflet'],
          // Firebase — Auth, Firestore, Storage
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
          // Firebase features
          firebaseMessaging: ['firebase/messaging'],
          // UI libraries
          lucide: ['lucide-react'],
          // Monitoring
          sentry: ['@sentry/react'],
          // Forms & validation
          zod: ['zod'],
          // Router
          router: ['react-router-dom'],
          // React core
          reactCore: ['react', 'react-dom'],
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      reporter: ['text', 'html'],
      include: ['src/utils/**', 'src/services/**', 'src/hooks/**'],
    },
  },
});
