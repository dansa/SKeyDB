import type {ReactNode} from 'react'

import {TeamHeader} from './TeamHeader'
import {TeamTabs} from './TeamTabs'

interface BuilderTabletLayoutProps {
  toolbar: ReactNode
  teamCards: ReactNode
  picker: ReactNode
}

export function BuilderTabletLayout({toolbar, teamCards, picker}: BuilderTabletLayoutProps) {
  const quickLineupButton = (
    <button
      className='ml-4 border border-slate-500/45 px-2 py-0.5 text-[9px] tracking-wide text-slate-300 uppercase'
      type='button'
    >
      Quick Lineup
    </button>
  )

  return (
    <div className='mx-auto w-full max-w-[900px] px-3 py-3'>
      {toolbar ? <div className='mb-2'>{toolbar}</div> : null}

      <div
        className='flex flex-col overflow-hidden border border-slate-500/45'
        style={{maxHeight: 'min(44dvh, 30rem)'}}
      >
        {picker}
      </div>

      <TeamTabs className='mt-2' />
      <TeamHeader
        actions={quickLineupButton}
        className='border border-t-0 border-slate-500/45'
        showPosseName
      />

      <div className='border border-t-0 border-slate-500/45 px-3 pb-3 [&_.builder-card]:aspect-[25/50]'>
        <div className='mt-2' style={{maxWidth: 'min(100%, 44rem)'}}>
          {teamCards}
        </div>
      </div>
    </div>
  )
}
