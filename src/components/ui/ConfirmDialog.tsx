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
    <div className={overlayClassName}>
      <div
        aria-label={title}
        aria-modal="true"
        className={dialogClassName}
        role="dialog"
      >
        <h4 className="ui-title text-xl text-amber-100">{title}</h4>
        <p className="mt-2 text-sm text-slate-200">{message}</p>
        <div className="mt-4 flex justify-end gap-2">
          <button
            className="border border-slate-500/60 bg-slate-900/70 px-3 py-1.5 text-xs text-slate-200 transition-colors hover:border-amber-200/45"
            onClick={onCancel}
            type="button"
          >
            {cancelLabel}
          </button>
          <button
            className="border border-amber-300/70 bg-amber-500/15 px-3 py-1.5 text-xs text-amber-100 transition-colors hover:border-amber-200/80 hover:bg-amber-500/22"
            onClick={onConfirm}
            type="button"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
