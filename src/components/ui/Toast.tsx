type ToastProps = {
  message?: string | null
  messages?: string[]
  entries?: Array<{ id: number; message: string }>
  className?: string
  containerClassName?: string
}

export function Toast({
  message,
  messages,
  entries,
  className = 'pointer-events-none fixed right-4 bottom-4 z-60 border border-amber-200/50 bg-slate-950/92 px-3 py-2 text-sm text-amber-100 shadow-[0_6px_20px_rgba(2,6,23,0.55)]',
  containerClassName = 'pointer-events-none fixed right-4 bottom-4 z-60 flex flex-col items-end gap-2',
}: ToastProps) {
  const resolvedEntries = entries ?? messages?.map((entry, index) => ({ id: index, message: entry })) ?? (message ? [{ id: 0, message }] : [])
  if (resolvedEntries.length === 0) {
    return null
  }

  return (
    <div aria-live="polite" className={containerClassName}>
      {resolvedEntries.map((entry) => (
        <div className={className} key={entry.id} role="status">
          {entry.message}
        </div>
      ))}
    </div>
  )
}
