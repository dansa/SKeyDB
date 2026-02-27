import { useEffect, useRef } from 'react'
import { ModalFrame } from './ModalFrame'
import { Button } from './Button'
import type { ReactNode } from 'react'

type ExportCodeDialogProps = {
  title: string
  code: string
  onClose: () => void
  warning?: ReactNode
  helperText?: string
}

export function ExportCodeDialog({ title, code, onClose, warning, helperText }: ExportCodeDialogProps) {
  const inputRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  return (
    <ModalFrame title={title}>
      <p className="mt-2 text-sm text-slate-200">{helperText ?? 'Copy this code to share/import later.'}</p>
      {warning ? <div className="mt-2">{warning}</div> : null}
      <textarea
        aria-label="Export code"
        className="mt-3 h-24 w-full resize-none border border-slate-500/55 bg-slate-900/75 p-2 text-xs text-slate-100 outline-none focus:border-amber-200/70"
        readOnly
        ref={inputRef}
        value={code}
      />
      <div className="mt-4 flex justify-end gap-2">
        <Button onClick={onClose} variant="primary">
          Close
        </Button>
      </div>
    </ModalFrame>
  )
}
