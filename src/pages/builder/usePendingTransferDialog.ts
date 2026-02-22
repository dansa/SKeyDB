import { useCallback, useMemo, type Dispatch, type SetStateAction } from 'react'
import { formatAwakenerNameForUi } from '../../domain/name-format'
import { getWheelById } from '../../domain/wheels'
import type { Team } from './types'
import type { PendingTransfer } from './useTransferConfirm'
import { applyPendingTransfer } from './transfer-resolution'

type UsePendingTransferDialogOptions = {
  pendingTransfer: PendingTransfer | null
  teams: Team[]
  setTeams: Dispatch<SetStateAction<Team[]>>
  clearTransfer: () => void
}

export function usePendingTransferDialog({
  pendingTransfer,
  teams,
  setTeams,
  clearTransfer,
}: UsePendingTransferDialogOptions) {
  const fromTeamName = useMemo(() => {
    if (!pendingTransfer) {
      return 'another team'
    }
    return teams.find((team) => team.id === pendingTransfer.fromTeamId)?.name ?? 'another team'
  }, [pendingTransfer, teams])

  const toTeamName = useMemo(() => {
    if (!pendingTransfer) {
      return 'active team'
    }
    return teams.find((team) => team.id === pendingTransfer.toTeamId)?.name ?? 'active team'
  }, [pendingTransfer, teams])

  const displayName = useMemo(() => {
    if (!pendingTransfer) {
      return ''
    }
    if (pendingTransfer.kind === 'awakener') {
      return formatAwakenerNameForUi(pendingTransfer.itemName)
    }
    if (pendingTransfer.kind === 'wheel') {
      return getWheelById(pendingTransfer.wheelId)?.name ?? pendingTransfer.itemName
    }
    return pendingTransfer.itemName
  }, [pendingTransfer])

  const confirmTransfer = useCallback(() => {
    if (!pendingTransfer) {
      return
    }
    setTeams((prev) => applyPendingTransfer(prev, pendingTransfer))
    clearTransfer()
  }, [pendingTransfer, setTeams, clearTransfer])

  if (!pendingTransfer) {
    return null
  }

  return {
    title: `Move ${displayName}`,
    message: `${displayName} is already used in ${fromTeamName}. Move to ${toTeamName}?`,
    onConfirm: confirmTransfer,
  }
}
