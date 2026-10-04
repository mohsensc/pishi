import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { parkApiPlugin } from './server/vite/parkApiPlugin.ts'

export default defineConfig({
  plugins: [react(), parkApiPlugin()],
})
