import {useState} from 'react'

import type {Team} from './types'

type PreviewSlotDragState = {teamId: string; slotId: string} | null

export function usePreviewSlotDrag(teams: Team[]) {
  const [activeDrag, setActiveDrag] = useState<PreviewSlotDragState>(null)
  const [isRemoveIntent, setIsRemoveIntent] = useState(false)

  const draggedTeam = activeDrag
    ? (teams.find((team) => team.id === activeDrag.teamId) ?? null)
    : null
  const draggedSlot = activeDrag
    ? draggedTeam?.slots.find((slot) => slot.slotId === activeDrag.slotId)
    : undefined

  function startDrag(teamId: string, slotId: string) {
    setActiveDrag({teamId, slotId})
    setIsRemoveIntent(false)
  }

  function clear() {
    setActiveDrag(null)
    setIsRemoveIntent(false)
  }

  return {
    previewDraggedTeam: draggedTeam,
    previewDraggedSlot: draggedSlot,
    isPreviewRemoveIntent: isRemoveIntent,
    setPreviewRemoveIntent: setIsRemoveIntent,
    startPreviewDrag: startDrag,
    clearPreviewDrag: clear,
  }
}
