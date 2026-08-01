import {useCallback, useEffect, useRef, useState} from 'react'

import {
  getAppVersionUrl,
  hasLoadingIncidentRecoveryMarker,
  isLikelyStaleChunkError,
  recoverFromNewerBuild,
  removeLoadingIncidentRecoveryMarker,
} from '@/domain/app-version'
import {
  attachLoadingIncidentAssetProbe,
  coalesceLoadingIncident,
  createLoadingIncident,
  getBrowserDiagnostic,
  probeLoadingIncidentAsset,
  type LoadingIncident,
  type LoadingIncidentSource,
} from '@/domain/loading-incident'

const CURRENT_BUILD_ID = getCurrentBuildId()

export interface LoadingIncidentState {
  incident: LoadingIncident | null
  refresh: () => void
  reportLoadingError: (
    error: unknown,
    source: LoadingIncidentSource,
    componentStack?: string | null,
  ) => void
}

export function useLoadingIncident({pathname}: {pathname: string}): LoadingIncidentState {
  const [incident, setIncident] = useState<LoadingIncident | null>(null)
  const recoveryAttemptedRef = useRef(false)

  useEffect(() => {
    const currentUrl = window.location.href
    if (!hasLoadingIncidentRecoveryMarker(currentUrl)) return
    recoveryAttemptedRef.current = true
    const cleanUrl = removeLoadingIncidentRecoveryMarker(currentUrl)
    if (cleanUrl !== currentUrl) {
      window.history.replaceState(window.history.state, '', cleanUrl)
    }
  }, [])

  const reportLoadingError = useCallback(
    (error: unknown, source: LoadingIncidentSource, componentStack?: string | null) => {
      const assetBasePath = getAssetBasePath()
      const nextIncident = createLoadingIncident({
        buildId: CURRENT_BUILD_ID,
        componentStack,
        environment: {
          assetBasePath,
          browser: getBrowserDiagnostic(navigator.userAgent),
          connectionType: getConnectionType(navigator),
          online: navigator.onLine,
          origin: window.location.origin,
          pathname,
          platform: getPlatformDescription(navigator.userAgent),
        },
        error,
        incidentId: createIncidentId(source),
        occurredAt: new Date().toISOString(),
        source,
      })

      setIncident((current) => coalesceLoadingIncident(current, nextIncident))
    },
    [pathname],
  )

  const incidentId = incident?.incidentId
  const assetPath = incident?.assetPath
  const hasAssetProbe = incident?.assetProbe !== undefined
  const assetProbe = incident?.assetProbe
  const incidentCategory = incident?.category
  useEffect(() => {
    if (!incidentId || !assetPath || hasAssetProbe || typeof fetch !== 'function') return
    let active = true
    void probeLoadingIncidentAsset({
      assetBasePath: getAssetBasePath(),
      assetPath,
      origin: window.location.origin,
      request: (input, init) => fetch(input, init),
    }).then((result) => {
      if (!active) return
      setIncident((current) =>
        current?.incidentId === incidentId
          ? attachLoadingIncidentAssetProbe(current, result)
          : current,
      )
    })
    return () => {
      active = false
    }
  }, [assetPath, hasAssetProbe, incidentId])

  useEffect(() => {
    const hasRecoveryEvidence = assetProbe !== undefined || !assetPath
    if (
      !incidentId ||
      incidentCategory !== 'asset-load' ||
      !hasRecoveryEvidence ||
      recoveryAttemptedRef.current ||
      typeof fetch !== 'function'
    ) {
      return
    }
    recoveryAttemptedRef.current = true
    void recoverFromNewerBuild({
      currentBuildId: CURRENT_BUILD_ID,
      onReload: (url) => {
        window.history.replaceState(window.history.state, '', url)
        window.location.reload()
      },
      pageUrl: window.location.href,
      request: (input, init) => fetch(input, init),
      versionUrl: getAppVersionUrl(getBaseUrl(), window.location.origin),
    })
  }, [assetPath, assetProbe, incidentCategory, incidentId])

  useEffect(() => {
    const handlePreloadError = (event: Event) => {
      reportLoadingError(getPreloadErrorPayload(event), 'vite-preload')
    }
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (!isLikelyStaleChunkError(event.reason)) return
      event.preventDefault()
      reportLoadingError(event.reason, 'unhandled-rejection')
    }
    const handleWindowError = (event: ErrorEvent) => {
      if (!isLikelyStaleChunkError(event.error) && !isLikelyStaleChunkError(event.message)) return
      event.preventDefault()
      reportLoadingError(event.error ?? event.message, 'window-error')
    }

    window.addEventListener('vite:preloadError', handlePreloadError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    window.addEventListener('error', handleWindowError)
    return () => {
      window.removeEventListener('vite:preloadError', handlePreloadError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      window.removeEventListener('error', handleWindowError)
    }
  }, [reportLoadingError])

  return {
    incident,
    refresh: () => {
      window.location.reload()
    },
    reportLoadingError,
  }
}

function getPreloadErrorPayload(event: Event): unknown {
  return 'payload' in event ? (event as Event & {payload?: unknown}).payload : event
}

function createIncidentId(source: LoadingIncidentSource): string {
  const prefix = source === 'vite-preload' ? 'MODULE' : 'ERROR'
  const randomPart =
    typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID().replaceAll('-', '').slice(0, 8)
      : Math.random().toString(16).slice(2, 10).padEnd(8, '0')
  return `${prefix}-${randomPart.toUpperCase()}`
}

function getPlatformDescription(userAgent: string): string {
  if (/Android/i.test(userAgent)) return 'Android'
  if (/iPhone|iPad|iPod/i.test(userAgent)) return 'iOS'
  if (/Windows/i.test(userAgent)) return 'Windows'
  if (/Macintosh|Mac OS X/i.test(userAgent)) return 'macOS'
  if (/Linux/i.test(userAgent)) return 'Linux'
  return 'Unknown platform'
}

function getConnectionType(navigatorValue: Navigator): string | undefined {
  const connection = (navigatorValue as Navigator & {connection?: {effectiveType?: unknown}})
    .connection
  return typeof connection?.effectiveType === 'string' ? connection.effectiveType : undefined
}

function getAssetBasePath(): string {
  return new URL('assets/', new URL(getBaseUrl(), window.location.origin)).pathname
}

function getCurrentBuildId(): string {
  const configuredBuildId: unknown = import.meta.env.VITE_SKEYDB_BUILD_ID
  return typeof configuredBuildId === 'string' && configuredBuildId.trim() !== ''
    ? configuredBuildId
    : 'dev'
}

function getBaseUrl(): string {
  const configuredBaseUrl: unknown = import.meta.env.BASE_URL
  return typeof configuredBaseUrl === 'string' && configuredBaseUrl.trim() !== ''
    ? configuredBaseUrl
    : '/'
}
