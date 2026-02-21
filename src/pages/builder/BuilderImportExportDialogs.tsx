import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { ExportCodeDialog } from '../../components/ui/ExportCodeDialog'
import { ImportCodeDialog } from '../../components/ui/ImportCodeDialog'
import { ImportStrategyDialog } from '../../components/ui/ImportStrategyDialog'
import type { ImportConflict } from './import-planner'
import type { Team } from './types'

type BuilderImportExportDialogsProps = {
  isImportDialogOpen: boolean
  onCancelImport: () => void
  onSubmitImport: (code: string) => void
  pendingReplaceImport: { teams: Team[]; activeTeamIndex: number } | null
  onCancelReplaceImport: () => void
  onConfirmReplaceImport: () => void
  pendingStrategyImport: { team: Team; conflicts: ImportConflict[] } | null
  pendingStrategyConflictSummary: string
  onCancelStrategyImport: () => void
  onMoveStrategyImport: () => void
  onSkipStrategyImport: () => void
  exportDialog: { title: string; code: string } | null
  onCloseExportDialog: () => void
}

export function BuilderImportExportDialogs({
  isImportDialogOpen,
  onCancelImport,
  onSubmitImport,
  pendingReplaceImport,
  onCancelReplaceImport,
  onConfirmReplaceImport,
  pendingStrategyImport,
  pendingStrategyConflictSummary,
  onCancelStrategyImport,
  onMoveStrategyImport,
  onSkipStrategyImport,
  exportDialog,
  onCloseExportDialog,
}: BuilderImportExportDialogsProps) {
  return (
    <>
      {isImportDialogOpen ? <ImportCodeDialog onCancel={onCancelImport} onSubmit={onSubmitImport} /> : null}

      {pendingReplaceImport ? (
        <ConfirmDialog
          cancelLabel="Cancel"
          confirmLabel="Replace"
          message="This import will replace your current builder setup."
          onCancel={onCancelReplaceImport}
          onConfirm={onConfirmReplaceImport}
          title="Replace Current Teams?"
        />
      ) : null}

      {pendingStrategyImport ? (
        <ImportStrategyDialog
          conflictSummary={pendingStrategyConflictSummary}
          onCancel={onCancelStrategyImport}
          onMove={onMoveStrategyImport}
          onSkip={onSkipStrategyImport}
        />
      ) : null}

      {exportDialog ? <ExportCodeDialog code={exportDialog.code} onClose={onCloseExportDialog} title={exportDialog.title} /> : null}
    </>
  )
}
