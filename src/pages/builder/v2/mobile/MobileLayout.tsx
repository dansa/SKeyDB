import {useCallback, useState, type ReactNode} from 'react'

import {BuilderTeamsPanel} from '../BuilderTeamsPanel'
import {useBuilderStore} from '../store/builder-store'
import {selectActiveTeam} from '../store/selectors'
import {TeamHeader} from '../TeamHeader'
import {TeamTabs} from '../TeamTabs'
import {MobileBuilderScreen} from './MobileBuilderScreen'
import {MobileFocusedCard} from './MobileFocusedCard'
import {MobileOverviewGrid} from './MobileOverviewGrid'
import {MobilePickerDrawer} from './MobilePickerDrawer'
import {MobileBuilderWideBar, MobileCurrentTeamBar} from './MobileToolbars'
import {
  focusedView,
  OVERVIEW_VIEW,
  pickerView,
  type MobileView,
  type PickerContext,
} from './MobileViewState'

interface MobileLayoutProps {
  renderPicker: (onItemSelected: () => void) => ReactNode
  onImport: () => void
  onExportAll: () => void
  onExportIngame: () => void
  canUndoResetBuilder: boolean
  onRequestResetBuilder: () => void
  onUndoResetBuilder: () => void
  shellMode?: 'device' | 'preview'
  utilityBar?: ReactNode
}

export function MobileLayout({
  renderPicker,
  onImport,
  onExportAll,
  onExportIngame,
  canUndoResetBuilder,
  onRequestResetBuilder,
  onUndoResetBuilder,
  shellMode = 'device',
  utilityBar,
}: MobileLayoutProps) {
  const [view, setView] = useState<MobileView>(OVERVIEW_VIEW)
  const [returnSlotIndex, setReturnSlotIndex] = useState(0)
  const clearSelection = useBuilderStore((s) => s.clearSelection)
  const setActiveSelection = useBuilderStore((s) => s.setActiveSelection)
  const setPickerTab = useBuilderStore((s) => s.setPickerTab)
  const activeTeam = useBuilderStore(selectActiveTeam)

  const openFocusedSlot = useCallback((slotIndex: number) => {
    setReturnSlotIndex(slotIndex)
    setView(focusedView(slotIndex))
  }, [])

  const handleBackToOverview = useCallback(() => {
    setView(OVERVIEW_VIEW)
  }, [])

  const handleQuickLineup = useCallback(() => {
    setView({kind: 'quick-lineup'})
  }, [])

  const handleOpenPicker = useCallback(
    (context: PickerContext) => {
      if (context.target === 'awakener') {
        setActiveSelection({kind: 'awakener', slotId: context.slotId})
      } else if (context.target === 'wheel' && context.wheelIndex !== undefined) {
        setActiveSelection({kind: 'wheel', slotId: context.slotId, wheelIndex: context.wheelIndex})
      } else if (context.target === 'covenant') {
        setActiveSelection({kind: 'covenant', slotId: context.slotId})
      } else {
        clearSelection()
        setPickerTab('posses')
      }
      setView(pickerView(context))
    },
    [clearSelection, setActiveSelection, setPickerTab],
  )

  const returnToFocusedSlot = useCallback(() => {
    clearSelection()
    setView(focusedView(returnSlotIndex))
  }, [clearSelection, returnSlotIndex])

  const builderContent =
    view.kind === 'overview' ? (
      <>
        <MobileBuilderWideBar
          canUndoReset={canUndoResetBuilder}
          onExportAll={onExportAll}
          onExportIngame={onExportIngame}
          onImport={onImport}
          onRequestReset={onRequestResetBuilder}
          onUndoReset={onUndoResetBuilder}
        />
        <MobileBuilderScreen shellMode={shellMode} testId='mobile-overview-shell'>
          <TeamTabs className='shrink-0' variant='compact' />
          <TeamHeader className='shrink-0 border-b border-slate-500/45' compact />
          {activeTeam ? (
            <MobileCurrentTeamBar
              onQuickLineup={handleQuickLineup}
              teamId={activeTeam.id}
              teamName={activeTeam.name}
            />
          ) : null}
          <div className='flex min-h-0 flex-1 flex-col'>
            <MobileOverviewGrid onDeployEmpty={openFocusedSlot} onFocusSlot={openFocusedSlot} />
          </div>
        </MobileBuilderScreen>
      </>
    ) : view.kind === 'quick-lineup' ? (
      <MobileBuilderScreen className='items-center justify-center' shellMode={shellMode}>
        <p className='text-sm text-slate-400'>Quick Lineup — coming soon</p>
        <button
          className='mt-2 border border-slate-500/45 px-3 py-1 text-xs text-slate-300'
          onClick={handleBackToOverview}
          type='button'
        >
          ← Back to Overview
        </button>
      </MobileBuilderScreen>
    ) : (
      <MobileFocusedCard
        onBack={handleBackToOverview}
        onChangeSlotIndex={openFocusedSlot}
        onOpenPicker={handleOpenPicker}
        onQuickLineup={handleQuickLineup}
        shellMode={shellMode}
        slotIndex={view.kind === 'focused' ? view.slotIndex : returnSlotIndex}
      />
    )

  return (
    <div className='w-full bg-[#08111c] text-slate-100'>
      <div
        className='w-full bg-[#0c121c]'
        data-testid={shellMode === 'preview' ? 'builder-v2-mobile-preview-shell' : undefined}
      >
        {utilityBar ? (
          <div className='border-b border-slate-500/45 bg-slate-950/78 px-2 py-2'>{utilityBar}</div>
        ) : null}

        <section className='relative border-y border-slate-500/45 bg-[#0c121c]'>
          {builderContent}

          {view.kind === 'picker' ? (
            <MobilePickerDrawer
              context={view.context}
              onClose={returnToFocusedSlot}
              picker={renderPicker(returnToFocusedSlot)}
              returnSlotIndex={returnSlotIndex}
            />
          ) : null}
        </section>

        <section className='border-b border-slate-500/45 bg-slate-950/40 px-2 py-3'>
          <BuilderTeamsPanel />
        </section>
      </div>
    </div>
  )
}
