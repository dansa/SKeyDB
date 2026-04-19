import {execFileSync, execSync} from 'node:child_process'
import {createHash} from 'node:crypto'
import {existsSync, readFileSync} from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const args = new Set(process.argv.slice(2))
const quiet = args.has('--quiet')
const failOnWrite = args.has('--fail-on-write')
const repoRoot = getRepoRoot()
const changedFiles = collectChangedFiles(repoRoot)
const prettierTargets = changedFiles.filter(isPrettierTarget)

if (prettierTargets.length === 0) {
  if (!quiet) {
    console.log('format-changed-files: no changed prettier targets')
  }
  process.exit(0)
}

if (!quiet) {
  console.log(`format-changed-files: formatting ${prettierTargets.length} file(s)`)
}
const hashesBeforeFormat = failOnWrite ? collectFileHashes(prettierTargets, repoRoot) : null
runPrettier(prettierTargets, repoRoot)

if (failOnWrite) {
  const rewrittenTargets = collectRewrittenTargets(prettierTargets, repoRoot, hashesBeforeFormat)
  if (rewrittenTargets.length > 0) {
    console.error(
      [
        'format-changed-files: prettier rewrote files during pre-commit.',
        'Review the changes and restage before committing again.',
        ...rewrittenTargets.map((filePath) => `  - ${filePath}`),
      ].join('\n'),
    )
    process.exit(1)
  }
}

function getRepoRoot() {
  return execGit(['rev-parse', '--show-toplevel']).trim()
}

function execGit(args) {
  return execFileSync('git', args, {
    cwd: process.cwd(),
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })
}

function getNpxCommand() {
  return process.platform === 'win32' ? 'npx.cmd' : 'npx'
}

function runPrettier(targets, cwd) {
  const prettierArgs = ['prettier', '--write']
  if (quiet) {
    prettierArgs.push('--log-level', 'silent')
  }

  if (process.platform === 'win32') {
    const quotedArgs = [...prettierArgs, ...targets]
      .map((argument) => `"${argument.replaceAll('"', '\\"')}"`)
      .join(' ')
    execSync(`${getNpxCommand()} ${quotedArgs}`, {
      cwd,
      stdio: 'inherit',
    })
    return
  }

  execFileSync(getNpxCommand(), [...prettierArgs, ...targets], {
    cwd,
    stdio: 'inherit',
  })
}

function collectFileHashes(filePaths, cwd) {
  return new Map(
    filePaths.map((filePath) => {
      const absolutePath = path.join(cwd, filePath)
      return [filePath, hashFile(absolutePath)]
    }),
  )
}

function collectRewrittenTargets(filePaths, cwd, previousHashes) {
  return filePaths.filter((filePath) => {
    const absolutePath = path.join(cwd, filePath)
    return previousHashes.get(filePath) !== hashFile(absolutePath)
  })
}

function hashFile(filePath) {
  const hash = createHash('sha1')
  hash.update(readFileSync(filePath))
  return hash.digest('hex')
}

function collectChangedFiles(cwd) {
  const fileSet = new Set()

  for (const args of [
    ['diff', '--name-only', '--diff-filter=ACMR'],
    ['diff', '--cached', '--name-only', '--diff-filter=ACMR'],
    ['ls-files', '--others', '--modified', '--exclude-standard'],
  ]) {
    for (const entry of execGit(args)
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)) {
      const normalized = entry.replaceAll('\\', '/')
      const absolutePath = path.join(cwd, normalized)
      if (existsSync(absolutePath)) {
        fileSet.add(normalized)
      }
    }
  }

  return [...fileSet].sort()
}

function isPrettierTarget(filePath) {
  if (
    filePath === 'package.json' ||
    filePath === 'prettier.config.cjs' ||
    filePath === 'eslint.config.js' ||
    filePath === 'vite.config.ts' ||
    filePath === 'src/domain/persistence-contract.v1.json' ||
    filePath === 'tools/react-sidecar/package.json'
  ) {
    return true
  }

  const normalized = filePath.replaceAll('\\', '/')

  if (/^src\/.*\.(ts|tsx|css)$/.test(normalized)) {
    return true
  }

  if (/^scripts\/.*\.(js|mjs|cjs)$/.test(normalized)) {
    return true
  }

  if (/^src\/data\/.*\.json$/.test(normalized)) {
    return true
  }

  if (/^schemas\/.*\.json$/.test(normalized)) {
    return true
  }

  return false
}
