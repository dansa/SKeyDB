import type { MouseEvent } from 'react'

type TeamNameInlineEditorProps = {
  teamName: string
  isEditing: boolean
  draftName: string
  variant: 'compact' | 'header'
  onBeginEdit: () => void
  onDisplayClick?: (event: MouseEvent<HTMLButtonElement>) => void
  onDraftChange: (nextName: string) => void
  onCommit: () => void
  onCancel: () => void
}

function joinClasses(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

export function TeamNameInlineEditor({
  teamName,
  isEditing,
  draftName,
  variant,
  onBeginEdit,
  onDisplayClick,
  onDraftChange,
  onCommit,
  onCancel,
}: TeamNameInlineEditorProps) {
  const isHeader = variant === 'header'

  if (!isEditing) {
    return (
      <button
        aria-label={`Rename ${teamName}`}
        className={joinClasses(
          'min-w-0 truncate border border-transparent text-left outline-none transition-colors',
          isHeader
            ? 'ui-title h-9 w-full cursor-text px-1.5 !text-2xl !leading-none text-amber-100 hover:border-amber-200/35 hover:bg-slate-900/30 hover:text-amber-50 focus-visible:border-amber-200/45 focus-visible:text-amber-50'
            : 'h-6 w-full cursor-text select-none px-1 !text-xs !leading-none text-slate-100 hover:border-slate-300/35 hover:bg-slate-900/30 hover:text-amber-100 focus-visible:border-slate-300/45 focus-visible:text-amber-100',
        )}
        onClick={(event) => {
          onDisplayClick?.(event)
          if (event.defaultPrevented) {
            return
          }
          event.stopPropagation()
          onBeginEdit()
        }}
        title="Click to Rename"
        type="button"
      >
        {teamName}
      </button>
    )
  }

  return (
    <input
      aria-label="Team name"
      autoFocus
      className={joinClasses(
        'w-full border bg-slate-950/90 text-slate-100 outline-none',
        isHeader
          ? 'ui-title h-9 border-amber-200/60 px-1.5 !text-2xl !leading-none focus:border-amber-200/80'
          : 'h-6 border-amber-200/55 px-1 !text-xs !leading-none focus:border-amber-200/75',
      )}
      onBlur={onCommit}
      onChange={(event) => onDraftChange(event.target.value)}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault()
          onCommit()
          return
        }
        if (event.key === 'Escape') {
          event.preventDefault()
          onCancel()
        }
      }}
      type="text"
      value={draftName}
    />
  )
}
