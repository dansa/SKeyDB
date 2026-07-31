import {describe, expect, it, vi} from 'vitest'

import {
  attachLoadingIncidentAssetProbe,
  coalesceLoadingIncident,
  createLoadingIncident,
  formatLoadingIncidentDiagnostics,
  getBrowserDiagnostic,
  probeLoadingIncidentAsset,
  type LoadingIncident,
} from './loading-incident'

describe('loading incident diagnostics', () => {
  it('reports a failed same-origin page asset without copying URL secrets', () => {
    const incident = createLoadingIncident({
      buildId: 'f4e505f3',
      environment: {
        browser: {family: 'Chrome', major: 109},
        connectionType: '4g',
        online: true,
        origin: 'https://skeydb.com',
        pathname: '/database',
        platform: 'Android',
      },
      error: new TypeError(
        'Failed to fetch dynamically imported module: https://skeydb.com/assets/DatabasePage.js?migration=secret-value#private',
      ),
      incidentId: 'MODULE-7F2A',
      occurredAt: '2026-07-31T09:56:12.000Z',
      source: 'vite-preload',
    })

    expect(formatLoadingIncidentDiagnostics(incident)).toBe(`SKeyDB diagnostic report
Time: 2026-07-31T09:56:12.000Z
Reference: MODULE-7F2A
Page: /database
Build: f4e505f3
Category: asset-load
Browser: Chrome 109
Platform: Android
Compatibility: Chrome 109 is below SKeyDB's supported Chrome 110 target
Online: yes
Connection: 4g
Error: Failed to fetch dynamically imported module
Fingerprint: ERR-8FD1D59C
Asset: /assets/DatabasePage.js`)
  })

  it('recognizes the configured GitHub Pages asset namespace', () => {
    const incident = createLoadingIncident({
      buildId: 'build-1',
      environment: {
        assetBasePath: '/SKeyDB/assets/',
        browser: {family: 'Chrome', major: 138},
        online: true,
        origin: 'https://dansa.github.io',
        pathname: '/SKeyDB/database',
        platform: 'Android',
      },
      error:
        'Failed to fetch dynamically imported module: https://dansa.github.io/SKeyDB/assets/DatabasePage.js?secret=value',
      incidentId: 'MODULE-A1B2C3D4',
      occurredAt: '2026-07-31T10:00:00.000Z',
      source: 'vite-preload',
    })

    expect(incident.assetPath).toBe('/SKeyDB/assets/DatabasePage.js')
  })

  it('identifies when a page asset probe receives HTML instead of JavaScript', async () => {
    const probe = await probeLoadingIncidentAsset({
      assetPath: '/assets/DatabasePage.js',
      origin: 'https://skeydb.com',
      request: async () =>
        new Response('<!doctype html>', {
          headers: {'content-type': 'text/html; charset=utf-8'},
          status: 200,
        }),
    })

    expect(probe).toEqual({
      contentType: 'text/html',
      outcome: 'html-response',
      status: 200,
    })
    const incident = createLoadingIncident({
      buildId: 'f4e505f3',
      environment: {
        browser: {family: 'Chrome', major: 138},
        online: true,
        origin: 'https://skeydb.com',
        pathname: '/database',
        platform: 'Android',
      },
      error: 'Failed to fetch dynamically imported module: /assets/DatabasePage.js',
      incidentId: 'MODULE-70C1A210',
      occurredAt: '2026-07-31T10:00:00.000Z',
      source: 'vite-preload',
    })

    expect(
      formatLoadingIncidentDiagnostics(attachLoadingIncidentAssetProbe(incident, probe)),
    ).toContain('Asset probe: 200 text/html (HTML response)')
  })

  it('does not probe an asset outside the SKeyDB origin', async () => {
    const request = vi.fn()

    const probe = await probeLoadingIncidentAsset({
      assetPath: 'https://example.com/assets/DatabasePage.js',
      origin: 'https://skeydb.com',
      request,
    })

    expect(probe).toEqual({outcome: 'not-probed'})
    expect(request).not.toHaveBeenCalled()
  })

  it('reports a bounded asset probe that cannot reach the network', async () => {
    const probe = await probeLoadingIncidentAsset({
      assetPath: '/assets/BuilderPage.js',
      origin: 'https://skeydb.com',
      request: async (_input, init) =>
        await new Promise<Response>((_resolve, reject) => {
          init.signal?.addEventListener('abort', () => {
            reject(new DOMException('The operation was aborted', 'AbortError'))
          })
        }),
      timeoutMs: 1,
    })

    expect(probe).toEqual({outcome: 'network-error'})
  })

  it('does not describe an unexpected successful MIME type as healthy JavaScript', async () => {
    const probe = await probeLoadingIncidentAsset({
      assetPath: '/assets/BuilderPage.js',
      origin: 'https://skeydb.com',
      request: async () =>
        new Response('not javascript', {
          headers: {'content-type': 'text/plain'},
          status: 200,
        }),
    })

    expect(probe).toEqual({
      contentType: 'text/plain',
      outcome: 'unexpected-mime',
      status: 200,
    })
  })

  it('distinguishes missing assets, redirects, and healthy JavaScript responses', async () => {
    const missing = await probeLoadingIncidentAsset({
      assetPath: '/assets/missing.js',
      origin: 'https://skeydb.com',
      request: async () =>
        new Response('<!doctype html>', {
          headers: {'content-type': 'text/html'},
          status: 404,
        }),
    })
    const redirectRequest = vi.fn(
      async () =>
        new Response(null, {headers: {location: 'https://example.com/blocked.js'}, status: 302}),
    )
    const redirected = await probeLoadingIncidentAsset({
      assetPath: '/assets/redirected.js',
      origin: 'https://skeydb.com',
      request: redirectRequest,
    })
    const healthy = await probeLoadingIncidentAsset({
      assetPath: '/assets/healthy.js',
      origin: 'https://skeydb.com',
      request: async () =>
        new Response('export {}', {
          headers: {'content-type': 'application/javascript'},
          status: 200,
        }),
    })

    expect(missing).toEqual({contentType: 'text/html', outcome: 'missing-asset', status: 404})
    expect(redirected).toEqual({outcome: 'redirect', status: 302})
    expect(redirectRequest).toHaveBeenCalledWith(
      'https://skeydb.com/assets/redirected.js',
      expect.objectContaining({redirect: 'manual'}),
    )
    expect(healthy).toEqual({
      contentType: 'application/javascript',
      outcome: 'javascript-response',
      status: 200,
    })
  })

  it('reports an immediate network rejection without inspecting a response body', async () => {
    const probe = await probeLoadingIncidentAsset({
      assetPath: '/assets/blocked.js',
      origin: 'https://skeydb.com',
      request: async () => await Promise.reject(new TypeError('blocked by network policy')),
    })

    expect(probe).toEqual({outcome: 'network-error'})
  })

  it('parses supported browser families without guessing for unknown or iOS wrappers', () => {
    expect(
      getBrowserDiagnostic('Mozilla/5.0 (Macintosh; Intel Mac OS X) Version/15.6 Safari/605.1.15'),
    ).toEqual({family: 'Safari', major: 15})
    expect(getBrowserDiagnostic('SKeyDB Test Browser')).toEqual({family: 'Unknown'})
    expect(
      getBrowserDiagnostic(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0) CriOS/109.0 Mobile/15E148 Safari/604.1',
      ),
    ).toEqual({family: 'Chrome iOS', major: 109})
  })

  it('keeps a verified runtime crash classified as runtime while offline', () => {
    const incident = createLoadingIncident({
      buildId: 'build-1',
      componentStack: '\n    at BuilderPage (<anonymous>)',
      environment: {
        browser: {family: 'Chrome', major: 138},
        online: false,
        origin: 'https://skeydb.com',
        pathname: '/builder',
        platform: 'Android',
      },
      error: new Error('render failed'),
      incidentId: 'ERROR-OFFLINE',
      occurredAt: '2026-07-31T10:00:00.000Z',
      source: 'react-boundary',
    })

    expect(incident.category).toBe('runtime')
    expect(incident.componentNames).toEqual(['BuilderPage'])
    expect(incident.errorFingerprint).toMatch(/^ERR-/)
  })

  it('deduplicates only equivalent incidents inside the short correlation window', () => {
    const first = createRuntimeIncident({
      error: 'first failure',
      incidentId: 'ERROR-FIRST',
      occurredAt: '2026-07-31T10:00:00.000Z',
    })
    const duplicate = createRuntimeIncident({
      error: 'first failure',
      incidentId: 'ERROR-DUPLICATE',
      occurredAt: '2026-07-31T10:00:01.000Z',
    })
    const unrelated = createRuntimeIncident({
      error: 'second failure',
      incidentId: 'ERROR-SECOND',
      occurredAt: '2026-07-31T10:00:01.000Z',
    })
    const later = createRuntimeIncident({
      error: 'first failure',
      incidentId: 'ERROR-LATER',
      occurredAt: '2026-07-31T10:00:04.000Z',
    })

    expect(coalesceLoadingIncident(first, duplicate).incidentId).toBe('ERROR-FIRST')
    expect(coalesceLoadingIncident(first, unrelated).incidentId).toBe('ERROR-SECOND')
    expect(coalesceLoadingIncident(first, later).incidentId).toBe('ERROR-LATER')
  })

  it('does not merge different asset failures or navigations just because the path matches', () => {
    const first = createAssetIncident({
      error: 'Failed to fetch dynamically imported module: /assets/shared.js first',
      incidentId: 'MODULE-FIRST',
      pathname: '/database',
    })
    const differentFailure = createAssetIncident({
      error: 'Failed to fetch dynamically imported module: /assets/shared.js second',
      incidentId: 'MODULE-SECOND',
      pathname: '/database',
    })
    const differentNavigation = createAssetIncident({
      error: 'Failed to fetch dynamically imported module: /assets/shared.js first',
      incidentId: 'MODULE-ROUTE',
      pathname: '/builder',
    })

    expect(coalesceLoadingIncident(first, differentFailure).incidentId).toBe('MODULE-SECOND')
    expect(coalesceLoadingIncident(first, differentNavigation).incidentId).toBe('MODULE-ROUTE')
  })

  it('normalizes URL query and hash values out of asset fingerprints', () => {
    const first = createAssetIncident({
      error: 'Failed to fetch dynamically imported module: /assets/shared.js?token=first#private',
      incidentId: 'MODULE-FIRST',
      pathname: '/database',
    })
    const second = createAssetIncident({
      error: 'Failed to fetch dynamically imported module: /assets/shared.js?token=second#other',
      incidentId: 'MODULE-SECOND',
      pathname: '/database',
    })

    expect(second.errorFingerprint).toBe(first.errorFingerprint)
    expect(coalesceLoadingIncident(first, second).incidentId).toBe('MODULE-FIRST')
  })

  it('does not make support claims for embedded Chromium wrappers', () => {
    const webView = getBrowserDiagnostic(
      'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 Version/4.0 Chrome/109.0 Mobile Safari/537.36 wv',
    )
    const samsung = getBrowserDiagnostic(
      'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/109.0 Mobile Safari/537.36 SamsungBrowser/20.0',
    )

    expect(webView).toEqual({family: 'Unknown'})
    expect(samsung).toEqual({family: 'Unknown'})
    expect(createIncidentWithBrowser(webView).compatibilityConcern).toBeUndefined()
    expect(
      createIncidentWithBrowser({family: 'Chrome', major: 138}).compatibilityConcern,
    ).toBeUndefined()
  })

  it('fingerprints runtime failures without copying arbitrary error or stack content', () => {
    const incident = createLoadingIncident({
      buildId: 'f4e505f3',
      componentStack:
        '\n    at BuilderPage (https://skeydb.com/assets/BuilderPage.js?token=stack-secret:12:4)\n    at Suspense (<anonymous>)',
      environment: {
        browser: {family: 'Chrome', major: 138},
        online: true,
        origin: 'https://skeydb.com',
        pathname: '/builder?code=route-secret#private',
        platform: 'Android',
      },
      error: new Error('Could not render imported team route-secret for player@example.com'),
      incidentId: 'ERROR-19C5A11B',
      occurredAt: '2026-07-31T10:01:02.000Z',
      source: 'react-boundary',
    })

    const diagnostics = formatLoadingIncidentDiagnostics(incident)

    expect(diagnostics).toContain('Page: /builder')
    expect(diagnostics).toContain('Error: Unexpected application error')
    expect(diagnostics).toMatch(/Fingerprint: ERR-[A-F0-9]{8}/)
    expect(diagnostics).toContain('Components: BuilderPage > Suspense')
    expect(diagnostics).not.toMatch(/route-secret|stack-secret|player@example\.com/)
  })

  it('bounds every copied string and does not read saved browser data', () => {
    const getItem = vi.spyOn(Storage.prototype, 'getItem')
    const longAssetName = `${'a'.repeat(300)}.js`
    const incident = createLoadingIncident({
      buildId: `build-${'b'.repeat(300)}`,
      environment: {
        browser: {family: 'Chrome', major: 138},
        connectionType: `4g${'c'.repeat(300)}`,
        online: true,
        origin: 'https://skeydb.com',
        pathname: `/database/${'p'.repeat(300)}?secret=value`,
        platform: `Android${'d'.repeat(300)}`,
      },
      error: `Failed to fetch dynamically imported module: /assets/${longAssetName}?secret=value`,
      incidentId: `MODULE-${'e'.repeat(300)}`,
      occurredAt: `2026-07-31T10:00:00.000Z${'f'.repeat(300)}`,
      source: 'vite-preload',
    })
    const report = formatLoadingIncidentDiagnostics(
      attachLoadingIncidentAssetProbe(incident, {
        contentType: `text/plain${'g'.repeat(300)}\nsecret`,
        outcome: 'unexpected-mime',
        status: 200,
      }),
    )

    expect(getItem).not.toHaveBeenCalled()
    expect(report).not.toContain('?secret=')
    expect(report).not.toContain('\nsecret')
    expect(incident.assetPath?.length).toBeLessThanOrEqual(240)
    expect(report.split('\n').every((line) => line.length <= 260)).toBe(true)
    getItem.mockRestore()
  })
})

