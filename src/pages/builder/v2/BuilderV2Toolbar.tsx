import {Toast} from '@/components/ui/Toast'

import {BuilderConfirmDialogs} from '../BuilderConfirmDialogs'
import {BuilderImportExportDialogs} from '../BuilderImportExportDialogs'
import {BuilderToolbar} from '../BuilderToolbar'
import type {BuilderV2ActionsResult} from './useBuilderV2Actions'

interface BuilderV2ToolbarProps {
  actions: BuilderV2ActionsResult
}

export function BuilderV2Toolbar({actions}: BuilderV2ToolbarProps) {
  return (
    <>
      <BuilderToolbar
        canUndoReset={actions.canUndoReset}
        hasActiveTeam={Boolean(actions.activeTeam)}
        hasTeams={actions.teams.length > 0}
        onExportAll={actions.openExportAllDialog}
        onExportIngame={actions.handleExportIngame}
        onImport={actions.openImportDialog}
        onRequestReset={actions.requestReset}
        onUndoReset={actions.undoReset}
      />
      <BuilderImportExportDialogs {...actions.importExportDialogProps} />
      <BuilderConfirmDialogs
        deleteDialog={null}
        onCancelDelete={actions.noop}
        transferDialog={actions.transferDialog}
        onCancelTransfer={actions.cancelTransfer}
        resetDialog={actions.resetDialog}
        onCancelReset={actions.cancelReset}
        resetTeamDialog={null}
        onCancelResetTeam={actions.noop}
      />
      <Toast entries={actions.toastEntries} />
    </>
  )
}
