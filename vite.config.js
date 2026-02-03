import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 5173,
    open: true,
    // Enable SPA fallback for client-side routing
    historyApiFallback: true
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
})
