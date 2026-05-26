import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: process.env.VITE_APP_BASE ?? '/',
  plugins: [react()],

  // Configure esbuild options to strictly preserve function names and avoid variable smashing
  esbuild: {
    keepNames: true,
    minifyIdentifiers: false
  },

  build: {
    // Configure esbuild options within build object as well for complete coverage
    esbuild: {
      keepNames: true,
      minifyIdentifiers: false
    },
    // Ensure minifyInternalExports is set to false
    rollupOptions: {
      output: {
        minifyInternalExports: false,
        keepNames: true,
        minify: {
          mangle: false
        }
      }
    },
    // Mirror these output options to rolldownOptions since Vite 8 uses Rolldown natively
    rolldownOptions: {
      output: {
        minifyInternalExports: false,
        keepNames: true,
        minify: {
          mangle: false
        }
      }
    }
  }
})


