interface LegacyHashRouteLocation {
  basePath: string
  hash: string
  pathname: string
  search: string
}

export function getRouterBasename(basePath: string): string | undefined {
  const normalized = normalizeBasePath(basePath)
  return normalized === '' ? undefined : normalized
}

export function getLegacyHashRouteReplacement({
  basePath,
  hash,
  search,
}: LegacyHashRouteLocation): string | null {
  if (!hash.startsWith('#/')) {
    return null
  }

  const normalizedBasePath = normalizeBasePath(basePath)
  const routeUrl = new URL(hash.slice(1), 'https://skeydb.local')
  const pathname = `${normalizedBasePath}${routeUrl.pathname}`
  const routeSearch = routeUrl.search || search

  return `${pathname}${routeSearch}${routeUrl.hash}`
}

export function replaceLegacyHashRoute(basePath: string): void {
  const replacement = getLegacyHashRouteReplacement({
    basePath,
    hash: window.location.hash,
    pathname: window.location.pathname,
    search: window.location.search,
  })

  if (!replacement) {
    return
  }

  window.history.replaceState(window.history.state, '', replacement)
}

function normalizeBasePath(basePath: string): string {
  const trimmed = basePath.trim()
  if (!trimmed || trimmed === '/') {
    return ''
  }

  const withLeadingSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  return withLeadingSlash.endsWith('/') ? withLeadingSlash.slice(0, -1) : withLeadingSlash
}
