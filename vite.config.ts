import path from 'path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')

  return {
    plugins: [react()],

    // ✅ WAJIB sama dengan SQL & nginx
    base: '/generator-surat/custom-surat/',

    server: {
      port: 3000,
      host: '0.0.0.0',
    },

    build: {
      outDir: 'dist',
      emptyOutDir: true,
    },

    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'), // ✅ FIX
      },
    },

    define: {
      __GEMINI_API_KEY__: JSON.stringify(env.GEMINI_API_KEY),
    },
  }
})
