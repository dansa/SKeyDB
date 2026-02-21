type ToastProps = {
  message: string | null
  className?: string
}

export function Toast({
  message,
  className = 'pointer-events-none fixed right-4 bottom-4 z-60 border border-amber-200/50 bg-slate-950/92 px-3 py-2 text-sm text-amber-100 shadow-[0_6px_20px_rgba(2,6,23,0.55)]',
}: ToastProps) {
  if (!message) {
    return null
  }

  return (
    <div
      aria-live="polite"
      className={className}
      role="status"
    >
      {message}
    </div>
  )
}
