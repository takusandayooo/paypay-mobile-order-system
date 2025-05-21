import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'
import { defineConfig } from 'vite'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        paymentResult: path.resolve(__dirname, 'paymentResult.html'),
        callNumberDisplay: path.resolve(__dirname, 'callNumberDisplay.html'),
        ownerPage: path.resolve(__dirname, 'ownerPage.html'),
      },
      output: {
        manualChunks: {
          react: ['react', 'react-dom'], // React関連のライブラリを分割
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'], // Firebase関連を分割
        },
      },
    },
    chunkSizeWarningLimit: 1000, // チャンクサイズの警告を調整
  },
})