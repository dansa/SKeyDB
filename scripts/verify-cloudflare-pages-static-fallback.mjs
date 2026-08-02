import {access, readFile, stat} from 'node:fs/promises'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

export async function verifyCloudflarePagesStaticFallback({
  distDir = path.join(REPO_ROOT, 'dist'),
} = {}) {
  const assetNotFoundPath = path.join(distDir, 'assets', '404.html')
  const topLevelNotFoundPath = path.join(distDir, '404.html')
  const redirectsPath = path.join(distDir, '_redirects')

  await assertFile(assetNotFoundPath, 'Built asset fallback is missing')
  const assetNotFound = await readFile(assetNotFoundPath, 'utf8')
  if (!/<title>SKeyDB asset not found<\/title>/.test(assetNotFound)) {
    throw new Error(`Built asset fallback has an unexpected title: ${assetNotFoundPath}`)
  }
  if (/<script\b/i.test(assetNotFound)) {
    throw new Error(`Built asset fallback must not load application scripts: ${assetNotFoundPath}`)
  }

  await assertMissing(topLevelNotFoundPath, 'A top-level 404 disables Pages SPA fallback')
  await assertMissing(
    redirectsPath,
    'A broad _redirects rule can rewrite missing assets to index.html',
  )

  return {
    assetNotFoundPath,
    topLevelNotFoundPath,
    redirectsPath,
  }
}

async function assertFile(filePath, message) {
  try {
    const details = await stat(filePath)
    if (!details.isFile()) throw new Error(`${message}: path is not a file: ${filePath}`)
  } catch (error) {
    if (error?.code === 'ENOENT') throw new Error(`${message}: ${filePath}`, {cause: error})
    throw error
  }
}

async function assertMissing(filePath, message) {
  try {
    await access(filePath)
  } catch (error) {
    if (error?.code === 'ENOENT') return
    throw error
  }
  throw new Error(`${message}: ${filePath}`)
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : undefined
const modulePath = path.resolve(fileURLToPath(import.meta.url))
if (invokedPath === modulePath) {
  await verifyCloudflarePagesStaticFallback()
  console.log('Verified static Cloudflare Pages asset fallback contract in dist.')
}
