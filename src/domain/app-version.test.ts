import {describe, expect, it} from 'vitest'

import {
  getAppVersionUrl,
  isDifferentAppVersion,
  isLikelyStaleChunkError,
  parseAppVersionSnapshot,
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
})
