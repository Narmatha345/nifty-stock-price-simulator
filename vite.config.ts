import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  base: '/nifty-stock-price-simulator/',
  plugins: [react()],
})
