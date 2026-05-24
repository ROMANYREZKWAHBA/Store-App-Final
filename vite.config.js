import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Base path configuration:
// - Vercel / any web server → '/' (absolute paths work for all routes)
// - Electron local-file builds → use VITE_APP_BASE='./' in the electron-build script
//   because Electron loads from file:// and needs relative asset paths.
export default defineConfig({
  base: process.env.VITE_APP_BASE ?? '/',
  plugins: [react()],
})
