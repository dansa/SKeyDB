import {PRODUCTION_BROWSER_MINIMUMS} from './browser-support'

export type LoadingIncidentSource =
  | 'react-boundary'
  | 'unhandled-rejection'
  | 'vite-preload'
  | 'window-error'

export type LoadingIncidentCategory = 'asset-load' | 'offline' | 'runtime'

export type LoadingIncidentBrowserFamily =
  | 'Chrome'
  | 'Chrome iOS'
  | 'Edge'
  | 'Firefox'
  | 'Firefox iOS'
  | 'Safari'
  | 'Unknown'

export interface LoadingIncidentBrowser {
  family: LoadingIncidentBrowserFamily
  major?: number
}

export interface LoadingIncidentEnvironment {
  assetBasePath?: string
  browser: LoadingIncidentBrowser
  connectionType?: string
  online: boolean
  origin: string
  pathname: string
  platform: string
}

export interface LoadingIncident {
  assetPath?: string
  assetProbe?: LoadingIncidentAssetProbe
  browser: LoadingIncidentBrowser
  buildId: string
  category: LoadingIncidentCategory
  compatibilityConcern?: string
  componentNames?: string[]
  connectionType?: string
  errorFingerprint?: string
  errorSummary: string
  incidentId: string
  occurredAt: string
  online: boolean
  pathname: string
  platform: string
  source: LoadingIncidentSource
}

export interface LoadingIncidentAssetProbe {
  age?: string
  cacheControl?: string
  cacheStatus?: string
  contentType?: string
  etag?: string
  outcome:
    | 'html-response'
    | 'http-error'
    | 'javascript-response'
    | 'missing-asset'
    | 'network-error'
    | 'not-probed'
    | 'redirect'
    | 'unexpected-mime'
  status?: number
}

interface CreateLoadingIncidentOptions {
  buildId: string
  componentStack?: string | null
  environment: LoadingIncidentEnvironment
  error: unknown
  incidentId: string
  occurredAt: string
  source: LoadingIncidentSource
}

interface ProbeLoadingIncidentAssetOptions {
  assetBasePath?: string
  assetPath: string
  origin: string
  request: (input: string, init: RequestInit) => Promise<Response>
  timeoutMs?: number
}

const DYNAMIC_IMPORT_ERROR_SUMMARIES = [
  'Failed to fetch dynamically imported module',
  'Error loading dynamically imported module',
  'Importing a module script failed',
]

const INCIDENT_CORRELATION_WINDOW_MS = 2500

export function createLoadingIncident({
  buildId,
  componentStack,
  environment,
  error,
  incidentId,
  occurredAt,
  source,
}: CreateLoadingIncidentOptions): LoadingIncident {
  const errorMessage = getErrorMessage(error)
  const assetPath = getSameOriginAssetPath(
    errorMessage,
    environment.origin,
    environment.assetBasePath ?? '/assets/',
  )
  const isKnownModuleLoadFailure = DYNAMIC_IMPORT_ERROR_SUMMARIES.some((summary) =>
    errorMessage.toLowerCase().includes(summary.toLowerCase()),
  )
  const isAssetFailure = source === 'vite-preload' || Boolean(assetPath) || isKnownModuleLoadFailure
  const category: LoadingIncidentCategory = isAssetFailure
    ? environment.online
      ? 'asset-load'
      : 'offline'
    : 'runtime'
  const componentNames = category === 'runtime' ? getComponentNames(componentStack) : []
  const compatibilityConcern = getCompatibilityConcern(environment.browser)

  return {
    ...(assetPath ? {assetPath} : {}),
    browser: environment.browser,
    buildId: sanitizeSingleLine(buildId),
    category,
    ...(compatibilityConcern ? {compatibilityConcern} : {}),
    ...(componentNames.length > 0 ? {componentNames} : {}),
    ...(environment.connectionType
      ? {connectionType: sanitizeSingleLine(environment.connectionType)}
      : {}),
    errorSummary: getSafeErrorSummary(errorMessage, category),
    errorFingerprint: createErrorFingerprint(
      getErrorName(error),
      normalizeErrorForFingerprint(errorMessage, environment.origin),
    ),
    incidentId: sanitizeSingleLine(incidentId),
    occurredAt: sanitizeSingleLine(occurredAt),
    online: environment.online,
    pathname: sanitizePathname(environment.pathname),
    platform: sanitizeSingleLine(environment.platform),
    source,
  }
}

