import {useCallback, useRef, useState, type ReactNode} from 'react'

import {getBuilderWideBarProps} from '../builder-wide-bar-props'
import {BuilderTeamsPanel} from '../BuilderTeamsPanel'
import {BuilderToolbarShell} from '../BuilderToolbarShell'
import {BuilderWideBar} from '../BuilderWideBar'
import {CurrentTeamActionBar} from '../CurrentTeamActionBar'
import {
  useBuilderPageSnapDocument,
  useMeasuredElementSize,
  usePreserveMobileBuilderViewportOnViewChange,
  useRecenterMobileBuilderZone,
  useStickyBuilderPageSnap,
  useViewportSize,
} from '../layout-hooks'
import {useBuilderStore} from '../store/builder-store'
import {selectActiveTeam, selectActiveTeamSlots} from '../store/selectors'
import {TeamHeader} from '../TeamHeader'
import {TeamTabs} from '../TeamTabs'
import {shouldAllowMobileOverviewPageOverflow} from './mobile-overview-shell'
import {MobileBuilderScreen} from './MobileBuilderScreen'
import {MobileFocusedCard} from './MobileFocusedCard'
import {MobileOverviewGrid} from './MobileOverviewGrid'
import {MobilePickerDrawer} from './MobilePickerDrawer'
import {MobileQuickLineup} from './MobileQuickLineup'
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
  onRequestResetTeam: (teamId: string, teamName: string) => void
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
  onRequestResetTeam,
  onUndoResetBuilder,
  shellMode = 'device',
  utilityBar,
}: MobileLayoutProps) {
  const [view, setView] = useState<MobileView>(OVERVIEW_VIEW)
  const builderZoneRef = useRef<HTMLElement>(null)
  const viewport = useViewportSize()
  const {height: overviewChromeHeight, ref: overviewChromeRef} = useMeasuredElementSize()
  const clearSelection = useBuilderStore((s) => s.clearSelection)
  const setActiveSelection = useBuilderStore((s) => s.setActiveSelection)
  const setPickerTab = useBuilderStore((s) => s.setPickerTab)
  const activeTeam = useBuilderStore(selectActiveTeam)
  const activeTeamSlots = useBuilderStore(selectActiveTeamSlots)
  const teamCount = useBuilderStore((state) => state.teams.length)
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

  useBuilderPageSnapDocument(shouldUsePageSnap)
  usePreserveMobileBuilderViewportOnViewChange(activeViewKey, shouldUsePageSnap, builderZoneRef)
  useRecenterMobileBuilderZone(activeViewKey, shouldUsePageSnap, builderZoneRef)
  useStickyBuilderPageSnap(shouldUsePageSnap, builderZoneRef)

  const openFocusedSlot = useCallback((slotIndex: number) => {
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
    if (view.kind !== 'picker') {
      return
    }

    const slotIndex = activeTeamSlots.findIndex((slot) => slot.slotId === view.context.slotId)
    setView(focusedView(slotIndex >= 0 ? slotIndex : 0))
  }, [activeTeamSlots, clearSelection, view])

  const pickerSlotIndex =
    view.kind === 'picker'
      ? activeTeamSlots.findIndex((slot) => slot.slotId === view.context.slotId)
      : -1

  const builderContent =
    view.kind === 'overview' ? (
      <MobileBuilderScreen
        allowPageOverflow={shouldAllowOverviewPageOverflow}
        testId='mobile-overview-shell'
      >
        <div data-testid='mobile-overview-chrome' ref={overviewChromeRef}>
          <TeamTabs className='shrink-0' compactLayout={compactTabsLayout} variant='compact' />
          <TeamHeader className='shrink-0 border-b border-slate-500/45' compact />
          {activeTeam ? (
            <CurrentTeamActionBar
              onQuickLineup={handleQuickLineup}
              onRequestResetTeam={onRequestResetTeam}
              teamId={activeTeam.id}
              teamName={activeTeam.name}
            />
          ) : null}
        </div>
        <div className='flex min-h-0 flex-1 flex-col'>
          <MobileOverviewGrid onDeployEmpty={openFocusedSlot} onFocusSlot={openFocusedSlot} />
        </div>
      </MobileBuilderScreen>
    ) : view.kind === 'quick-lineup' ? (
      <MobileQuickLineup onExit={handleBackToOverview} renderPicker={renderPicker} />
    ) : (
      <MobileFocusedCard
        onBack={handleBackToOverview}
        onChangeSlotIndex={openFocusedSlot}
        onOpenPicker={handleOpenPicker}
        onQuickLineup={handleQuickLineup}
        slotIndex={view.kind === 'focused' ? view.slotIndex : Math.max(0, pickerSlotIndex)}
      />
    )

  const toolbarContent =
    utilityBar || view.kind === 'overview' ? (
      <>
        {utilityBar ? <div className='px-2 py-2'>{utilityBar}</div> : null}
        {view.kind === 'overview' ? (
          <BuilderWideBar
            {...getBuilderWideBarProps({
              activeTeam,
              canUndoReset: canUndoResetBuilder,
              onExportAll,
              onExportIngame,
              onImport,
              onRequestReset: onRequestResetBuilder,
              onUndoReset: onUndoResetBuilder,
              teamCount,
            })}
          />
        ) : null}
      </>
    ) : null

  return (
    <div className='w-full bg-[#08111c] text-slate-100'>
      <div
        className='w-full bg-[#0c121c]'
        data-testid={shellMode === 'preview' ? 'builder-v2-mobile-preview-shell' : undefined}
      >
        <section
          ref={builderZoneRef}
          className='relative border-y border-slate-500/45 bg-[#0c121c]'
          data-testid='mobile-builder-zone'
        >
          {toolbarContent ? <BuilderToolbarShell>{toolbarContent}</BuilderToolbarShell> : null}
          <div className='relative min-h-0' data-testid='mobile-builder-content-frame'>
            {builderContent}

            {view.kind === 'picker' ? (
              <MobilePickerDrawer
                context={view.context}
                onClose={returnToFocusedSlot}
                picker={renderPicker({
                  enableDragAndDrop: false,
                  onItemSelected: returnToFocusedSlot,
                })}
              />
            ) : null}
          </div>
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
