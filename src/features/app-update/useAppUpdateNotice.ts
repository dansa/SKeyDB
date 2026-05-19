import {useCallback, useEffect, useState} from 'react'

import {
  getAppVersionUrl,
  isDifferentAppVersion,
  isLikelyStaleChunkError,
  parseAppVersionSnapshot,
} from '@/domain/app-version'

import type {AppUpdateReason} from './AppUpdateNotice'

const VERSION_CHECK_INTERVAL_MS = 10 * 60 * 1000
const CURRENT_BUILD_ID = getCurrentBuildId()

type PendingAppUpdateNotice = {buildId: string; reason: 'version'} | {reason: 'chunk-load'} | null

export interface AppUpdateNoticeState {
  dismiss: () => void
  refresh: () => void
  reason: AppUpdateReason | null
}

export function useAppUpdateNotice(): AppUpdateNoticeState {
  const [notice, setNotice] = useState<PendingAppUpdateNotice>(null)
  const [dismissedBuildId, setDismissedBuildId] = useState<string | null>(null)
  const [versionUrl] = useState(() => {
    if (typeof window === 'undefined') return null
    return getAppVersionUrl(getBaseUrl(), window.location.origin)
  })

  const checkVersion = useCallback(async () => {
    if (!versionUrl || typeof fetch !== 'function') return

    try {
      const response = await fetch(withCacheBuster(versionUrl), {cache: 'no-store'})
      if (!response.ok) return

      const snapshot = parseAppVersionSnapshot(await response.json())
      if (
        snapshot &&
        snapshot.buildId !== dismissedBuildId &&
        isDifferentAppVersion(CURRENT_BUILD_ID, snapshot)
      ) {
        setNotice({buildId: snapshot.buildId, reason: 'version'})
      }
    } catch {
      // Version checks are a convenience. A transient network failure should stay invisible.
    }
  }, [dismissedBuildId, versionUrl])

  useEffect(() => {
    const initialCheckId = window.setTimeout(() => {
      void checkVersion()
    }, 0)

    const intervalId = window.setInterval(() => {
      void checkVersion()
    }, VERSION_CHECK_INTERVAL_MS)

    const checkWhenVisible = () => {
      if (document.visibilityState === 'visible') {
        void checkVersion()
      }
    }
    const checkOnFocus = () => {
      void checkVersion()
    }

    document.addEventListener('visibilitychange', checkWhenVisible)
    window.addEventListener('focus', checkOnFocus)
    return () => {
      window.clearTimeout(initialCheckId)
      window.clearInterval(intervalId)
      document.removeEventListener('visibilitychange', checkWhenVisible)
      window.removeEventListener('focus', checkOnFocus)
    }
  }, [checkVersion])

  useEffect(() => {
    const handlePreloadError = (event: Event) => {
      event.preventDefault()
      setNotice({reason: 'chunk-load'})
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (isLikelyStaleChunkError(event.reason)) {
        event.preventDefault()
        setNotice({reason: 'chunk-load'})
      }
    }

    const handleWindowError = (event: ErrorEvent) => {
      if (isLikelyStaleChunkError(event.error) || isLikelyStaleChunkError(event.message)) {
        event.preventDefault()
        setNotice({reason: 'chunk-load'})
      }
    }

    window.addEventListener('vite:preloadError', handlePreloadError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    window.addEventListener('error', handleWindowError)
    return () => {
      window.removeEventListener('vite:preloadError', handlePreloadError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      window.removeEventListener('error', handleWindowError)
    }
  }, [])

  return {
    dismiss: () => {
      if (notice?.reason === 'version') {
        setDismissedBuildId(notice.buildId)
      }
      setNotice(null)
    },
    refresh: () => {
      window.location.reload()
    },
    reason: notice?.reason ?? null,
  }
}

function withCacheBuster(url: string): string {
  const parsedUrl = new URL(url)
  parsedUrl.searchParams.set('check', Date.now().toString())
  return parsedUrl.toString()
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
