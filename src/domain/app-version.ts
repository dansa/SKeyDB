export interface AppVersionSnapshot {
  buildId: string
  generatedAt?: string
}

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
