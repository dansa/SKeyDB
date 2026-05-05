import {ConfirmDialog} from '@/components/ui/ConfirmDialog'

import {BuilderTransferConfirmDialog} from './BuilderTransferConfirmDialog'

interface BuilderConfirmDialogState {
  title: string
  message: string
  onConfirm: () => void
}

interface BuilderConfirmDialogsProps {
  deleteDialog: BuilderConfirmDialogState | null
  onCancelDelete: () => void
  transferDialog: BuilderConfirmDialogState | null
  onCancelTransfer: () => void
  resetDialog: BuilderConfirmDialogState | null
  onCancelReset: () => void
  resetTeamDialog: BuilderConfirmDialogState | null
  onCancelResetTeam: () => void
}

export function BuilderConfirmDialogs({
  deleteDialog,
  onCancelDelete,
  transferDialog,
  onCancelTransfer,
  resetDialog,
  onCancelReset,
  resetTeamDialog,
  onCancelResetTeam,
}: BuilderConfirmDialogsProps) {
  return (
    <>
      {deleteDialog ? (
        <ConfirmDialog
          cancelLabel='Cancel'
          confirmLabel='Delete Team'
          message={deleteDialog.message}
          onCancel={onCancelDelete}
          onConfirm={deleteDialog.onConfirm}
          title={deleteDialog.title}
        />
      ) : null}
      <BuilderTransferConfirmDialog dialog={transferDialog} onCancel={onCancelTransfer} />
      {resetDialog ? (
        <ConfirmDialog
          cancelLabel='Cancel'
          confirmLabel='Reset'
          message={resetDialog.message}
          onCancel={onCancelReset}
          onConfirm={resetDialog.onConfirm}
          title={resetDialog.title}
          confirmVariant='danger'
        />
      ) : null}
      {resetTeamDialog ? (
        <ConfirmDialog
          cancelLabel='Cancel'
          confirmLabel='Reset Team'
          message={resetTeamDialog.message}
          onCancel={onCancelResetTeam}
          onConfirm={resetTeamDialog.onConfirm}
          title={resetTeamDialog.title}
          confirmVariant='danger'
        />
      ) : null}
    </>
  )
}
