import {describe, expect, it} from 'vitest'

import {getLegacyHashRouteReplacement, getRouterBasename} from './legacy-hash-routing'

describe('legacy hash routing', () => {
  it('rewrites root hash routes to clean paths', () => {
    expect(
      getLegacyHashRouteReplacement({
        basePath: '/',
        hash: '#/database',
        pathname: '/',
        search: '',
      }),
    ).toBe('/database')
  })

  it('rewrites project-page hash routes under the configured base path', () => {
    expect(
      getLegacyHashRouteReplacement({
        basePath: '/SKeyDB/',
        hash: '#/migrate/export?code=abc',
        pathname: '/SKeyDB/',
        search: '',
      }),
    ).toBe('/SKeyDB/migrate/export?code=abc')
  })

  it('preserves pre-hash query strings when the hash route has no query', () => {
    expect(
      getLegacyHashRouteReplacement({
        basePath: '/',
        hash: '#/builder',
        pathname: '/',
        search: '?classic=1',
      }),
    ).toBe('/builder?classic=1')
  })

  it('ignores non-route hashes', () => {
    expect(
      getLegacyHashRouteReplacement({
        basePath: '/',
        hash: '#main-content',
        pathname: '/',
        search: '',
      }),
    ).toBeNull()
  })

  it('normalizes router basenames for root and project deployments', () => {
    expect(getRouterBasename('/')).toBeUndefined()
    expect(getRouterBasename('/SKeyDB/')).toBe('/SKeyDB')
  })
})
