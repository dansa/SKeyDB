import path from 'path'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import {defineConfig} from 'vite'

function getBasePath(): string {
  const configured = process.env.VITE_BASE_PATH?.trim()
  if (!configured) {
    return '/'
  }
  const withLeadingSlash = configured.startsWith('/') ? configured : `/${configured}`
  return withLeadingSlash.endsWith('/') ? withLeadingSlash : `${withLeadingSlash}/`
}

export default defineConfig({
  base: getBasePath(),

  plugins: [react(), tailwindcss()],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
  },

  preview: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
  },
})
