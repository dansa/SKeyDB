import {describe, expect, it, vi} from 'vitest'

import {
  getAppVersionUrl,
  getLoadingIncidentRecoveryUrl,
  hasLoadingIncidentRecoveryMarker,
  isDifferentAppVersion,
  isLikelyStaleChunkError,
  parseAppVersionSnapshot,
  recoverFromNewerBuild,
  removeLoadingIncidentRecoveryMarker,
} from './app-version'

describe('app-version', () => {
  it('builds the version URL from the configured base path', () => {
    expect(getAppVersionUrl('/', 'https://skeydb.com')).toBe('https://skeydb.com/version.json')
    expect(getAppVersionUrl('/SKeyDB/', 'https://dansa.github.io')).toBe(
      'https://dansa.github.io/SKeyDB/version.json',
    )
  })

  it('parses valid version snapshots and rejects unusable values', () => {
    expect(
      parseAppVersionSnapshot({buildId: 'abc123', generatedAt: '2026-05-19T00:00:00Z'}),
    ).toEqual({
      buildId: 'abc123',
      generatedAt: '2026-05-19T00:00:00Z',
    })

    expect(parseAppVersionSnapshot({buildId: ''})).toBeNull()
    expect(parseAppVersionSnapshot(null)).toBeNull()
  })

  it('detects when a remote snapshot belongs to a different deployed build', () => {
    expect(isDifferentAppVersion('current', {buildId: 'next'})).toBe(true)
    expect(isDifferentAppVersion('current', {buildId: 'current'})).toBe(false)
    expect(isDifferentAppVersion('current', null)).toBe(false)
  })

  it('recognizes stale dynamic chunk loading failures', () => {
    expect(
      isLikelyStaleChunkError(
        new TypeError(
          'error loading dynamically imported module: https://skeydb.com/assets/DZoneHistoryPage-D28_7me0.js',
        ),
      ),
    ).toBe(true)
    expect(
      isLikelyStaleChunkError(
        'Loading module from "https://dansa.github.io/SKeyDB/assets/TimelinePage.js" was blocked because of a disallowed MIME type ("text/html").',
      ),
    ).toBe(true)
    expect(isLikelyStaleChunkError(new Error('ordinary render failure'))).toBe(false)
  })

  it('adds and removes a one-shot loading recovery marker without changing route data', () => {
    const marked = getLoadingIncidentRecoveryUrl(
      'https://skeydb.com/database?filter=owned#awakener-24',
    )

    expect(marked).toBe('https://skeydb.com/database?filter=owned&skeydb-reload=1#awakener-24')
    expect(hasLoadingIncidentRecoveryMarker(marked)).toBe(true)
    expect(removeLoadingIncidentRecoveryMarker(marked)).toBe(
      'https://skeydb.com/database?filter=owned#awakener-24',
    )
    expect(hasLoadingIncidentRecoveryMarker('https://skeydb.com/database')).toBe(false)
  })

  it('reloads through the supplied callback only when the version document is newer', async () => {
    const request = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({buildId: 'next'}), {
        headers: {'content-type': 'application/json'},
        status: 200,
      }),
    )
    const reload = vi.fn()

    await expect(
      recoverFromNewerBuild({
        currentBuildId: 'current',
        onReload: reload,
        pageUrl: 'https://skeydb.com/database?filter=owned#awakener-24',
        request,
        versionUrl: 'https://skeydb.com/version.json',
      }),
    ).resolves.toBe(true)
    expect(reload).toHaveBeenCalledWith(
      'https://skeydb.com/database?filter=owned&skeydb-reload=1#awakener-24',
    )

    request.mockResolvedValueOnce(new Response(JSON.stringify({buildId: 'current'}), {status: 200}))
    await expect(
      recoverFromNewerBuild({
        currentBuildId: 'current',
        onReload: reload,
        pageUrl: 'https://skeydb.com/database?filter=owned#awakener-24',
        request,
        versionUrl: 'https://skeydb.com/version.json',
      }),
    ).resolves.toBe(false)
    expect(reload).toHaveBeenCalledTimes(1)
  })
})
