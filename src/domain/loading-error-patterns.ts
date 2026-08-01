export const MODULE_LOAD_ERROR_SUMMARIES = [
  'Failed to fetch dynamically imported module',
  'Error loading dynamically imported module',
  'Importing a module script failed',
  'Loading module from',
  'Disallowed MIME type',
] as const

export function isLikelyModuleLoadError(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase()
  return MODULE_LOAD_ERROR_SUMMARIES.some((summary) => message.includes(summary.toLowerCase()))
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
