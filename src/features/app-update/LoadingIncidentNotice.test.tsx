import {fireEvent, render, screen} from '@testing-library/react'
import {afterEach, describe, expect, it, vi} from 'vitest'

import type {LoadingIncident} from '@/domain/loading-incident'

import {LoadingIncidentNotice} from './LoadingIncidentNotice'

const originalClipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard')

afterEach(() => {
  if (originalClipboard) {
    Object.defineProperty(navigator, 'clipboard', originalClipboard)
  } else {
    Reflect.deleteProperty(navigator, 'clipboard')
  }
  vi.restoreAllMocks()
})

describe('LoadingIncidentNotice', () => {
  it('waits for the bounded asset probe before enabling diagnostic copying', () => {
    const pendingIncident = createIncident()
    Reflect.deleteProperty(pendingIncident, 'assetProbe')
    const {rerender} = render(
      <LoadingIncidentNotice incident={pendingIncident} onRefresh={() => undefined} />,
    )

    expect(screen.getByRole('button', {name: /preparing diagnostics/i})).toBeDisabled()

    rerender(<LoadingIncidentNotice incident={createIncident()} onRefresh={() => undefined} />)
    expect(screen.getByRole('button', {name: /copy diagnostics/i})).toBeEnabled()
  })

  it('reveals selectable diagnostics when clipboard access is denied', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {writeText: vi.fn().mockRejectedValue(new DOMException('Denied', 'NotAllowedError'))},
    })

    render(<LoadingIncidentNotice incident={createIncident()} onRefresh={() => undefined} />)

    fireEvent.click(screen.getByRole('button', {name: /copy diagnostics/i}))

    const fallback = await screen.findByRole('textbox', {
      name: /copy these diagnostic details manually/i,
    })
    expect((fallback as HTMLTextAreaElement).value).toContain('MODULE-7F2A')
    expect(fallback).toHaveAttribute('readonly')
  })

  it('uses the same selectable fallback when the Clipboard API is unavailable', async () => {
    Reflect.deleteProperty(navigator, 'clipboard')

    render(<LoadingIncidentNotice incident={createIncident()} onRefresh={() => undefined} />)
    fireEvent.click(screen.getByRole('button', {name: /copy diagnostics/i}))

    const fallback = await screen.findByRole('textbox', {
      name: /copy these diagnostic details manually/i,
    })
    expect((fallback as HTMLTextAreaElement).value).toContain('MODULE-7F2A')
  })

  it('announces successful clipboard copying without exposing the fallback', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {configurable: true, value: {writeText}})

    render(<LoadingIncidentNotice incident={createIncident()} onRefresh={() => undefined} />)
    fireEvent.click(screen.getByRole('button', {name: /copy diagnostics/i}))

    const copiedStatus = await screen.findByText(/diagnostics copied/i)
    expect(copiedStatus).toHaveAttribute('aria-live', 'polite')
    expect(copiedStatus.closest('section')).toHaveAttribute('aria-label', 'SKeyDB loading incident')
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('MODULE-7F2A'))
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('does not carry clipboard status into a replacement incident', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {writeText: vi.fn().mockResolvedValue(undefined)},
    })
    const {rerender} = render(
      <LoadingIncidentNotice incident={createIncident()} onRefresh={() => undefined} />,
    )
    fireEvent.click(screen.getByRole('button', {name: /copy diagnostics/i}))
    expect(await screen.findByText(/diagnostics copied/i)).toBeInTheDocument()

    rerender(
      <LoadingIncidentNotice
        incident={{...createIncident(), incidentId: 'MODULE-NEW'}}
        onRefresh={() => undefined}
      />,
    )

    expect(screen.queryByText(/diagnostics copied/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })
})

function createIncident(): LoadingIncident {
  return {
    assetPath: '/assets/DatabasePage.js',
    assetProbe: {
      contentType: 'application/javascript',
      outcome: 'javascript-response',
      status: 200,
    },
    browser: {family: 'Chrome', major: 138},
    buildId: 'f4e505f3',
    category: 'asset-load',
    errorSummary: 'Failed to fetch dynamically imported module',
    incidentId: 'MODULE-7F2A',
    occurredAt: '2026-07-31T09:56:12.000Z',
    online: true,
    pathname: '/database',
    platform: 'Android',
    source: 'vite-preload',
  }
}
