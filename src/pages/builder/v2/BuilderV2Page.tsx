import {useEffect, useRef, type ReactNode} from 'react'

import {Toast} from '@/components/ui/Toast'

import {BuilderConfirmDialogs} from '../BuilderConfirmDialogs'
import {BuilderImportExportDialogs} from '../BuilderImportExportDialogs'
import {getBuilderWideBarProps} from './builder-wide-bar-props'
import {BuilderCardGrid} from './BuilderCardGrid'
import {BuilderDesktopLayout} from './BuilderDesktopLayout'
import {BuilderDndProvider} from './BuilderDndProvider'
import {BuilderPickerPanel} from './BuilderPickerPanel'
import {BuilderTabletLayout} from './BuilderTabletLayout'
import {BuilderTeamsPanel} from './BuilderTeamsPanel'
import {BuilderTeamStage} from './BuilderTeamStage'
import {BuilderV2ActiveTeamHeader} from './BuilderV2ActiveTeamHeader'
import {BuilderV2Toolbar} from './BuilderV2Toolbar'
import {BuilderWideBar} from './BuilderWideBar'
import {useBuilderPageSnapDocument, useStickyBuilderPageSnap} from './layout-hooks'
import {LayoutModeSwitcher} from './LayoutModeSwitcher'
import {MobileLayout} from './mobile/MobileLayout'
import {useBuilderStore} from './store/builder-store'
import {selectIsQuickLineupActive, selectQuickLineupStepIndex} from './store/selectors'
import {TABLET_LAYOUT_MIN_WIDTH_PX} from './tablet-layout-metrics'
import {useBuilderLayoutMode} from './useBuilderLayoutMode'
import {useBuilderV2Actions} from './useBuilderV2Actions'

function LayoutSwitcherBanner({children, label}: {children: ReactNode; label: string}) {
  return (
    <div className='flex items-center justify-between gap-2 px-2 py-2'>
      <span className='text-[10px] tracking-[0.12em] text-slate-500 uppercase'>{label}</span>
      <div className='min-w-0 overflow-x-auto'>{children}</div>
    </div>
  )
}

