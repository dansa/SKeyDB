import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { BuilderTransferConfirmDialog } from './BuilderTransferConfirmDialog'

type BuilderConfirmDialogsProps = {
  deleteDialog: {
    title: string
    message: string
    onConfirm: () => void
  } | null
  onCancelDelete: () => void
  transferDialog: {
    title: string
    message: string
    onConfirm: () => void
  } | null
  onCancelTransfer: () => void
  resetDialog: {
    title: string
    message: string
    onConfirm: () => void
  } | null
  onCancelReset: () => void
}

export function BuilderConfirmDialogs({
  deleteDialog,
  onCancelDelete,
  transferDialog,
  onCancelTransfer,
  resetDialog,
  onCancelReset,
}: BuilderConfirmDialogsProps) {
  return (
    <>
      {deleteDialog ? (
        <ConfirmDialog
          cancelLabel="Cancel"
          confirmLabel="Delete Team"
          message={deleteDialog.message}
          onCancel={onCancelDelete}
          onConfirm={deleteDialog.onConfirm}
          title={deleteDialog.title}
        />
      ) : null}
      <BuilderTransferConfirmDialog dialog={transferDialog} onCancel={onCancelTransfer} />
      {resetDialog ? (
        <ConfirmDialog
          cancelLabel="Cancel"
          confirmLabel="Reset"
          message={resetDialog.message}
          onCancel={onCancelReset}
          onConfirm={resetDialog.onConfirm}
          title={resetDialog.title}
          confirmVariant="danger"
        />
      ) : null}
    </>
  )
}
