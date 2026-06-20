import {defineConfig} from 'react-doctor/api'

export default defineConfig({
  ignore: {
    files: ['untracked/**', '.worktrees/**', '.mcp_data/**', '.codex-logs/**', 'docs/goals/**'],
  },
})
