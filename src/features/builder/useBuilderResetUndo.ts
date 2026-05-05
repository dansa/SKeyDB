import {useEffect, useRef, useState} from 'react'

import type {BuilderDraftPayload} from './builder-persistence'
import type {Team} from './types'

const UNDO_TIMEOUT_MS = 15_000

interface UseBuilderResetUndoArgs {
  teams: Team[]
  effectiveActiveTeamId: string
  resetBuilderDraft: () => void
  replaceBuilderDraft: (payload: BuilderDraftPayload) => void
  clearActiveSelection: () => void
  showToast: (message: string) => void
}

export function useBuilderResetUndo({
  teams,
  effectiveActiveTeamId,
  resetBuilderDraft,
  replaceBuilderDraft,
  clearActiveSelection,
  showToast,
}: UseBuilderResetUndoArgs) {
  const [pendingResetBuilder, setPendingResetBuilder] = useState(false)
  const [undoResetSnapshot, setUndoResetSnapshot] = useState<BuilderDraftPayload | null>(null)
  const undoTimeoutRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (undoTimeoutRef.current) {
        window.clearTimeout(undoTimeoutRef.current)
      }
    }
  }, [])

  function requestReset() {
    setPendingResetBuilder(true)
  }

  function cancelReset() {
    setPendingResetBuilder(false)
  }

  function confirmReset() {
    const snapshot: BuilderDraftPayload = {
      teams,
      activeTeamId: effectiveActiveTeamId,
    }

    resetBuilderDraft()
    clearActiveSelection()
    setPendingResetBuilder(false)
    setUndoResetSnapshot(snapshot)
    showToast('Builder reset. Undo is available for 15 seconds.')

    if (undoTimeoutRef.current) {
      window.clearTimeout(undoTimeoutRef.current)
    }
    undoTimeoutRef.current = window.setTimeout(() => {
      setUndoResetSnapshot(null)
      undoTimeoutRef.current = null
    }, UNDO_TIMEOUT_MS)
  }

  function undoReset() {
    if (!undoResetSnapshot) {
      return
    }

    replaceBuilderDraft(undoResetSnapshot)
    clearActiveSelection()
    setUndoResetSnapshot(null)
    showToast('Builder reset has been undone.')

    if (undoTimeoutRef.current) {
      window.clearTimeout(undoTimeoutRef.current)
      undoTimeoutRef.current = null
    }
  }

  const resetDialog = pendingResetBuilder
    ? {
        title: 'Reset Builder' as const,
        message: 'Reset all teams back to a fresh builder state?',
        onConfirm: confirmReset,
      }
    : null

  return {
    resetDialog,
    canUndoReset: Boolean(undoResetSnapshot),
    requestReset,
    cancelReset,
    undoReset,
  }
}
