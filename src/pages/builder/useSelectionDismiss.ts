import {useEffect} from 'react'

import type {ActiveSelection, QuickLineupSession} from './types'

interface UseSelectionDismissOptions {
  quickLineupSession: QuickLineupSession | null
  restoreQuickLineupFocus: () => void
  setActiveSelection: (next: ActiveSelection) => void
}

export function useSelectionDismiss({
  quickLineupSession,
  restoreQuickLineupFocus,
  setActiveSelection,
}: UseSelectionDismissOptions) {
  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null
      if (!target) {
        return
      }
      if (target.closest('[data-picker-zone="true"]')) {
        return
      }
      if (target.closest('[data-card-remove]')) {
        return
      }
      if (target.closest('[data-selection-owner="true"]')) {
        return
      }
      if (quickLineupSession) {
        restoreQuickLineupFocus()
        return
      }
      setActiveSelection(null)
    }

    document.addEventListener('pointerdown', handlePointerDown, true)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true)
    }
  }, [quickLineupSession, restoreQuickLineupFocus, setActiveSelection])
}