export function coalesceLoadingIncident(
  current: LoadingIncident | null,
  next: LoadingIncident,
  windowMs = INCIDENT_CORRELATION_WINDOW_MS,
): LoadingIncident {
  if (!current || !areIncidentsWithinWindow(current, next, windowMs)) return next

  const sameAsset =
    Boolean(current.assetPath) &&
    current.assetPath === next.assetPath &&
    current.category === next.category &&
    current.pathname === next.pathname &&
    current.errorFingerprint === next.errorFingerprint
  const sameRuntime =
    current.category === 'runtime' &&
    next.category === 'runtime' &&
    current.pathname === next.pathname &&
    current.errorFingerprint === next.errorFingerprint &&
    current.errorSummary === next.errorSummary

  if (!sameAsset && !sameRuntime) return next
  return {
    ...next,
    ...(current.assetProbe ? {assetProbe: current.assetProbe} : {}),
    incidentId: current.incidentId,
    occurredAt: current.occurredAt,
    source: current.source,
  }
}

export function getBrowserDiagnostic(userAgent: string): LoadingIncidentBrowser {
  if (/(?:\bwv\b|SamsungBrowser\/|OPR\/|Opera\/|DuckDuckGo\/|YaBrowser\/)/i.test(userAgent)) {
    return {family: 'Unknown'}
  }
  const candidates: [RegExp, LoadingIncidentBrowserFamily][] = [
    [/CriOS\/(\d+)/, 'Chrome iOS'],
    [/FxiOS\/(\d+)/, 'Firefox iOS'],
    [/(?:EdgA|Edg)\/(\d+)/, 'Edge'],
    [/(?:Chrome|Chromium)\/(\d+)/, 'Chrome'],
    [/Firefox\/(\d+)/, 'Firefox'],
    [/Version\/(\d+).*Safari\//, 'Safari'],
  ]
  for (const [pattern, family] of candidates) {
    const majorText = pattern.exec(userAgent)?.[1]
    if (majorText) return {family, major: Number(majorText)}
  }
  return {family: 'Unknown'}
}

export function formatLoadingIncidentDiagnostics(incident: LoadingIncident): string {
  return [
    'SKeyDB diagnostic report',
    formatReportField('Time', incident.occurredAt),
    formatReportField('Reference', incident.incidentId),
    formatReportField('Page', sanitizePathname(incident.pathname), 240),
    formatReportField('Build', incident.buildId),
    formatReportField('Category', incident.category),
    formatReportField('Browser', formatBrowserDiagnostic(incident.browser)),
    formatReportField('Platform', incident.platform),
    ...(incident.compatibilityConcern
      ? [formatReportField('Compatibility', incident.compatibilityConcern)]
      : []),
    `Online: ${incident.online ? 'yes' : 'no'}`,
    ...(incident.connectionType ? [formatReportField('Connection', incident.connectionType)] : []),
    formatReportField('Error', incident.errorSummary),
    ...(incident.errorFingerprint
      ? [formatReportField('Fingerprint', incident.errorFingerprint)]
      : []),
    ...(incident.componentNames?.length
      ? [
          formatReportField(
            'Components',
            incident.componentNames.map((name) => sanitizeSingleLine(name, 40)).join(' > '),
            240,
          ),
        ]
      : []),
    ...(incident.assetPath
      ? [formatReportField('Asset', sanitizeAssetPath(incident.assetPath), 240)]
      : []),
    ...(incident.assetProbe
      ? [formatReportField('Asset probe', formatAssetProbe(incident.assetProbe), 240)]
      : []),
  ].join('\n')
}

export function attachLoadingIncidentAssetProbe(
  incident: LoadingIncident,
  assetProbe: LoadingIncidentAssetProbe,
): LoadingIncident {
  return {
    ...incident,
    assetProbe: {
      outcome: assetProbe.outcome,
      ...(assetProbe.age ? {age: sanitizeProbeHeader(assetProbe.age)} : {}),
      ...(assetProbe.cacheControl
        ? {cacheControl: sanitizeProbeHeader(assetProbe.cacheControl)}
        : {}),
      ...(assetProbe.cacheStatus ? {cacheStatus: sanitizeProbeHeader(assetProbe.cacheStatus)} : {}),
      ...(assetProbe.contentType
        ? {contentType: sanitizeSingleLine(assetProbe.contentType, 80).toLowerCase()}
        : {}),
      ...(assetProbe.etag ? {etag: sanitizeProbeHeader(assetProbe.etag)} : {}),
      ...(assetProbe.status !== undefined ? {status: assetProbe.status} : {}),
    },
  }
}

export async function probeLoadingIncidentAsset({
  assetBasePath = '/assets/',
  assetPath,
  origin,
  request,
  timeoutMs = 4000,
}: ProbeLoadingIncidentAssetOptions): Promise<LoadingIncidentAssetProbe> {
  let assetUrl: URL
  try {
    assetUrl = new URL(assetPath, origin)
  } catch {
    return {outcome: 'not-probed'}
  }
  const normalizedAssetBasePath = new URL(assetBasePath, origin).pathname
  if (
    assetUrl.origin !== new URL(origin).origin ||
    !assetUrl.pathname.startsWith(normalizedAssetBasePath)
  ) {
    return {outcome: 'not-probed'}
  }

  const abortController = new AbortController()
  const timeoutId = window.setTimeout(() => {
    abortController.abort()
  }, timeoutMs)
  let response: Response
  try {
    response = await request(assetUrl.toString(), {
      cache: 'no-store',
      credentials: 'same-origin',
      redirect: 'manual',
      signal: abortController.signal,
    })
  } catch {
    return {outcome: 'network-error'}
  } finally {
    window.clearTimeout(timeoutId)
  }

  const rawContentType = response.headers.get('content-type')?.split(';', 1)[0]?.trim()
  const contentType = rawContentType
    ? sanitizeSingleLine(rawContentType, 80).toLowerCase()
    : undefined
  const responseDetails = {
    ...(getProbeHeader(response.headers, 'age')
      ? {age: getProbeHeader(response.headers, 'age')}
      : {}),
    ...(getProbeHeader(response.headers, 'cache-control')
      ? {cacheControl: getProbeHeader(response.headers, 'cache-control')}
      : {}),
    ...(getProbeHeader(response.headers, 'cf-cache-status')
      ? {cacheStatus: getProbeHeader(response.headers, 'cf-cache-status')}
      : {}),
    ...(contentType ? {contentType} : {}),
    ...(getProbeHeader(response.headers, 'etag')
      ? {etag: getProbeHeader(response.headers, 'etag')}
      : {}),
    status: response.status,
  }

  if (response.type === 'opaqueredirect' || (response.status >= 300 && response.status < 400)) {
    return {outcome: 'redirect', status: response.status}
  }
  if (response.status === 404 || response.status === 410) {
    return {...responseDetails, outcome: 'missing-asset'}
  }
  if (!response.ok) return {...responseDetails, outcome: 'http-error'}
  if (contentType === 'text/html') return {...responseDetails, outcome: 'html-response'}
  if (!contentType || !/(?:java|ecma)script|wasm/i.test(contentType)) {
    return {...responseDetails, outcome: 'unexpected-mime'}
  }
  return {...responseDetails, outcome: 'javascript-response'}
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

function getErrorName(error: unknown): string {
  if (error instanceof Error) return error.name
  if (error && typeof error === 'object' && 'name' in error) {
    const name = (error as {name?: unknown}).name
    if (typeof name === 'string') return name
  }
  return 'Error'
}

function getComponentNames(componentStack: string | null | undefined): string[] {
  if (!componentStack) return []
  const names: string[] = []
  const seenNames = new Set<string>()
  for (const match of componentStack.matchAll(/\bat\s+([A-Za-z_$][\w$.-]*)/g)) {
    const name = match[1]
    if (name && !seenNames.has(name)) {
      seenNames.add(name)
      names.push(name)
    }
    if (names.length === 6) break
  }
  return names
}

function createErrorFingerprint(name: string, message: string): string {
  let hash = 0x811c9dc5
  const value = `${name}:${message}`
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }
  return `ERR-${(hash >>> 0).toString(16).toUpperCase().padStart(8, '0')}`
}

function normalizeErrorForFingerprint(message: string, origin: string): string {
  return message.replace(/(?:https?:\/\/[^\s"')]+|\/[^\s"')]+)/g, (candidate) => {
    try {
      const url = new URL(candidate, origin)
      return url.origin === new URL(origin).origin ? url.pathname : '[external-url]'
    } catch {
      return '[url]'
    }
  })
}

function getCompatibilityConcern(browser: LoadingIncidentBrowser): string | undefined {
  if (browser.major === undefined) return undefined
  if (!(browser.family in PRODUCTION_BROWSER_MINIMUMS)) return undefined
  const family = browser.family as keyof typeof PRODUCTION_BROWSER_MINIMUMS
  const minimum = PRODUCTION_BROWSER_MINIMUMS[family]
  return browser.major < minimum
    ? `${family} ${String(browser.major)} is below SKeyDB's supported ${family} ${String(minimum)} target`
    : undefined
}

function getSameOriginAssetPath(
  message: string,
  origin: string,
  assetBasePath: string,
): string | undefined {
  const candidates = message.match(/(?:https?:\/\/[^\s"')]+|\/[^\s"')]+)/g) ?? []
  const normalizedAssetBasePath = new URL(assetBasePath, origin).pathname
  for (const candidate of candidates) {
    try {
      const url = new URL(candidate, origin)
      if (url.origin === origin && url.pathname.startsWith(normalizedAssetBasePath)) {
        return sanitizeAssetPath(url.pathname)
      }
    } catch {
      // Ignore malformed URL-like fragments from browser error strings.
    }
  }
  return undefined
}

function getSafeErrorSummary(message: string, category: LoadingIncidentCategory): string {
  const knownSummary = DYNAMIC_IMPORT_ERROR_SUMMARIES.find((summary) =>
    message.toLowerCase().includes(summary.toLowerCase()),
  )
  if (knownSummary) return knownSummary
  if (category === 'offline') return 'The browser reports that it is offline'
  if (category === 'asset-load') return 'A required page asset could not be loaded'
  return 'Unexpected application error'
}

function sanitizePathname(pathname: string): string {
  try {
    return sanitizeSingleLine(new URL(pathname, 'https://skeydb.invalid').pathname, 240)
  } catch {
    return '/'
  }
}

function sanitizeAssetPath(assetPath: string): string {
  try {
    return sanitizeSingleLine(new URL(assetPath, 'https://skeydb.invalid').pathname, 240)
  } catch {
    return sanitizeSingleLine(assetPath.split(/[?#]/, 1)[0] ?? '', 240)
  }
}

function sanitizeSingleLine(value: string, maxLength = 160): string {
  const withoutControlCharacters = Array.from(value)
    .map((character) => {
      const codePoint = character.codePointAt(0) ?? 0
      return codePoint <= 0x1f || codePoint === 0x7f ? ' ' : character
    })
    .join('')
  return withoutControlCharacters.trim().slice(0, maxLength)
}

function formatBrowserDiagnostic(browser: LoadingIncidentBrowser): string {
  return browser.major === undefined ? browser.family : `${browser.family} ${String(browser.major)}`
}

function formatReportField(label: string, value: string, maxLength = 240): string {
  return `${label}: ${sanitizeSingleLine(value, maxLength)}`
}

function formatAssetProbe(probe: LoadingIncidentAssetProbe): string {
  const contentType = probe.contentType ? sanitizeSingleLine(probe.contentType, 80) : undefined
  const response = [probe.status, contentType].filter((value) => value !== undefined).join(' ')
  const metadata = [
    ['cache-control', probe.cacheControl],
    ['cache-status', probe.cacheStatus],
    ['age', probe.age],
    ['etag', probe.etag],
  ]
    .filter((entry): entry is [string, string] => typeof entry[1] === 'string')
    .map(([label, value]) => `${label}=${sanitizeSingleLine(value, 120)}`)
  const metadataSuffix = metadata.length > 0 ? `; ${metadata.join('; ')}` : ''
  const outcome = {
    'html-response': 'HTML response',
    'http-error': 'HTTP error',
    'javascript-response': 'JavaScript available',
    'missing-asset': 'asset missing',
    'network-error': 'network request failed',
    'not-probed': 'not probed',
    redirect: 'redirect blocked',
    'unexpected-mime': 'unexpected MIME type',
  }[probe.outcome]
  return response ? `${response} (${outcome}${metadataSuffix})` : `${outcome}${metadataSuffix}`
}

function getProbeHeader(headers: Headers, name: string): string | undefined {
  const value = headers.get(name)
  return value ? sanitizeProbeHeader(value) : undefined
}

function sanitizeProbeHeader(value: string): string {
  return sanitizeSingleLine(value, 160)
}

function areIncidentsWithinWindow(
  current: LoadingIncident,
  next: LoadingIncident,
  windowMs: number,
): boolean {
  const currentTime = Date.parse(current.occurredAt)
  const nextTime = Date.parse(next.occurredAt)
  return (
    Number.isFinite(currentTime) &&
    Number.isFinite(nextTime) &&
    nextTime >= currentTime &&
    nextTime - currentTime <= windowMs
  )
}
