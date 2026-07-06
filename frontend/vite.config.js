import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://finanzarc.runasp.net',
        changeOrigin: true
      },
      '/Uploads': {
        target: 'http://finanzarc.runasp.net',
        changeOrigin: true
      }
    }
  }
})
