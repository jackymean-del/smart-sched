import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        // Split stable vendor code into cacheable chunks so app updates don't
        // re-download React/router/icons; xlsx is dynamically imported and
        // auto-splits into its own lazy chunk.
        manualChunks: {
          router: ['@tanstack/react-router', '@tanstack/react-query'],
          icons:  ['lucide-react'],
        },
      },
    },
  },
})
