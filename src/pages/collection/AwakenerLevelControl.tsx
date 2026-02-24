import { useEffect, useRef, useState } from 'react'
import { CollectionLevelStepButton } from './CollectionLevelStepButton'

type AwakenerLevelControlProps = {
  name: string
  level: number
  disabled: boolean
  onLevelChange: (nextLevel: number) => void
  onCommitOutsideClick?: (event: MouseEvent | PointerEvent) => void
}

function parseNumericLevel(rawValue: string): number | null {
  if (!rawValue.trim()) {
    return null
  }
  if (!/^\d+$/.test(rawValue)) {
    return null
  }
  return Number.parseInt(rawValue, 10)
}

export function AwakenerLevelControl({
  name,
  level,
  disabled,
  onLevelChange,
  onCommitOutsideClick,
}: AwakenerLevelControlProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [draftLevel, setDraftLevel] = useState('')
  const inputRef = useRef<HTMLInputElement | null>(null)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const draftLevelRef = useRef('')
  const levelRef = useRef(level)

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [isEditing])

  useEffect(() => {
    draftLevelRef.current = draftLevel
  }, [draftLevel])

  useEffect(() => {
    levelRef.current = level
  }, [level])

  useEffect(() => {
    if (!isEditing) {
      return
    }

    let swallowSyntheticMouseDown = false

    function handleOutsidePointerLikeDown(event: MouseEvent | PointerEvent) {
      if (event.type === 'mousedown' && swallowSyntheticMouseDown) {
        swallowSyntheticMouseDown = false
        return
      }
      if (event.type === 'pointerdown') {
        swallowSyntheticMouseDown = true
      }

      const target = event.target as Node | null
      if (target && rootRef.current?.contains(target)) {
        return
      }

      // Outside click commits current draft. Ownership-hitbox suppression is handled
      // by the parent card, scoped to this awakener only.
      const parsed = parseNumericLevel(draftLevelRef.current)
      if (parsed !== null) {
        onLevelChange(parsed)
      }
      setIsEditing(false)
      onCommitOutsideClick?.(event)
    }

    document.addEventListener('pointerdown', handleOutsidePointerLikeDown, true)
    document.addEventListener('mousedown', handleOutsidePointerLikeDown, true)
    return () => {
      document.removeEventListener('pointerdown', handleOutsidePointerLikeDown, true)
      document.removeEventListener('mousedown', handleOutsidePointerLikeDown, true)
    }
  }, [isEditing, onLevelChange, onCommitOutsideClick])

  function commitDraft() {
    const parsed = parseNumericLevel(draftLevel)
    if (parsed !== null) {
      onLevelChange(parsed)
    }
    setIsEditing(false)
  }

  function handleStep(delta: -1 | 1) {
    const parsedDraft = parseNumericLevel(draftLevelRef.current)
    const baseLevel = parsedDraft ?? levelRef.current
    const nextLevel = Math.min(90, Math.max(1, baseLevel + delta))
    const nextText = String(nextLevel)
    draftLevelRef.current = nextText
    setDraftLevel(nextText)
    onLevelChange(nextLevel)
  }

  if (!isEditing) {
    return (
      <button
        aria-label={`Edit awakener level for ${name}`}
        className="collection-awakener-level-trigger"
        disabled={disabled}
        onClick={() => {
          setDraftLevel(String(level))
          setIsEditing(true)
        }}
        type="button"
      >
        <span className="collection-awakener-level-prefix">Lv.</span>
        <span className="collection-awakener-level-value">{level}</span>
      </button>
    )
  }

  return (
    <div className="collection-awakener-level-editor" ref={rootRef}>
      <label className="collection-awakener-level-input-row">
        <span className="collection-awakener-level-prefix">Lv.</span>
        <input
          aria-label={`Awakener level for ${name}`}
          className="collection-awakener-level-input"
          inputMode="numeric"
          onChange={(event) => setDraftLevel(event.target.value.replace(/[^\d]/g, ''))}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              commitDraft()
            }
            if (event.key === 'Escape') {
              setIsEditing(false)
            }
          }}
          ref={inputRef}
          type="text"
          value={draftLevel}
        />
        <div className="collection-step-group collection-step-group-compact collection-level-inline-steps">
          <CollectionLevelStepButton
            ariaLabel={`Increase awakener level for ${name}`}
            className="collection-step-btn collection-step-btn-compact"
            direction="up"
            disabled={level >= 90}
            glyphClassName="collection-step-glyph collection-step-glyph-compact"
            onStep={() => handleStep(1)}
          />
          <CollectionLevelStepButton
            ariaLabel={`Decrease awakener level for ${name}`}
            className="collection-step-btn collection-step-btn-compact"
            direction="down"
            disabled={level <= 1}
            glyphClassName="collection-step-glyph collection-step-glyph-compact"
            onStep={() => handleStep(-1)}
          />
        </div>
      </label>
    </div>
  )
}