function createRuntimeIncident({
  error,
  incidentId,
  occurredAt,
}: {
  error: string
  incidentId: string
  occurredAt: string
}) {
  return createLoadingIncident({
    buildId: 'build-1',
    environment: {
      browser: {family: 'Chrome', major: 138},
      online: true,
      origin: 'https://skeydb.com',
      pathname: '/builder',
      platform: 'Android',
    },
    error: new Error(error),
    incidentId,
    occurredAt,
    source: 'react-boundary',
  })
}

function createAssetIncident({
  error,
  incidentId,
  pathname,
}: {
  error: string
  incidentId: string
  pathname: string
}) {
  return createLoadingIncident({
    buildId: 'build-1',
    environment: {
      browser: {family: 'Chrome', major: 138},
      online: true,
      origin: 'https://skeydb.com',
      pathname,
      platform: 'Android',
    },
    error,
    incidentId,
    occurredAt: '2026-07-31T10:00:00.000Z',
    source: 'vite-preload',
  })
}

function createIncidentWithBrowser(browser: LoadingIncident['browser']): LoadingIncident {
  return createLoadingIncident({
    buildId: 'build-1',
    environment: {
      browser,
      online: true,
      origin: 'https://skeydb.com',
      pathname: '/database',
      platform: 'Android',
    },
    error: new Error('render failed'),
    incidentId: 'ERROR-BROWSER',
    occurredAt: '2026-07-31T10:00:00.000Z',
    source: 'react-boundary',
  })
}
