import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rolldownOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('vienna-2026-grand-final.json')) return 'event-data';
          if (id.includes('react') || id.includes('react-dom')) return 'react';
          if (id.includes('d3-')) return 'charts';
          if (id.includes('lucide-react')) return 'icons';
        },
      },
    },
  },
})
