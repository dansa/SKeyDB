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

export function BufferedLevelInput(props: BufferedLevelInputProps) {
  const {ariaLabel, className, max, min, onCommit, title, value} = props
  const [editState, setEditState] = useState({draft: String(value), syncedValue: value})

  if (editState.syncedValue !== value) {
    setEditState({draft: String(value), syncedValue: value})
  }

  const draft = editState.draft

  function setDraft(nextDraft: string) {
    setEditState({draft: nextDraft, syncedValue: value})
  }

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

  function stepDraft(direction: -1 | 1) {
    const parsed = Number(draft)
    const stepBase = draft.trim() !== '' && Number.isFinite(parsed) ? parsed : value
    const nextValue = clampInteger(stepBase + direction, min, max)

    setDraft(String(nextValue))
    if (nextValue !== value) {
      onCommit(nextValue)
    }
  }

  return (
    <input
      aria-label={ariaLabel}
      className={`database-buffered-level-input ${className}`}
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
      onWheel={(event) => {
        if (event.currentTarget !== document.activeElement || event.deltaY === 0) {
          return
        }

        event.preventDefault()
        stepDraft(event.deltaY < 0 ? 1 : -1)
      }}
      step={1}
      title={title}
      type='number'
      value={draft}
      {...CALCULATION_CONTEXT_CONTROL_PROPS}
    />
  )
}
