import {useId, useState} from 'react'

import {loadAwakenerQuoteExchange, type AwakenerQuoteExchangeLine} from '@/domain/awakener-lore'
import type {AwakenerFullRecord, AwakenerQuote} from '@/domain/awakeners-full'

import {getDatabaseDetailBodyStyle} from './database-detail-typography'
import {WheelLoreText} from './WheelLoreText'

type ExchangeLine = AwakenerQuoteExchangeLine & {key: string}
type ExchangeState =
  | {status: 'idle'}
  | {status: 'loading'}
  | {status: 'error'}
  | {status: 'ready'; lines: ExchangeLine[]; expanded: boolean}

const EXCHANGE_ACTION_CLASS =
  'min-h-11 py-2 text-left text-slate-300 underline decoration-slate-600 underline-offset-4 transition-colors hover:text-amber-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200 disabled:cursor-wait'

function identifyExchangeLines(lines: AwakenerQuoteExchangeLine[]): ExchangeLine[] {
  const occurrences = new Map<string, number>()
  return lines.map((line) => {
    const identity = JSON.stringify([line.awakenerId, line.quote.id])
    const occurrence = occurrences.get(identity) ?? 0
    occurrences.set(identity, occurrence + 1)
    return {...line, key: `${identity}:${String(occurrence)}`}
  })
}

function exchangeActionLabel(state: ExchangeState): string {
  switch (state.status) {
    case 'loading':
      return 'Loading exchange…'
    case 'error':
      return 'Retry exchange'
    case 'ready':
      return state.expanded ? 'Hide exchange' : 'Read full exchange'
    case 'idle':
      return 'Read full exchange'
  }
}

export function AwakenerQuoteText({
  fullData,
  quote,
}: {
  fullData: AwakenerFullRecord
  quote: AwakenerQuote
}) {
  const [state, setState] = useState<ExchangeState>({status: 'idle'})
  const exchangeId = useId()
  const showExchange = state.status === 'ready' && state.expanded

  async function toggleExchange() {
    if (state.status === 'loading') return
    if (state.status === 'ready') {
      setState({...state, expanded: !state.expanded})
      return
    }
    setState({status: 'loading'})
    try {
      const lines = identifyExchangeLines(await loadAwakenerQuoteExchange(fullData, quote))
      setState({status: 'ready', lines, expanded: true})
    } catch {
      setState({status: 'error'})
    }
  }

  return (
    <>
      <ExchangeContent state={state} quote={quote} exchangeId={exchangeId} />
      {quote.exchange?.length ? (
        <div className='mt-1'>
          {state.status === 'error' ? (
            <p style={getDatabaseDetailBodyStyle()} className='mt-2 text-slate-300' role='alert'>
              Could not load the full exchange. Your quote is still available.
            </p>
          ) : null}
          <button
            aria-controls={showExchange ? exchangeId : undefined}
            aria-expanded={state.status === 'ready' ? state.expanded : state.status !== 'idle'}
            className={EXCHANGE_ACTION_CLASS}
            style={getDatabaseDetailBodyStyle()}
            disabled={state.status === 'loading'}
            onClick={() => {
              void toggleExchange()
            }}
            type='button'
          >
            {exchangeActionLabel(state)}
          </button>
        </div>
      ) : null}
    </>
  )
}

function ExchangeContent({
  state,
  quote,
  exchangeId,
}: {
  state: ExchangeState
  quote: AwakenerQuote
  exchangeId: string
}) {
  if (state.status !== 'ready' || !state.expanded) {
    return <WheelLoreText defaultExpanded lore={quote.content} previewLineCount={999} />
  }
  return (
    <div aria-label='Full exchange' className='space-y-5' id={exchangeId} role='region'>
      {state.lines.map((line) => (
        <div key={line.key}>
          <p style={getDatabaseDetailBodyStyle()} className='mb-1 font-semibold text-amber-100/90'>
            {line.speakerName}
          </p>
          <WheelLoreText defaultExpanded lore={line.quote.content} previewLineCount={999} />
        </div>
      ))}
    </div>
  )
}
