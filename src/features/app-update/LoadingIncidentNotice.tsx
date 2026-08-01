import {useState} from 'react'

import {formatLoadingIncidentDiagnostics, type LoadingIncident} from '@/domain/loading-incident'

interface LoadingIncidentNoticeProps {
  incident: LoadingIncident
  onRefresh: () => void
}

type CopyResult =
  | {incidentId: string; state: 'copied'}
  | {diagnostics: string; incidentId: string; state: 'fallback'}

export function LoadingIncidentNotice({incident, onRefresh}: LoadingIncidentNoticeProps) {
  const [copyResult, setCopyResult] = useState<CopyResult | null>(null)
  const currentCopyResult = copyResult?.incidentId === incident.incidentId ? copyResult : null
  const diagnosticsReady = !incident.assetPath || incident.assetProbe !== undefined
  const copy = async () => {
    const diagnostics = formatLoadingIncidentDiagnostics(incident)
    try {
      const clipboard: unknown = Reflect.get(navigator, 'clipboard')
      if (!isClipboardWriter(clipboard)) throw new Error('Clipboard unavailable')
      await clipboard.writeText(diagnostics)
      setCopyResult({incidentId: incident.incidentId, state: 'copied'})
    } catch {
      setCopyResult({diagnostics, incidentId: incident.incidentId, state: 'fallback'})
    }
  }

  return (
    <div className='loading-incident-notice'>
      <section
        aria-label='SKeyDB loading incident'
        className='app-update-notice app-update-notice--urgent'
      >
        <div className='app-update-notice__copy' role='alert'>
          <strong>{getIncidentTitle(incident)}</strong>
          <span>{getIncidentExplanation(incident)}</span>
          {incident.compatibilityConcern ? <span>{incident.compatibilityConcern}.</span> : null}
          <span className='app-update-notice__reference'>Reference: {incident.incidentId}</span>
        </div>
        <div className='app-update-notice__actions'>
          <button className='app-update-notice__button' onClick={onRefresh} type='button'>
            Refresh
          </button>
          <button
            className='app-update-notice__dismiss'
            disabled={!diagnosticsReady}
            onClick={() => void copy()}
            type='button'
          >
            {diagnosticsReady ? 'Copy diagnostics' : 'Preparing diagnostics…'}
          </button>
        </div>
        {currentCopyResult?.state === 'fallback' ? (
          <label className='app-update-notice__diagnostics'>
            Copy these diagnostic details manually
            <textarea readOnly rows={10} value={currentCopyResult.diagnostics} />
          </label>
        ) : null}
        <span
          aria-atomic='true'
          aria-live='polite'
          className='app-update-notice__copy-status'
          role='status'
        >
          {getCopyStatus(currentCopyResult)}
        </span>
      </section>
    </div>
  )
}

function getCopyStatus(copyResult: CopyResult | null): string {
  if (copyResult?.state === 'copied') return 'Diagnostics copied.'
  if (copyResult?.state === 'fallback') {
    return 'Clipboard unavailable. Select the diagnostic details below to copy them manually.'
  }
  return ''
}

function isClipboardWriter(value: unknown): value is {writeText: (text: string) => Promise<void>} {
  return Boolean(
    value &&
    typeof value === 'object' &&
    'writeText' in value &&
    typeof value.writeText === 'function',
  )
}

function getIncidentTitle(incident: LoadingIncident): string {
  if (incident.category === 'offline') return 'SKeyDB appears to be offline.'
  if (incident.category === 'asset-load') return 'A required page file could not be loaded.'
  return 'This SKeyDB page encountered a problem while loading.'
}

function getIncidentExplanation(incident: LoadingIncident): string {
  if (incident.category === 'offline') {
    return 'Reconnect to the internet, then refresh the page.'
  }
  if (incident.category === 'asset-load') {
    if (incident.assetProbe?.outcome === 'missing-asset') {
      return 'The requested page file is missing from the site. Refresh once and copy diagnostics if it continues.'
    }
    if (incident.assetProbe?.outcome === 'html-response') {
      return 'The requested page file returned HTML instead of JavaScript. Refresh once and copy diagnostics if it continues.'
    }
    if (incident.assetProbe?.outcome === 'http-error') {
      const status =
        incident.assetProbe.status === undefined ? 'an error' : String(incident.assetProbe.status)
      return `The requested page file returned HTTP ${status}. Refresh once and copy diagnostics if it continues.`
    }
    if (incident.assetProbe?.outcome === 'network-error') {
      return 'The requested page file could not be reached. Check the connection, VPN, Private DNS, or content blockers.'
    }
    if (incident.assetProbe?.outcome === 'redirect') {
      return 'The requested page file was redirected unexpectedly. Refresh once and copy diagnostics if it continues.'
    }
    if (incident.assetProbe?.outcome === 'unexpected-mime') {
      const contentType = incident.assetProbe.contentType ?? 'an unexpected response type'
      return `The requested page file returned ${contentType} instead of JavaScript. Refresh once and copy diagnostics if it continues.`
    }
    if (incident.assetProbe?.outcome === 'javascript-response') {
      return 'The requested file is available now, but the browser could not load it. Refresh once and copy diagnostics if it continues.'
    }
    return 'This may be a temporary network, browser, or recently updated site problem.'
  }
  return 'Refresh the page and try again. You can copy diagnostic details if it keeps happening.'
}
