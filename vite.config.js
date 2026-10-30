import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// dev proxy → local backend (base44-platform/server.py on 8510)
export default defineConfig({
  plugins: [react()],
  server: {
    port: 8520,
    proxy: {
      '/api': 'http://localhost:8510',
      '/p': { target: 'http://localhost:8510', changeOrigin: true },
      '/ws': { target: 'ws://localhost:8510', ws: true },
    },
  },
  build: { outDir: 'dist', assetsDir: 'assets' },
})
