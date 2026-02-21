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
}

export function BuilderConfirmDialogs({
  deleteDialog,
  onCancelDelete,
  transferDialog,
  onCancelTransfer,
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
    </>
  )
}
