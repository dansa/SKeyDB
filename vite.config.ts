import path from 'path'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import {defineConfig, type Plugin} from 'vite'

interface AppVersionSnapshot {
  buildId: string
  generatedAt: string
}

function getBasePath(): string {
  const configured = process.env.VITE_BASE_PATH?.trim()
  if (!configured) {
    return '/'
  }
  const withLeadingSlash = configured.startsWith('/') ? configured : `/${configured}`
  return withLeadingSlash.endsWith('/') ? withLeadingSlash : `${withLeadingSlash}/`
}

function createAppVersionSnapshot(): AppVersionSnapshot {
  const commitSha =
    getNonEmptyEnv('CF_PAGES_COMMIT_SHA') ??
    getNonEmptyEnv('GITHUB_SHA') ??
    getNonEmptyEnv('SKEYDB_BUILD_ID')
  const generatedAt = new Date().toISOString()

  return {
    buildId: commitSha ?? generatedAt,
    generatedAt,
  }
}

function getNonEmptyEnv(name: string): string | undefined {
  const value = process.env[name]?.trim()
  if (value) return value
  return undefined
}

function appVersionPlugin(snapshot: AppVersionSnapshot): Plugin {
  return {
    name: 'skeydb-app-version',
    generateBundle() {
      this.emitFile({
        fileName: 'version.json',
        source: `${JSON.stringify(snapshot, null, 2)}\n`,
        type: 'asset',
      })
    },
  }
}

const appVersion = createAppVersionSnapshot()

export default defineConfig({
  base: getBasePath(),

  define: {
    'import.meta.env.VITE_SKEYDB_BUILD_ID': JSON.stringify(appVersion.buildId),
  },

  plugins: [react(), tailwindcss(), appVersionPlugin(appVersion)],

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
