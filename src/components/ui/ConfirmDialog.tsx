import { ModalFrame } from './ModalFrame'
import { Button } from './Button'
import type { ButtonVariant } from './Button'

type ConfirmDialogProps = {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  secondaryLabel?: string
  onConfirm: () => void
  onCancel: () => void
  onSecondary?: () => void
  overlayClassName?: string
  dialogClassName?: string
  confirmVariant?: ButtonVariant
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  secondaryLabel,
  onConfirm,
  onCancel,
  onSecondary,
  overlayClassName = 'fixed inset-0 z-70 flex items-center justify-center bg-slate-950/55 px-4',
  dialogClassName = 'w-full max-w-md border border-amber-200/55 bg-slate-950/96 p-4 shadow-[0_18px_50px_rgba(2,6,23,0.72)]',
  confirmVariant = 'primary',
}: ConfirmDialogProps) {
  return (
    <ModalFrame overlayClassName={overlayClassName} panelClassName={dialogClassName} title={title}>
      <p className="mt-2 text-sm text-slate-200">{message}</p>
      <div className="mt-4 flex justify-end gap-2">
        <Button onClick={onCancel} variant="secondary">
          {cancelLabel}
        </Button>
        {secondaryLabel && onSecondary ? (
          <Button onClick={onSecondary} variant="secondary">
            {secondaryLabel}
          </Button>
        ) : null}
        <Button onClick={onConfirm} variant={confirmVariant}>
          {confirmLabel}
        </Button>
      </div>
    </ModalFrame>
  )
}
