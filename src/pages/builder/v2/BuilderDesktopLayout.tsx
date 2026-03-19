import type {ReactNode} from 'react'

import {useStickyMaxHeight} from './useStickyMaxHeight'

interface BuilderDesktopLayoutProps {
  toolbar: ReactNode
  activeTeamHeader: ReactNode
  teamCards: ReactNode
  teamsPanel: ReactNode
  picker: ReactNode
}

export function BuilderDesktopLayout({
  toolbar,
  activeTeamHeader,
  teamCards,
  teamsPanel,
  picker,
}: BuilderDesktopLayoutProps) {
  const {ref: pickerRef, maxHeight} = useStickyMaxHeight()

  return (
    <div className='mx-auto w-full max-w-[1400px] px-4 py-4'>
      <div className='mb-3'>{toolbar}</div>
      <div className='grid items-start gap-4 lg:grid-cols-[minmax(0,1.65fr)_minmax(20rem,34vw)]'>
        <div className='min-w-0 space-y-3'>
          {activeTeamHeader}
          <div>{teamCards}</div>
          <div>{teamsPanel}</div>
        </div>
        <div
          className='sticky top-4 min-h-[320px] overflow-y-auto'
          ref={pickerRef}
          style={maxHeight ? {maxHeight: `${String(maxHeight)}px`} : undefined}
        >
          {picker}
        </div>
      </div>
    </div>
  )
}
