import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'

const projectRoot = process.cwd()
const simpleGitHooksCli = path.join(projectRoot, 'node_modules', 'simple-git-hooks', 'cli.js')

function runGit(args, options = {}) {
  return execFileSync('git', args, {
    cwd: projectRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    ...options,
  }).trim()
}

function isInsideGitWorkTree() {
  try {
    return runGit(['rev-parse', '--is-inside-work-tree']) === 'true'
  } catch {
    return false
  }
}

if (!existsSync(simpleGitHooksCli)) {
  process.exit(0)
}

if (!isInsideGitWorkTree()) {
  process.exit(0)
}

try {
  const currentHooksPath = runGit(['config', '--local', '--get', 'core.hooksPath'])
  if (!currentHooksPath) {
    const resolvedHooksPath = runGit(['rev-parse', '--git-path', 'hooks'])
    execFileSync('git', ['config', '--local', 'core.hooksPath', resolvedHooksPath], {
      cwd: projectRoot,
      stdio: 'inherit',
    })
  }
} catch {
  const resolvedHooksPath = runGit(['rev-parse', '--git-path', 'hooks'])
  execFileSync('git', ['config', '--local', 'core.hooksPath', resolvedHooksPath], {
    cwd: projectRoot,
    stdio: 'inherit',
  })
}

execFileSync(process.execPath, [simpleGitHooksCli], {
  cwd: projectRoot,
  stdio: 'inherit',
})
