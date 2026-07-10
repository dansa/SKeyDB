import {execFileSync} from 'node:child_process'
import {createHash} from 'node:crypto'
import {existsSync, readFileSync} from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const args = new Set(process.argv.slice(2))
const quiet = args.has('--quiet')
const failOnWrite = args.has('--fail-on-write')
const stagedOnly = args.has('--staged')
const repoRoot = getRepoRoot()
const changedFiles = collectChangedFiles(repoRoot, {stagedOnly})
const oxfmtTargets = changedFiles.filter(isOxfmtTarget)

if (oxfmtTargets.length === 0) {
  if (!quiet) {
    console.log('format-changed-files: no changed Oxfmt targets')
  }
  process.exit(0)
}

if (!quiet) {
  console.log(`format-changed-files: formatting ${oxfmtTargets.length} file(s)`)
}

if (stagedOnly && failOnWrite) {
  const unformattedTargets = collectUnformattedStagedTargets(oxfmtTargets, repoRoot)
  if (unformattedTargets.length > 0) {
    console.error(
      [
        'format-changed-files: staged files are not formatted.',
        'Format the files and restage before committing again.',
        ...unformattedTargets.map((filePath) => `  - ${filePath}`),
      ].join('\n'),
    )
    process.exit(1)
  }
  process.exit(0)
}

const hashesBeforeFormat = failOnWrite ? collectFileHashes(oxfmtTargets, repoRoot) : null
runOxfmt(oxfmtTargets, repoRoot)

if (failOnWrite) {
  const rewrittenTargets = collectRewrittenTargets(oxfmtTargets, repoRoot, hashesBeforeFormat)
  if (rewrittenTargets.length > 0) {
    console.error(
      [
        'format-changed-files: Oxfmt rewrote files during pre-commit.',
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

function readStagedFile(filePath) {
  return execGit(['show', `:${filePath}`])
}

function getOxfmtCli(cwd) {
  return path.join(cwd, 'node_modules', 'oxfmt', 'bin', 'oxfmt')
}

function runOxfmt(targets, cwd) {
  const oxfmtCli = getOxfmtCli(cwd)

  for (const targetChunk of chunkTargets(targets)) {
    execFileSync(process.execPath, [oxfmtCli, '--write', ...targetChunk], {
      cwd,
      stdio: quiet ? ['ignore', 'ignore', 'inherit'] : 'inherit',
    })
  }
}

function chunkTargets(targets) {
  const chunks = []
  let currentChunk = []
  let currentLength = 0

  for (const target of targets) {
    const nextLength = currentLength + target.length + 1
    if (currentChunk.length > 0 && nextLength > 2000) {
      chunks.push(currentChunk)
      currentChunk = []
      currentLength = 0
    }
    currentChunk.push(target)
    currentLength += target.length + 1
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk)
  }

  return chunks
}

function collectFileHashes(filePaths, cwd) {
  return new Map(
    filePaths.map((filePath) => {
      const absolutePath = path.join(cwd, filePath)
      return [filePath, hashFile(absolutePath)]
    }),
  )
}

function collectUnformattedStagedTargets(filePaths, cwd) {
  return filePaths.filter((filePath) => {
    const stagedSource = readStagedFile(filePath)
    return formatSourceWithOxfmt(stagedSource, filePath, cwd) !== stagedSource
  })
}

function formatSourceWithOxfmt(source, filePath, cwd) {
  return execFileSync(
    process.execPath,
    [
      getOxfmtCli(cwd),
      '--config',
      path.join(cwd, '.oxfmtrc.json'),
      '--stdin-filepath',
      path.join(cwd, filePath),
    ],
    {
      cwd,
      encoding: 'utf8',
      input: source,
      maxBuffer: 64 * 1024 * 1024,
      stdio: ['pipe', 'pipe', 'pipe'],
    },
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

function collectChangedFiles(cwd, {stagedOnly} = {stagedOnly: false}) {
  const fileSet = new Set()
  const gitCommands = stagedOnly
    ? [['diff', '--cached', '--name-only', '--diff-filter=ACMR']]
    : [
        ['diff', '--name-only', '--diff-filter=ACMR'],
        ['diff', '--cached', '--name-only', '--diff-filter=ACMR'],
        ['ls-files', '--others', '--modified', '--exclude-standard'],
      ]

  for (const args of gitCommands) {
    for (const entry of execGit(args)
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)) {
      const normalized = entry.replaceAll('\\', '/')
      const absolutePath = path.join(cwd, normalized)
      if (stagedOnly || existsSync(absolutePath)) {
        fileSet.add(normalized)
      }
    }
  }

  return [...fileSet].sort()
}

function isOxfmtTarget(filePath) {
  if (
    filePath === 'package.json' ||
    filePath === '.oxfmtrc.json' ||
    filePath === '.oxlintrc.json' ||
    filePath === 'doctor.config.ts' ||
    filePath === 'vite.config.ts' ||
    filePath === 'vitest.config.ts' ||
    filePath === 'src/domain/persistence-contract.v1.json'
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

  if (/^tsconfig.*\.json$/.test(normalized)) {
    return true
  }

  if (/^\.github\/workflows\/.*\.yml$/.test(normalized)) {
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
