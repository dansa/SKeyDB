import {useCallback, useMemo, useState} from 'react'

import {useDroppable} from '@dnd-kit/core'

import {getRealmLabel, getRealmTint, normalizeRealmId} from '@/domain/factions'
import {getPosseAssetById} from '@/domain/posse-assets'
import {getPosses} from '@/domain/posses'

import {ActiveTeamHeader} from '../ActiveTeamHeader'
import {POSSE_DROP_ZONE_ID} from '../dnd-ids'
import {useBuilderStore} from './store/builder-store'
import {selectActiveTeam, selectActiveTeamSlots} from './store/selectors'
import {useCollectionOwnership} from './useCollectionOwnership'

const posses = getPosses()
const posseById = new Map(posses.map((p) => [p.id, p]))

interface BuilderV2ActiveTeamHeaderProps {
  compact?: boolean
}

export function BuilderV2ActiveTeamHeader({compact = false}: BuilderV2ActiveTeamHeaderProps) {
  const {setNodeRef: setPosseDropRef} = useDroppable({id: POSSE_DROP_ZONE_ID})
  const activeTeam = useBuilderStore(selectActiveTeam)
  const teamSlots = useBuilderStore(selectActiveTeamSlots)
  const renameTeam = useBuilderStore((s) => s.renameTeam)
  const setPickerTab = useBuilderStore((s) => s.setPickerTab)
  const {ownedPosseLevelById} = useCollectionOwnership()

  const [editingTeamId, setEditingTeamId] = useState<string | null>(null)
  const [isEditingName, setIsEditingName] = useState(false)
  const [draftName, setDraftName] = useState('')

  const teamRealms = useMemo(() => {
    return Array.from(
      new Set(
        teamSlots
          .filter((slot): slot is typeof slot & {realm: string} => Boolean(slot.realm))
          .map((slot) => normalizeRealmId(slot.realm)),
      ),
    ).slice(0, 2)
  }, [teamSlots])

  const realmInfo = useMemo(
    () =>
      teamRealms.map((realmId) => ({
        id: realmId,
        label: getRealmLabel(realmId),
        tint: getRealmTint(realmId),
      })),
    [teamRealms],
  )

  const activePosse = activeTeam?.posseId ? posseById.get(activeTeam.posseId) : undefined
  const activePosseAsset = activePosse ? getPosseAssetById(activePosse.id) : undefined
  const isActivePosseOwned = activePosse
    ? (ownedPosseLevelById.get(activePosse.id) ?? null) !== null
    : false

  const handleBeginRename = useCallback((_teamId: string, currentName: string) => {
    setEditingTeamId(_teamId)
    setDraftName(currentName)
    setIsEditingName(true)
  }, [])

  const handleCommitRename = useCallback(
    (teamId: string) => {
      const trimmed = draftName.trim()
      const targetTeamId = editingTeamId ?? teamId
      if (trimmed) {
        renameTeam(targetTeamId, trimmed)
      }
      setEditingTeamId(null)
      setIsEditingName(false)
    },
    [draftName, editingTeamId, renameTeam],
  )

  const handleCancelRename = useCallback(() => {
    setEditingTeamId(null)
    setIsEditingName(false)
  }, [])

  const handleOpenPossePicker = useCallback(() => {
    setPickerTab('posses')
  }, [setPickerTab])

  if (!activeTeam) {
    return null
  }

  if (compact) {
    return (
      <div
        className='flex items-center justify-between gap-2 px-3 py-1'
        data-testid='builder-v2-compact-header'
      >
        <div className='flex min-w-0 flex-1 items-center gap-2'>
          <p className='block max-w-full min-w-0 truncate text-left text-sm font-semibold text-slate-100'>
            {activeTeam.name}
          </p>

          <div className='flex min-w-0 shrink-0 items-center gap-1 text-[10px] tracking-[0.08em] uppercase'>
            {realmInfo.length > 0 ? (
              realmInfo.map((realm, index) => (
                <span key={realm.id}>
                  <span style={{color: realm.tint}}>{realm.label}</span>
                  {index < realmInfo.length - 1 ? (
                    <span className='text-slate-500'> / </span>
                  ) : null}
                </span>
              ))
            ) : (
              <span className='text-slate-500'>No Realm</span>
            )}
          </div>
        </div>

        <button
          aria-label='Open posse picker'
          className='flex shrink-0 items-center gap-1.5 border border-slate-500/35 bg-slate-950/45 px-1.5 py-0.5 text-left transition-[background-color,border-color,filter] hover:border-amber-300/45 hover:bg-slate-900/72 hover:brightness-105'
          onClick={handleOpenPossePicker}
          ref={setPosseDropRef}
          type='button'
        >
          <span className='text-[9px] tracking-[0.1em] text-slate-500 uppercase'>Posse</span>
          <div className='h-6 w-6 overflow-hidden border border-slate-500/45 bg-slate-800'>
            {activePosseAsset ? (
              <img
                alt={activePosse?.name ?? 'Posse'}
                className='h-full w-full object-cover'
                draggable={false}
                src={activePosseAsset}
              />
            ) : (
              <span className='flex h-full w-full items-center justify-center text-[7px] text-slate-600'>
                +
              </span>
            )}
          </div>
          <span className='max-w-[8rem] truncate text-[10px] text-slate-300'>
            {activePosse?.name ?? 'Not Set'}
            {activePosse && !isActivePosseOwned ? ' (Unowned)' : ''}
          </span>
        </button>
      </div>
    )
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
