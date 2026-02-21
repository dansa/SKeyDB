import { ModalFrame } from './ModalFrame'
import { Button } from './Button'

type ConfirmDialogProps = {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
  overlayClassName?: string
  dialogClassName?: string
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  overlayClassName = 'fixed inset-0 z-70 flex items-center justify-center bg-slate-950/55 px-4',
  dialogClassName = 'w-full max-w-md border border-amber-200/55 bg-slate-950/96 p-4 shadow-[0_18px_50px_rgba(2,6,23,0.72)]',
}: ConfirmDialogProps) {
  return (
    <ModalFrame overlayClassName={overlayClassName} panelClassName={dialogClassName} title={title}>
      <p className="mt-2 text-sm text-slate-200">{message}</p>
      <div className="mt-4 flex justify-end gap-2">
        <Button onClick={onCancel} variant="secondary">
          {cancelLabel}
        </Button>
        <Button onClick={onConfirm} variant="primary">
          {confirmLabel}
        </Button>
      </div>
    </ModalFrame>
  )
}
