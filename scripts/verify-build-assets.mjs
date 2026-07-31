import {access, readFile, stat} from 'node:fs/promises'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DOCUMENT_REFERENCE_PATTERN = /\b(?:src|href)=["']([^"']+)["']/gi

export async function verifyBuildAssets({
  basePath = '/',
  distDir = path.join(REPO_ROOT, 'dist'),
} = {}) {
  const normalizedBasePath = normalizeBasePath(basePath)
  const indexPath = path.join(distDir, 'index.html')
  const indexHtml = await readFile(indexPath, 'utf8')
  const references = collectLocalReferences(indexHtml, normalizedBasePath)
  const rootPath = path.resolve(distDir)

  for (const reference of references) {
    const relativePath = getOutputRelativePath(reference, normalizedBasePath)
    const resolvedPath = path.resolve(rootPath, relativePath)
    if (!isWithinRoot(rootPath, resolvedPath)) {
      throw new Error(`Document reference escapes build output: ${reference}`)
    }
    try {
      await access(resolvedPath)
      const details = await stat(resolvedPath)
      if (!details.isFile()) throw new Error('not a file')
    } catch {
      throw new Error(`Document references missing build asset: ${reference}`)
    }
  }

  return references
}

function collectLocalReferences(indexHtml, basePath) {
  const references = []
  const seen = new Set()
  for (const match of indexHtml.matchAll(DOCUMENT_REFERENCE_PATTERN)) {
    const value = match[1]
    if (!value || value.startsWith('#') || value.startsWith('data:')) continue
    let url
    try {
      url = new URL(value, `https://skeydb.invalid${basePath}`)
    } catch {
      continue
    }
    if (url.origin !== 'https://skeydb.invalid') continue
    const reference = url.pathname
    if (seen.has(reference)) continue
    seen.add(reference)
    references.push(reference)
  }
  return references
}

function getOutputRelativePath(reference, basePath) {
  const pathname = decodeURIComponent(new URL(reference, 'https://skeydb.invalid').pathname)
  if (!pathname.startsWith(basePath)) {
    throw new Error(`Document reference is outside configured base path: ${reference}`)
  }
  return pathname.slice(basePath.length)
}

function normalizeBasePath(basePath) {
  const value = typeof basePath === 'string' && basePath.trim() !== '' ? basePath.trim() : '/'
  const withLeadingSlash = value.startsWith('/') ? value : `/${value}`
  return withLeadingSlash.endsWith('/') ? withLeadingSlash : `${withLeadingSlash}/`
}

function isWithinRoot(rootPath, candidatePath) {
  return candidatePath === rootPath || candidatePath.startsWith(`${rootPath}${path.sep}`)
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : undefined
const modulePath = path.resolve(fileURLToPath(import.meta.url))
if (invokedPath === modulePath) {
  const basePath = process.env.VITE_BASE_PATH ?? '/'
  const references = await verifyBuildAssets({basePath})
  console.log(`Verified ${references.length} document asset reference(s) in dist.`)
}
