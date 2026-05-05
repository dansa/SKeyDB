import {ConfirmDialog} from '@/components/ui/ConfirmDialog'

interface BuilderTransferDialogState {
  title: string
  message: string
  supportLabel?: string
  onSupport?: () => void
  onConfirm: () => void
}

interface BuilderTransferConfirmDialogProps {
  dialog: BuilderTransferDialogState | null
  onCancel: () => void
}

export function BuilderTransferConfirmDialog({
  dialog,
  onCancel,
}: BuilderTransferConfirmDialogProps) {
  if (!dialog) {
    return null
  }

  return (
    <ConfirmDialog
      cancelLabel='Cancel'
      confirmLabel={dialog.supportLabel ? 'Move Instead' : 'Move'}
      message={dialog.message}
      onCancel={onCancel}
      onConfirm={dialog.onConfirm}
      onSecondary={dialog.onSupport}
      secondaryLabel={dialog.supportLabel}
      title={dialog.title}
    />
  )
}
