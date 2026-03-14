import {useCallback, useMemo, useState} from 'react'

import {getPosseAssetById} from '@/domain/posse-assets'
import {getPosses} from '@/domain/posses'

import {ActiveTeamHeader} from '../ActiveTeamHeader'
import {useBuilderStore} from './store/builder-store'
import {selectActiveTeam, selectActiveTeamSlots} from './store/selectors'
import {useCollectionOwnership} from './useCollectionOwnership'

const posses = getPosses()
const posseById = new Map(posses.map((p) => [p.id, p]))

export function BuilderV2ActiveTeamHeader() {
  const activeTeam = useBuilderStore(selectActiveTeam)
  const teamSlots = useBuilderStore(selectActiveTeamSlots)
  const renameTeam = useBuilderStore((s) => s.renameTeam)
  const setPickerTab = useBuilderStore((s) => s.setPickerTab)
  const {ownedPosseLevelById} = useCollectionOwnership()

  const [isEditingName, setIsEditingName] = useState(false)
  const [draftName, setDraftName] = useState('')

  const teamRealms = useMemo(
    () =>
      teamSlots
        .filter((slot): slot is typeof slot & {realm: string} => Boolean(slot.realm))
        .map((slot) => slot.realm),
    [teamSlots],
  )

  const activePosse = activeTeam?.posseId ? posseById.get(activeTeam.posseId) : undefined
  const activePosseAsset = activePosse ? getPosseAssetById(activePosse.id) : undefined
  const isActivePosseOwned = activePosse
    ? (ownedPosseLevelById.get(activePosse.id) ?? null) !== null
    : false

  const handleBeginRename = useCallback((_teamId: string, currentName: string) => {
    setDraftName(currentName)
    setIsEditingName(true)
  }, [])

  const handleCommitRename = useCallback(
    (teamId: string) => {
      const trimmed = draftName.trim()
      if (trimmed) {
        renameTeam(teamId, trimmed)
      }
      setIsEditingName(false)
    },
    [draftName, renameTeam],
  )

  const handleCancelRename = useCallback(() => {
    setIsEditingName(false)
  }, [])

  const handleOpenPossePicker = useCallback(() => {
    setPickerTab('posses')
  }, [setPickerTab])

  if (!activeTeam) {
    return null
  }

  return (
    <ActiveTeamHeader
      activeTeamId={activeTeam.id}
      activeTeamName={activeTeam.name}
      activePosseAsset={activePosseAsset}
      activePosseName={activePosse?.name}
      editingTeamName={draftName}
      isActivePosseOwned={isActivePosseOwned}
      isEditingTeamName={isEditingName}
      onBeginTeamRename={handleBeginRename}
      onCancelTeamRename={handleCancelRename}
      onCommitTeamRename={handleCommitRename}
      onEditingTeamNameChange={setDraftName}
      onOpenPossePicker={handleOpenPossePicker}
      teamRealms={teamRealms}
    />
  )
}
