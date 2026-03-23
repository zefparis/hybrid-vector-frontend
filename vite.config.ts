import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react()],
  server: {
    headers: {
      'X-Frame-Options': 'ALLOW-FROM https://hybrid-hmh.affectli.com',
      'Content-Security-Policy':
        "frame-ancestors 'self' https://*.affectli.com https://affectli.com",
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
