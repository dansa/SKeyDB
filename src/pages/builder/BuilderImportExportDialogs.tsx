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
  pendingDuplicateOverrideImport: object | null
  onCancelDuplicateOverrideImport: () => void
  onConfirmDuplicateOverrideImport: () => void
  pendingReplaceImport: { teams: Team[]; activeTeamIndex: number } | null
  onCancelReplaceImport: () => void
  onConfirmReplaceImport: () => void
  pendingStrategyImport: { team: Team; conflicts: ImportConflict[] } | null
  pendingStrategyConflictSummary: string
  onCancelStrategyImport: () => void
  onMoveStrategyImport: () => void
  onSkipStrategyImport: () => void
  exportDialog: { title: string; code: string; kind: 'standard' | 'ingame'; duplicateWarning?: string } | null
  onCloseExportDialog: () => void
}

const ingameSupportContactNote = (
  <>
    If something seems incorrect, PLEASE do let me know, @fjant(fjantsa) on discord.
    <br />
    Ping in maincord, university or send a DM.
  </>
)

function renderIngameImportWarning() {
  return (
    <p className="text-xs text-rose-300">
      In-game `@@...@@` import is work in progress. Covenants and posse slots are NOT supported yet and will import as
      empty when using import codes from the game.
      <br />
      <br />
      {ingameSupportContactNote}
    </p>
  )
}

function renderIngameExportWarning() {
  return (
    <p className="text-xs text-rose-300">
      In-game export is work in progress. Covenants and posses are NOT supported yet.
      <br />
      <br />
      {ingameSupportContactNote}
    </p>
  )
}

export function BuilderImportExportDialogs({
  isImportDialogOpen,
  onCancelImport,
  onSubmitImport,
  pendingDuplicateOverrideImport,
  onCancelDuplicateOverrideImport,
  onConfirmDuplicateOverrideImport,
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
      {isImportDialogOpen ? (
        <ImportCodeDialog
          onCancel={onCancelImport}
          onSubmit={onSubmitImport}
          warning={renderIngameImportWarning()}
        />
      ) : null}

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

      {pendingDuplicateOverrideImport ? (
        <ConfirmDialog
          cancelLabel="Cancel"
          confirmLabel="Enable and Import"
          message="This import contains duplicate units, wheels, or posses. Enable Allow Dupes and continue?"
          onCancel={onCancelDuplicateOverrideImport}
          onConfirm={onConfirmDuplicateOverrideImport}
          title="Import Uses Duplicates"
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

      {exportDialog ? (
        <ExportCodeDialog
          code={exportDialog.code}
          helperText={
            exportDialog.kind === 'ingame'
              ? 'Copy this code and use it with the in-game team import feature.'
              : undefined
          }
          onClose={onCloseExportDialog}
          title={exportDialog.title}
          warning={
            exportDialog.kind === 'ingame' || exportDialog.duplicateWarning ? (
              <div className="space-y-2">
                {exportDialog.kind === 'ingame' ? renderIngameExportWarning() : null}
                {exportDialog.duplicateWarning ? (
                  <p className="text-xs text-rose-300">{exportDialog.duplicateWarning}</p>
                ) : null}
              </div>
            ) : undefined
          }
        />
      ) : null}
    </>
  )
}
