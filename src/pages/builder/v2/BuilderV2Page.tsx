import {Toast} from '@/components/ui/Toast'

import {BuilderConfirmDialogs} from '../BuilderConfirmDialogs'
import {BuilderImportExportDialogs} from '../BuilderImportExportDialogs'
import {BuilderCardGrid} from './BuilderCardGrid'
import {BuilderDesktopLayout} from './BuilderDesktopLayout'
import {BuilderDndProvider} from './BuilderDndProvider'
import {BuilderPickerPanel} from './BuilderPickerPanel'
import {BuilderTabletLayout} from './BuilderTabletLayout'
import {BuilderTeamsPanel} from './BuilderTeamsPanel'
import {BuilderV2ActiveTeamHeader} from './BuilderV2ActiveTeamHeader'
import {BuilderV2Toolbar} from './BuilderV2Toolbar'
import {LayoutModeSwitcher} from './LayoutModeSwitcher'
import {MobileLayout} from './mobile/MobileLayout'
import {useBuilderLayoutMode} from './useBuilderLayoutMode'
import {useBuilderV2Actions} from './useBuilderV2Actions'

export function BuilderV2Page() {
  const {layoutMode, layoutOverride, detectedMode, setLayoutOverride} = useBuilderLayoutMode()
  const actions = useBuilderV2Actions()
  const layoutSwitcher = (
    <LayoutModeSwitcher
      detectedMode={detectedMode}
      layoutOverride={layoutOverride}
      onOverrideChange={setLayoutOverride}
    />
  )

  if (layoutMode === 'mobile') {
    const isPreviewingMobile = detectedMode !== 'mobile'
    const showMobileUtilityBar = isPreviewingMobile || layoutOverride !== 'auto'

    return (
      <BuilderDndProvider>
        <>
          <div className='-mx-4 -my-4 overflow-x-hidden'>
            <MobileLayout
              canUndoResetBuilder={actions.canUndoReset}
              onExportAll={actions.openExportAllDialog}
              onExportIngame={actions.handleExportIngame}
              onImport={actions.openImportDialog}
              onRequestResetBuilder={actions.requestReset}
              onUndoResetBuilder={actions.undoReset}
              renderPicker={(onItemSelected) => (
                <BuilderPickerPanel hideTabs onItemSelected={onItemSelected} />
              )}
              shellMode={isPreviewingMobile ? 'preview' : 'device'}
              utilityBar={
                showMobileUtilityBar ? (
                  <div className='flex items-center justify-between gap-2'>
                    <span className='text-[10px] tracking-[0.12em] text-slate-500 uppercase'>
                      {isPreviewingMobile ? 'Mobile Preview' : 'Layout Override'}
                    </span>
                    <div className='min-w-0 overflow-x-auto'>{layoutSwitcher}</div>
                  </div>
                ) : undefined
              }
            />
          </div>
          <BuilderImportExportDialogs {...actions.importExportDialogProps} />
          <BuilderConfirmDialogs
            deleteDialog={null}
            onCancelDelete={actions.noop}
            onCancelReset={actions.cancelReset}
            onCancelResetTeam={actions.noop}
            onCancelTransfer={actions.noop}
            resetDialog={actions.resetDialog}
            resetTeamDialog={null}
            transferDialog={null}
          />
          <Toast entries={actions.toastEntries} />
        </>
      </BuilderDndProvider>
    )
  }

  const toolbar = (
    <div className='space-y-2'>
      <div className='flex items-center justify-between'>{layoutSwitcher}</div>
      <BuilderV2Toolbar />
    </div>
  )

  const picker = <BuilderPickerPanel />
  const activeTeamHeader = <BuilderV2ActiveTeamHeader />
  const teamCards = <BuilderCardGrid />
  const teamsPanel = <BuilderTeamsPanel />

  let layout
  if (layoutMode === 'tablet') {
    layout = <BuilderTabletLayout picker={picker} teamCards={teamCards} toolbar={toolbar} />
  } else {
    layout = (
      <BuilderDesktopLayout
        activeTeamHeader={activeTeamHeader}
        picker={picker}
        teamCards={teamCards}
        teamsPanel={teamsPanel}
        toolbar={toolbar}
      />
    )
  }

  return <BuilderDndProvider>{layout}</BuilderDndProvider>
}
