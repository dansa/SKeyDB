import type {ReactNode, RefObject} from 'react'

import {BuilderToolbarShell} from './BuilderToolbarShell'
import {useMeasuredElementSize, useViewportSize} from './layout-hooks'
import {
  getTabletMainZoneHeight,
  getTabletPickerHeight,
  getTabletStageHeight,
  TABLET_LAYOUT_MIN_HEIGHT_PX,
} from './tablet-layout-metrics'

interface BuilderTabletLayoutProps {
  builderZoneRef?: RefObject<HTMLElement | null>
  toolbar: ReactNode
  teamStage: ReactNode
  picker: ReactNode
  teamsPanel: ReactNode
}

export function BuilderTabletLayout({
  builderZoneRef,
  toolbar,
  teamStage,
  picker,
  teamsPanel,
}: BuilderTabletLayoutProps) {
  const viewport = useViewportSize()
  const {ref: mainZoneRef, width: mainZoneWidth} = useMeasuredElementSize()
  const mainZoneHeight = getTabletMainZoneHeight(viewport.height)
  const pickerHeight = getTabletPickerHeight({mainZoneHeight, mainZoneWidth})
  const stageHeight = getTabletStageHeight({mainZoneHeight, mainZoneWidth})
  const shouldLockZoneHeight = viewport.height >= TABLET_LAYOUT_MIN_HEIGHT_PX

  return (
    <div
      className='mx-auto w-full max-w-[900px] px-2 py-2 sm:px-3 sm:py-3'
      data-testid='builder-tablet-layout'
    >
      <section
        className='min-w-0 overflow-hidden border border-slate-500/45 bg-[#0c121c]'
        data-testid='builder-tablet-shell'
        ref={builderZoneRef}
      >
        {toolbar ? <BuilderToolbarShell>{toolbar}</BuilderToolbarShell> : null}
        <div
          className='flex min-w-0 flex-col'
          data-builder-main-zone='true'
          data-mobile-builder-snap-target='true'
          data-testid='builder-tablet-main-zone'
          ref={mainZoneRef}
          style={
            shouldLockZoneHeight
              ? {
                  height: `${String(mainZoneHeight)}px`,
                  minHeight: `${String(mainZoneHeight)}px`,
                }
              : {
                  minHeight: `${String(mainZoneHeight)}px`,
                }
          }
        >
          <div
            className='flex min-w-0 flex-col overflow-hidden border-b border-slate-500/45'
            data-testid='builder-tablet-picker-shell'
            style={pickerHeight > 0 ? {height: `${String(pickerHeight)}px`} : undefined}
          >
            {picker}
          </div>

          <div
            className='min-h-0 min-w-0'
            style={stageHeight > 0 ? {height: `${String(stageHeight)}px`} : undefined}
          >
            {teamStage}
          </div>
        </div>
      </section>

      <div className='mt-3' data-mobile-builder-exit-zone='true'>
        {teamsPanel}
      </div>
    </div>
  )
}
