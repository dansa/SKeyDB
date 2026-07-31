export interface AppVersionSnapshot {
  buildId: string
  generatedAt?: string
}

const LOADING_INCIDENT_RECOVERY_PARAM = 'skeydb-reload'

const STALE_CHUNK_ERROR_PATTERNS = [
  'error loading dynamically imported module',
  'failed to fetch dynamically imported module',
  'importing a module script failed',
  'loading module from',
  'disallowed mime type',
]

export function getAppVersionUrl(basePath: string, origin: string): string {
  return new URL('version.json', new URL(basePath, origin)).toString()
}

export function getLoadingIncidentRecoveryUrl(href: string): string {
  try {
    const url = new URL(href)
    url.searchParams.set(LOADING_INCIDENT_RECOVERY_PARAM, '1')
    return url.toString()
  } catch {
    return href
  }
}

export function hasLoadingIncidentRecoveryMarker(href: string): boolean {
  try {
    return new URL(href).searchParams.get(LOADING_INCIDENT_RECOVERY_PARAM) === '1'
  } catch {
    return false
  }
}

export function removeLoadingIncidentRecoveryMarker(href: string): string {
  try {
    const url = new URL(href)
    url.searchParams.delete(LOADING_INCIDENT_RECOVERY_PARAM)
    return url.toString()
  } catch {
    return href
  }
}

interface RecoverFromNewerBuildOptions {
  currentBuildId: string
  onReload: (url: string) => void
  pageUrl: string
  request: (input: string, init?: RequestInit) => Promise<Response>
  versionUrl: string
}

export async function recoverFromNewerBuild({
  currentBuildId,
  onReload,
  pageUrl,
  request,
  versionUrl,
}: RecoverFromNewerBuildOptions): Promise<boolean> {
  try {
    const response = await request(withCacheBuster(versionUrl), {
      cache: 'no-store',
      credentials: 'same-origin',
    })
    if (!response.ok) return false
    const snapshot = parseAppVersionSnapshot(await response.json())
    if (!isDifferentAppVersion(currentBuildId, snapshot)) return false
    onReload(getLoadingIncidentRecoveryUrl(pageUrl))
    return true
  } catch {
    return false
  }
}

export function parseAppVersionSnapshot(value: unknown): AppVersionSnapshot | null {
  if (!value || typeof value !== 'object') return null

  const snapshot = value as Partial<AppVersionSnapshot>
  if (typeof snapshot.buildId !== 'string' || snapshot.buildId.trim() === '') {
    return null
  }

  return {
    buildId: snapshot.buildId,
    ...(typeof snapshot.generatedAt === 'string' && snapshot.generatedAt.trim() !== ''
      ? {generatedAt: snapshot.generatedAt}
      : {}),
  }
}

export function isDifferentAppVersion(
  currentBuildId: string,
  snapshot: AppVersionSnapshot | null,
): boolean {
  return Boolean(snapshot && snapshot.buildId !== currentBuildId)
}

export function isLikelyStaleChunkError(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase()
  return STALE_CHUNK_ERROR_PATTERNS.some((pattern) => message.includes(pattern))
}

function getErrorMessage(error: unknown): string {
  if (typeof error === 'string') return error
  if (error instanceof Error) return error.message
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as {message?: unknown}).message
    return typeof message === 'string' ? message : ''
  }
  return ''
}

export function withCacheBuster(url: string): string {
  const parsedUrl = new URL(url)
  parsedUrl.searchParams.set('check', Date.now().toString())
  return parsedUrl.toString()
}
