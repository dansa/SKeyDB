import { ConfirmDialog } from '../../components/ui/ConfirmDialog'

type BuilderTransferConfirmDialogProps = {
  dialog: {
    title: string
    message: string
    onConfirm: () => void
  } | null
  onCancel: () => void
}

export function BuilderTransferConfirmDialog({ dialog, onCancel }: BuilderTransferConfirmDialogProps) {
  if (!dialog) {
    return null
  }

  return (
    <ConfirmDialog
      cancelLabel="Cancel"
      confirmLabel="Move"
      message={dialog.message}
      onCancel={onCancel}
      onConfirm={dialog.onConfirm}
      title={dialog.title}
    />
  )
}
