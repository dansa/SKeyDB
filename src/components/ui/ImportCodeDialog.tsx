import { useEffect, useRef, useState } from 'react'
import { ModalFrame } from './ModalFrame'
import { Button } from './Button'

type ImportCodeDialogProps = {
  initialValue?: string
  onCancel: () => void
  onSubmit: (code: string) => void
}

export function ImportCodeDialog({ initialValue = '', onCancel, onSubmit }: ImportCodeDialogProps) {
  const [value, setValue] = useState(initialValue)
  const inputRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  return (
    <ModalFrame ariaLabel="Import teams" title="Import Teams">
      <p className="mt-2 text-sm text-slate-200">Paste a `t1.` or `mt1.` code to import.</p>
      <textarea
        aria-label="Import code"
        className="mt-3 h-32 w-full resize-y border border-slate-500/55 bg-slate-900/75 p-2 text-xs text-slate-100 outline-none focus:border-amber-200/70"
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key !== 'Enter' || event.shiftKey) {
            return
          }

          const trimmed = value.trim()
          if (!trimmed) {
            return
          }

          event.preventDefault()
          onSubmit(trimmed)
        }}
        placeholder="Paste import code here"
        ref={inputRef}
        value={value}
      />
      <div className="mt-4 flex justify-end gap-2">
        <Button onClick={onCancel} variant="secondary">
          Cancel
        </Button>
        <Button disabled={value.trim().length === 0} onClick={() => onSubmit(value.trim())} variant="primary">
          Import
        </Button>
      </div>
    </ModalFrame>
  )
}
