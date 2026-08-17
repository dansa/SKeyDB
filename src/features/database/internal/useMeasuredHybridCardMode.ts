import {useCallback, useLayoutEffect, useState} from 'react'

import type {HybridDatabaseCardMode} from './DatabaseGridCardFrame'

const PORTRAIT_CARD_MAX_WIDTH = 148 // Mirrors --database-card-max: 9.25rem.
const PORTRAIT_CARD_SWITCH_GAP = 12 // Matches the grid gap before the dossier switch.
const THREE_COLUMN_PORTRAIT_WIDTH = PORTRAIT_CARD_MAX_WIDTH * 3 + PORTRAIT_CARD_SWITCH_GAP * 2

function resolveHybridDatabaseCardMode(inlineSize: number): HybridDatabaseCardMode {
  return inlineSize < THREE_COLUMN_PORTRAIT_WIDTH ? 'dossier' : 'poster'
}

function isReadonlyArray(value: unknown): value is readonly unknown[] {
  return Array.isArray(value)
}

function hasInlineSize(value: unknown): value is {readonly inlineSize: unknown} {
  return value !== null && typeof value === 'object' && 'inlineSize' in value
}

function getInlineSizeFromBox(boxSize: unknown): number | null {
  if (!hasInlineSize(boxSize)) {
    return null
  }

  const {inlineSize} = boxSize
  return typeof inlineSize === 'number' ? inlineSize : null
}

function getResizeObserverInlineSize(entry: ResizeObserverEntry): number {
  const boxSize: unknown = entry.contentBoxSize

  if (isReadonlyArray(boxSize)) {
    return getInlineSizeFromBox(boxSize[0]) ?? entry.contentRect.width
  }

  return getInlineSizeFromBox(boxSize) ?? entry.contentRect.width
}

export function useMeasuredHybridCardMode() {
  const [element, setElement] = useState<HTMLDivElement | null>(null)
  const [mode, setMode] = useState<HybridDatabaseCardMode>('poster')
  const ref = useCallback((node: HTMLDivElement | null) => {
    setElement(node)
  }, [])

  useLayoutEffect(() => {
    if (!element) {
      return undefined
    }

    const updateMode = (inlineSize: number) => {
      if (inlineSize <= 0) {
        setMode('poster')
        return
      }
      setMode(resolveHybridDatabaseCardMode(inlineSize))
    }

    const measureElement = () => {
      updateMode(element.getBoundingClientRect().width)
    }
    const frame = requestAnimationFrame(measureElement)
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measureElement)
      return () => {
        cancelAnimationFrame(frame)
        window.removeEventListener('resize', measureElement)
      }
    }
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      updateMode(getResizeObserverInlineSize(entry))
    })
    observer.observe(element)

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [element])

  return {mode, ref}
}
