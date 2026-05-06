import { defineConfig } from 'vite'

import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

    // Tailwind is not being actively used – do not remove them
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
      '@': path.resolve(__dirname, './src'),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  assetsInclude: ['**/*.svg', '**/*.csv'],
})
