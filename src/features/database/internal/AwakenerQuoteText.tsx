import {useId, useState} from 'react'

import {loadAwakenerQuoteExchange, type AwakenerQuoteExchangeLine} from '@/domain/awakener-lore'
import type {AwakenerFullRecord, AwakenerQuote} from '@/domain/awakeners-full'

import {getDatabaseDetailBodyStyle} from './database-detail-typography'
import {WheelLoreText} from './WheelLoreText'

type ExchangeState =
  | {status: 'idle'}
  | {status: 'loading'}
  | {status: 'error'}
  | {status: 'ready'; lines: AwakenerQuoteExchangeLine[]}

const EXCHANGE_ACTION_CLASS =
  'min-h-11 py-2 text-left text-slate-300 underline decoration-slate-600 underline-offset-4 transition-colors hover:text-amber-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200 disabled:cursor-wait'

export function AwakenerQuoteText({
  fullData,
  quote,
}: {
  fullData: AwakenerFullRecord
  quote: AwakenerQuote
}) {
  const [state, setState] = useState<ExchangeState>({status: 'idle'})
  const [expanded, setExpanded] = useState(false)
  const exchangeId = useId()

  async function openExchange() {
    setExpanded(true)
    if (state.status === 'ready' || state.status === 'loading') return
    setState({status: 'loading'})
    try {
      const lines = await loadAwakenerQuoteExchange(fullData, quote)
      setState({status: 'ready', lines})
    } catch {
      setState({status: 'error'})
    }
  }

  return (
    <>
      {expanded && state.status === 'ready' ? (
        <div aria-label='Full exchange' className='space-y-5' id={exchangeId} role='region'>
          {state.lines.map((line, index) => (
            <div key={`${line.awakenerId}:${line.quote.id}:${String(index)}`}>
              <p
                style={getDatabaseDetailBodyStyle()}
                className='mb-1 font-semibold text-amber-100/90'
              >
                {line.speakerName}
              </p>
              <WheelLoreText defaultExpanded lore={line.quote.content} previewLineCount={999} />
            </div>
          ))}
        </div>
      ) : (
        <WheelLoreText defaultExpanded lore={quote.content} previewLineCount={999} />
      )}
      {quote.exchange?.length ? (
        <div className='mt-1'>
          {state.status === 'error' && expanded ? (
            <p style={getDatabaseDetailBodyStyle()} className='mt-2 text-slate-300' role='alert'>
              Could not load the full exchange. Your quote is still available.
            </p>
          ) : null}
          <button
            aria-controls={expanded && state.status === 'ready' ? exchangeId : undefined}
            aria-expanded={expanded}
            className={EXCHANGE_ACTION_CLASS}
            style={getDatabaseDetailBodyStyle()}
            disabled={state.status === 'loading'}
            onClick={() => {
              if (expanded && state.status === 'ready') setExpanded(false)
              else void openExchange()
            }}
            type='button'
          >
            {state.status === 'loading'
              ? 'Loading exchange…'
              : expanded && state.status === 'ready'
                ? 'Hide exchange'
                : expanded && state.status === 'error'
                  ? 'Retry exchange'
                  : 'Read full exchange'}
          </button>
        </div>
      ) : null}
    </>
  )
}