export function BuilderV2Page() {
  const {layoutMode, layoutOverride, detectedMode, setLayoutOverride} = useBuilderLayoutMode()
  const actions = useBuilderV2Actions()
  const isQuickLineupActive = useBuilderStore(selectIsQuickLineupActive)
  const quickLineupStepIndex = useBuilderStore(selectQuickLineupStepIndex)
  const nextQuickLineupStep = useBuilderStore((state) => state.nextQuickLineupStep)
  const tabletBuilderZoneRef = useRef<HTMLElement>(null)
  const isTabletLayout = layoutMode === 'tablet'
  useBuilderPageSnapDocument(isTabletLayout)
  useStickyBuilderPageSnap(isTabletLayout, tabletBuilderZoneRef)

  useEffect(() => {
    if (typeof document === 'undefined' || !isTabletLayout) {
      return
    }

    const minWidth = `${String(TABLET_LAYOUT_MIN_WIDTH_PX)}px`
    const root = document.getElementById('root')
    const previousHtmlMinWidth = document.documentElement.style.minWidth
    const previousBodyMinWidth = document.body.style.minWidth
    const previousRootMinWidth = root?.style.minWidth ?? ''

    document.documentElement.style.minWidth = minWidth
    document.body.style.minWidth = minWidth
    if (root) {
      root.style.minWidth = minWidth
    }

    return () => {
      document.documentElement.style.minWidth = previousHtmlMinWidth
      document.body.style.minWidth = previousBodyMinWidth
      if (root) {
        root.style.minWidth = previousRootMinWidth
      }
    }
  }, [isTabletLayout])

  const layoutSwitcher = (
    <LayoutModeSwitcher
      detectedMode={detectedMode}
      layoutOverride={layoutOverride}
      onOverrideChange={setLayoutOverride}
    />
  )
  const sharedBuilderChrome = (
    <>
      <BuilderImportExportDialogs {...actions.importExportDialogProps} />
      <BuilderConfirmDialogs
        deleteDialog={null}
        onCancelDelete={actions.noop}
        onCancelReset={actions.cancelReset}
        onCancelResetTeam={actions.cancelResetTeam}
        onCancelTransfer={actions.cancelTransfer}
        resetDialog={actions.resetDialog}
        resetTeamDialog={actions.resetTeamDialog}
        transferDialog={actions.transferDialog}
      />
      <Toast entries={actions.toastEntries} />
    </>
  )

  if (layoutMode === 'mobile') {
    const isPreviewingMobile = detectedMode !== 'mobile'
    const showMobileUtilityBar = isPreviewingMobile || layoutOverride !== 'auto'

    return (
      <BuilderDndProvider actions={actions}>
        <>
          <div className='-mx-4 -my-4 overflow-x-hidden'>
            <MobileLayout
              canUndoResetBuilder={actions.canUndoReset}
              onExportAll={actions.openExportAllDialog}
              onExportIngame={actions.handleExportIngame}
              onImport={actions.openImportDialog}
              onRequestResetBuilder={actions.requestReset}
              onRequestResetTeam={actions.requestResetTeam}
              onUndoResetBuilder={actions.undoReset}
              renderPicker={({enableDragAndDrop, onItemSelected}) => (
                <BuilderPickerPanel
                  actions={actions}
                  enableDragAndDrop={enableDragAndDrop}
                  hideTabs
                  onItemSelected={onItemSelected}
                />
              )}
              shellMode={isPreviewingMobile ? 'preview' : 'device'}
              utilityBar={
                showMobileUtilityBar ? (
                  <LayoutSwitcherBanner
                    label={isPreviewingMobile ? 'Mobile Preview' : 'Layout Override'}
                  >
                    {layoutSwitcher}
                  </LayoutSwitcherBanner>
                ) : undefined
              }
            />
          </div>
          {sharedBuilderChrome}
        </>
      </BuilderDndProvider>
    )
  }

  const desktopToolbar = (
    <div className='space-y-2'>
      <div className='flex items-center justify-between'>{layoutSwitcher}</div>
      <BuilderV2Toolbar actions={actions} />
    </div>
  )
  const tabletToolbar = (
    <>
      <LayoutSwitcherBanner label='Tablet Layout'>{layoutSwitcher}</LayoutSwitcherBanner>
      <BuilderWideBar
        {...getBuilderWideBarProps({
          activeTeam: actions.activeTeam,
          canUndoReset: actions.canUndoReset,
          onExportAll: actions.openExportAllDialog,
          onExportIngame: actions.handleExportIngame,
          onImport: actions.openImportDialog,
          onRequestReset: actions.requestReset,
          onUndoReset: actions.undoReset,
          teamCount: actions.teams.length,
        })}
      />
    </>
  )

  const picker = (
    <BuilderPickerPanel
      actions={actions}
      layoutVariant={isTabletLayout ? 'wide-sidebar' : 'stacked'}
      onItemSelected={
        isQuickLineupActive
          ? () => {
              nextQuickLineupStep(quickLineupStepIndex)
            }
          : undefined
      }
    />
  )
  const activeTeamHeader = <BuilderV2ActiveTeamHeader />
  const teamCards = <BuilderCardGrid />
  const teamStage = (
    <BuilderTeamStage compact={isTabletLayout} onRequestResetTeam={actions.requestResetTeam} />
  )
  const teamsPanel = <BuilderTeamsPanel />

  let layout
  if (isTabletLayout) {
    layout = (
      <div className='-mx-4 md:-mx-6'>
        <BuilderTabletLayout
          builderZoneRef={tabletBuilderZoneRef}
          picker={picker}
          teamStage={teamStage}
          teamsPanel={teamsPanel}
          toolbar={tabletToolbar}
        />
      </div>
    )
  } else {
    layout = (
      <BuilderDesktopLayout
        activeTeamHeader={activeTeamHeader}
        picker={picker}
        teamCards={teamCards}
        teamsPanel={teamsPanel}
        toolbar={desktopToolbar}
      />
    )
  }

  return (
    <BuilderDndProvider actions={actions}>
      <>
        {layout}
        {sharedBuilderChrome}
      </>
    </BuilderDndProvider>
  )
}
