import type {ReactNode} from 'react'

import {useMeasuredElementRect} from './layout-hooks'
import {useStickyMaxHeight} from './useStickyMaxHeight'

interface BuilderDesktopLayoutProps {
  toolbar: ReactNode
  teamStage: ReactNode
  teamsPanel: ReactNode
  picker: ReactNode
}

export function BuilderDesktopLayout({
  toolbar,
  teamStage,
  teamsPanel,
  picker,
}: BuilderDesktopLayoutProps) {
  const {height: builderZoneHeight, ref: builderZoneRef} = useMeasuredElementRect()
  const {ref: pickerRef, maxHeight} = useStickyMaxHeight()
  const pickerRailHeight =
    builderZoneHeight > 0 && maxHeight
      ? Math.max(builderZoneHeight, maxHeight)
      : builderZoneHeight || maxHeight
  const pickerStyle = {
    ...(pickerRailHeight ? {height: `${String(pickerRailHeight)}px`} : {}),
    ...(builderZoneHeight > 0 ? {minHeight: `${String(builderZoneHeight)}px`} : {}),
    ...(pickerRailHeight ? {maxHeight: `${String(pickerRailHeight)}px`} : {}),
  }

  return (
    <div className='mx-auto w-full max-w-[1450px] px-4 py-4' data-testid='builder-desktop-layout'>
      <div className='mb-4' data-testid='builder-desktop-toolbar-zone'>
        {toolbar}
      </div>
      <div
        className='grid items-start gap-4 xl:gap-5'
        data-testid='builder-desktop-main-grid'
        style={{
          gridTemplateColumns: 'minmax(0, 1fr) minmax(22rem, 23rem)',
          minWidth: '54rem',
        }}
      >
        <div className='min-w-0 space-y-4' data-testid='builder-desktop-builder-column'>
          <section data-testid='builder-desktop-builder-zone' ref={builderZoneRef}>
            {teamStage}
          </section>
          <div>{teamsPanel}</div>
        </div>
        <aside
          className='sticky top-4 min-h-[320px] overflow-hidden'
          data-testid='builder-desktop-picker-rail'
          ref={pickerRef}
          style={pickerStyle}
        >
          {picker}
        </aside>
      </div>
    </div>
  )
}
