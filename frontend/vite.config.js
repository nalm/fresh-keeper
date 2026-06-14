import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  root: fs.realpathSync.native(path.resolve('./')),
  plugins: [react()],
})
