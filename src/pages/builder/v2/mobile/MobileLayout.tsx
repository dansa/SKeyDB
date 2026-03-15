import {useCallback, useRef, useState, type ReactNode} from 'react'

import {BuilderTeamsPanel} from '../BuilderTeamsPanel'
import {useBuilderStore} from '../store/builder-store'
import {selectActiveTeam} from '../store/selectors'
import {TeamHeader} from '../TeamHeader'
import {TeamTabs} from '../TeamTabs'
import {
  useMeasuredElementSize,
  useMobileBuilderDocumentSnap,
  usePreserveMobileBuilderViewportOnViewChange,
  useRecenterMobileBuilderZone,
  useStickyMobileBuilderPageSnap,
  useViewportSize,
} from './layout-hooks'
import {shouldAllowMobileOverviewPageOverflow} from './mobile-overview-shell'
import {MobileBuilderScreen} from './MobileBuilderScreen'
import {MobileFocusedCard} from './MobileFocusedCard'
import {MobileOverviewGrid} from './MobileOverviewGrid'
import {MobilePickerDrawer} from './MobilePickerDrawer'
import {MobileQuickLineup} from './MobileQuickLineup'
import {MobileBuilderWideBar, MobileCurrentTeamBar} from './MobileToolbars'
import {
  focusedView,
  OVERVIEW_VIEW,
  pickerView,
  type MobileView,
  type PickerContext,
} from './MobileViewState'

interface MobileLayoutProps {
  renderPicker: (options: {enableDragAndDrop: boolean; onItemSelected: () => void}) => ReactNode
  onImport: () => void
  onExportAll: () => void
  onExportIngame: () => void
  canUndoResetBuilder: boolean
  onRequestResetBuilder: () => void
  onUndoResetBuilder: () => void
  shellMode?: 'device' | 'preview'
  utilityBar?: ReactNode
}

const SHORT_LANDSCAPE_SINGLE_ROW_TABS_MAX_HEIGHT = 400

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
  const builderZoneRef = useRef<HTMLElement>(null)
  const viewport = useViewportSize()
  const {height: overviewChromeHeight, ref: overviewChromeRef} = useMeasuredElementSize()
  const clearSelection = useBuilderStore((s) => s.clearSelection)
  const setActiveSelection = useBuilderStore((s) => s.setActiveSelection)
  const setPickerTab = useBuilderStore((s) => s.setPickerTab)
  const activeTeam = useBuilderStore(selectActiveTeam)
  const shouldUsePageSnap = true
  const compactTabsLayout =
    viewport.width > viewport.height &&
    viewport.height > 0 &&
    viewport.height <= SHORT_LANDSCAPE_SINGLE_ROW_TABS_MAX_HEIGHT
      ? 'single-row-flex'
      : 'auto'
  const shouldAllowOverviewPageOverflow = shouldAllowMobileOverviewPageOverflow({
    chromeHeight: overviewChromeHeight,
    viewportHeight: viewport.height,
    viewportWidth: viewport.width,
  })
  const activeViewKey =
    view.kind === 'focused'
      ? `focused:${String(view.slotIndex)}`
      : view.kind === 'picker'
        ? `picker:${view.context.target}:${view.context.slotId}:${String(view.context.wheelIndex ?? -1)}`
        : view.kind

  useMobileBuilderDocumentSnap(shouldUsePageSnap)
  usePreserveMobileBuilderViewportOnViewChange(activeViewKey, shouldUsePageSnap, builderZoneRef)
  useRecenterMobileBuilderZone(activeViewKey, shouldUsePageSnap, builderZoneRef)
  useStickyMobileBuilderPageSnap(shouldUsePageSnap, builderZoneRef)

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
        <MobileBuilderScreen
          allowPageOverflow={shouldAllowOverviewPageOverflow}
          shellMode={shellMode}
          testId='mobile-overview-shell'
        >
          <div data-testid='mobile-overview-chrome' ref={overviewChromeRef}>
            <TeamTabs className='shrink-0' compactLayout={compactTabsLayout} variant='compact' />
            <TeamHeader className='shrink-0 border-b border-slate-500/45' compact />
            {activeTeam ? (
              <MobileCurrentTeamBar
                onQuickLineup={handleQuickLineup}
                teamId={activeTeam.id}
                teamName={activeTeam.name}
              />
            ) : null}
          </div>
          <div className='flex min-h-0 flex-1 flex-col'>
            <MobileOverviewGrid onDeployEmpty={openFocusedSlot} onFocusSlot={openFocusedSlot} />
          </div>
        </MobileBuilderScreen>
      </>
    ) : view.kind === 'quick-lineup' ? (
      <MobileQuickLineup
        onExit={handleBackToOverview}
        renderPicker={renderPicker}
        shellMode={shellMode}
      />
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

        <section
          ref={builderZoneRef}
          className='relative border-y border-slate-500/45 bg-[#0c121c]'
          data-testid='mobile-builder-zone'
        >
          {builderContent}

          {view.kind === 'picker' ? (
            <MobilePickerDrawer
              context={view.context}
              onClose={returnToFocusedSlot}
              picker={renderPicker({
                enableDragAndDrop: false,
                onItemSelected: returnToFocusedSlot,
              })}
              returnSlotIndex={returnSlotIndex}
            />
          ) : null}
        </section>

        <section
          className='border-b border-slate-500/45 bg-slate-950/40 px-2 py-3'
          data-mobile-builder-exit-zone='true'
          data-testid='mobile-builder-teams-section'
        >
          <BuilderTeamsPanel />
        </section>
      </div>
    </div>
  )
}
