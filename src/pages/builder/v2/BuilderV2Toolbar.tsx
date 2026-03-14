import {Toast} from '@/components/ui/Toast'

import {BuilderConfirmDialogs} from '../BuilderConfirmDialogs'
import {BuilderImportExportDialogs} from '../BuilderImportExportDialogs'
import {BuilderToolbar} from '../BuilderToolbar'
import {useBuilderV2Actions} from './useBuilderV2Actions'

export function BuilderV2Toolbar() {
  const actions = useBuilderV2Actions()

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
        transferDialog={null}
        onCancelTransfer={actions.noop}
        resetDialog={actions.resetDialog}
        onCancelReset={actions.cancelReset}
        resetTeamDialog={null}
        onCancelResetTeam={actions.noop}
      />
      <Toast entries={actions.toastEntries} />
    </>
  )
}
