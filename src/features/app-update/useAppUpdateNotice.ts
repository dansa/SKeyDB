import {useCallback, useEffect, useState} from 'react'

import {
  getAppVersionUrl,
  isDifferentAppVersion,
  parseAppVersionSnapshot,
} from '@/domain/app-version'

const VERSION_CHECK_INTERVAL_MS = 10 * 60 * 1000
const CURRENT_BUILD_ID = getCurrentBuildId()

export interface AppUpdateNoticeState {
  available: boolean
  dismiss: () => void
  refresh: () => void
}

export function useAppUpdateNotice(): AppUpdateNoticeState {
  const [availableBuildId, setAvailableBuildId] = useState<string | null>(null)
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
        setAvailableBuildId(snapshot.buildId)
      }
    } catch {
      // Version checks are a convenience. A transient network failure should stay invisible.
    }
  }, [dismissedBuildId, versionUrl])

  useEffect(() => {
    const initialCheckId = window.setTimeout(() => void checkVersion(), 0)
    const intervalId = window.setInterval(() => void checkVersion(), VERSION_CHECK_INTERVAL_MS)
    const checkWhenVisible = () => {
      if (document.visibilityState === 'visible') void checkVersion()
    }
    const checkOnFocus = () => void checkVersion()

    document.addEventListener('visibilitychange', checkWhenVisible)
    window.addEventListener('focus', checkOnFocus)
    return () => {
      window.clearTimeout(initialCheckId)
      window.clearInterval(intervalId)
      document.removeEventListener('visibilitychange', checkWhenVisible)
      window.removeEventListener('focus', checkOnFocus)
    }
  }, [checkVersion])

  return {
    available: availableBuildId !== null,
    dismiss: () => {
      setDismissedBuildId(availableBuildId)
      setAvailableBuildId(null)
    },
    refresh: () => {
      window.location.reload()
    },
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
