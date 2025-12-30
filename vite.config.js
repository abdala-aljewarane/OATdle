import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    fs: {
      strict: false
    }
  },
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        practice: 'practice.html'
      }
    }
  }
})
