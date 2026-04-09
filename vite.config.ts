import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { wispPlugin } from './src/core/wisp-plugin'

export default defineConfig({
  plugins: [
    ...wispPlugin(),
    react(),
  ],
  resolve: {
    alias: {
      'wisp': resolve(__dirname, './src/types/story.ts'),
    },
  },
  server: {
    port: parseInt(process.env.WISP_PORT ?? '5174'),
    open: false,
    hmr: true,
  },
  build: {
    target: 'esnext',
  },
  optimizeDeps: {
    exclude: ['virtual:wisp-stories'],
  },
})
