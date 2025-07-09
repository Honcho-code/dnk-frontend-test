import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0",
    port: 5000,
    allowedHosts: [
      "localhost",
      ".replit.dev",
      ".riker.replit.dev"
    ],
  },
  preview: {
    host: "0.0.0.0",
    port: 3000,
    allowedHosts: [
      "localhost",
      ".replit.dev",
      ".riker.replit.dev",
      ".replit.app"
    ],
  },
  plugins: [
    react(),
  ],
}))
