import {execFileSync} from 'node:child_process'
import path from 'node:path'
import process from 'node:process'

const projectRoot = process.cwd()
const args = new Set(process.argv.slice(2))
const stagedFiles = collectStagedFiles()

runNodeScript('scripts/format-changed-files.mjs', ['--staged', '--quiet', '--fail-on-write'])

if (args.has('--full')) {
  runScript('lint')
  runScript('test:bounded')
  runScript('test:scripts')
  runScript('build:quiet')
  process.exit(0)
}

runStagedLint()
runStagedTests()

function runScript(scriptName, extraArgs = []) {
  const npmExecPath = process.env.npm_execpath
  const {args, command} = npmExecPath
    ? {command: process.execPath, args: [npmExecPath, 'run', scriptName, ...extraArgs]}
    : getNpmInvocation(scriptName, extraArgs)

  execFileSync(command, args, {
    cwd: projectRoot,
    stdio: 'inherit',
  })
}

function runNodeScript(scriptPath, args = []) {
  execFileSync(process.execPath, [scriptPath, ...args], {
    cwd: projectRoot,
    stdio: 'inherit',
  })
}

function getNpmInvocation(scriptName, extraArgs) {
  if (process.platform !== 'win32') {
    return {command: 'npm', args: ['run', scriptName, ...extraArgs]}
  }

  return {
    command: process.env.ComSpec ?? 'cmd.exe',
    args: ['/d', '/s', '/c', 'npm', 'run', scriptName, ...extraArgs],
  }
}

function runPackageBin(command, args) {
  const executable = path.join(
    projectRoot,
    'node_modules',
    '.bin',
    process.platform === 'win32' ? `${command}.cmd` : command,
  )
  const commandArgs =
    process.platform === 'win32'
      ? {
          command: process.env.ComSpec ?? 'cmd.exe',
          args: ['/d', '/s', '/c', executable, ...args],
        }
      : {command: executable, args}

  execFileSync(commandArgs.command, commandArgs.args, {
    cwd: projectRoot,
    stdio: 'inherit',
  })
}

function runStagedLint() {
  if (stagedFiles.includes('.oxlintrc.json')) {
    console.log('pre-commit: lint configuration changed; running the full lint pass')
    runScript('lint')
    return
  }

  const lintTargets = stagedFiles.filter(isOxlintTarget)
  if (lintTargets.length === 0) {
    console.log('pre-commit: no staged Oxlint targets')
    return
  }

  console.log(`pre-commit: linting ${lintTargets.length} staged file(s)`)
  runPackageBin('oxlint', ['--type-aware', '--report-unused-disable-directives', ...lintTargets])
}

function runStagedTests() {
  const vitestTargets = stagedFiles.filter(isVitestTarget)
  if (vitestTargets.length > 0) {
    console.log(`pre-commit: running ${vitestTargets.length} staged vitest file(s)`)
    runPackageBin('vitest', ['run', '--run', ...vitestTargets])
  }

  if (stagedFiles.some((filePath) => filePath.startsWith('scripts/'))) {
    runScript('test:scripts')
  }
}

function collectStagedFiles() {
  return execFileSync('git', ['diff', '--cached', '--name-only', '--diff-filter=ACMR'], {
    cwd: projectRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })
    .split(/\r?\n/)
    .map((filePath) => filePath.trim().replaceAll('\\', '/'))
    .filter(Boolean)
}

function isOxlintTarget(filePath) {
  return (
    /^src\/.*\.(ts|tsx)$/.test(filePath) ||
    /^scripts\/.*\.(js|mjs|cjs)$/.test(filePath) ||
    filePath === 'doctor.config.ts' ||
    filePath === 'vite.config.ts' ||
    filePath === 'vitest.config.ts'
  )
}

function isVitestTarget(filePath) {
  return /^src\/.*\.test\.(ts|tsx)$/.test(filePath)
}
