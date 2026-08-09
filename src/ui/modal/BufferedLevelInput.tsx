import {useState} from 'react'

import {CALCULATION_CONTEXT_CONTROL_PROPS} from './calculationContextControl'

interface BufferedLevelInputProps {
  ariaLabel: string
  className: string
  max: number
  min: number
  onCommit: (value: number) => void
  title?: string
  value: number
}

function clampInteger(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.floor(value)))
}

export function BufferedLevelInput({value, ...props}: BufferedLevelInputProps) {
  return <BufferedLevelInputDraft key={value} value={value} {...props} />
}

function BufferedLevelInputDraft({
  ariaLabel,
  className,
  max,
  min,
  onCommit,
  title,
  value,
}: BufferedLevelInputProps) {
  const [draft, setDraft] = useState(String(value))

  function restoreCommittedValue() {
    setDraft(String(value))
  }

  function commitDraft() {
    const parsed = Number(draft)
    if (draft.trim() === '' || !Number.isFinite(parsed)) {
      restoreCommittedValue()
      return
    }

    const nextValue = clampInteger(parsed, min, max)
    setDraft(String(nextValue))
    if (nextValue !== value) {
      onCommit(nextValue)
    }
  }

  return (
    <input
      aria-label={ariaLabel}
      className={className}
      inputMode='numeric'
      max={max}
      min={min}
      onBlur={commitDraft}
      onChange={(event) => {
        setDraft(event.currentTarget.value)
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault()
          commitDraft()
          return
        }
        if (event.key === 'Escape') {
          event.preventDefault()
          event.stopPropagation()
          restoreCommittedValue()
        }
      }}
      step={1}
      title={title}
      type='number'
      value={draft}
      {...CALCULATION_CONTEXT_CONTROL_PROPS}
    />
  )
}
