import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Απλό Vite config χωρίς PWA (προσωρινή λύση)
export default defineConfig({
  plugins: [
    react()
  ],
  server: {
    host: true
  }
})
