import {getPosseAssetById} from '@/domain/posse-assets'
import type {Posse} from '@/domain/posses'

import type {Team} from './types'
import {toOrdinal} from './utils'

function getPosseTileClassName(
  isActive: boolean,
  isUsedByOtherTeam: boolean,
  ownedLevel: number | null,
) {
  if (isActive) {
    return 'border-amber-200/60 bg-slate-800/80'
  }
  if (isUsedByOtherTeam) {
    return 'border-slate-500/45 bg-slate-900/45 opacity-55'
  }
  if (ownedLevel === null) {
    return 'border-rose-300/35 bg-slate-900/55 hover:border-rose-200/45'
  }
  return 'border-slate-500/45 bg-slate-900/55 hover:border-amber-200/45'
}

function getPosseTopLabel(blockedText: string | null, ownedLevel: number | null) {
  if (blockedText) {
    return {
      text: blockedText,
      className:
        'pointer-events-none absolute inset-x-0 top-0 truncate border-y border-slate-300/30 bg-slate-950/62 px-1 py-0.5 text-center text-[9px] tracking-wide text-slate-100/90',
    }
  }
  if (ownedLevel === null) {
    return {
      text: 'Unowned',
      className:
        'pointer-events-none absolute inset-x-0 top-0 truncate border-y border-rose-300/25 bg-slate-950/70 px-1 py-0.5 text-center text-[9px] tracking-wide text-rose-100/95',
    }
  }
  return null
}

interface PossePickerTileProps {
  posse: Posse
  posseAsset?: string
  isActive: boolean
  isUsedByOtherTeam: boolean
  blockedText: string | null
  ownedLevel: number | null
  onClick: () => void
}

function PossePickerTile({
  posse,
  posseAsset,
  isActive,
  isUsedByOtherTeam,
  blockedText,
  ownedLevel,
  onClick,
}: PossePickerTileProps) {
  const topLabel = getPosseTopLabel(blockedText, ownedLevel)
  const imageClassName = `h-full w-full object-cover ${ownedLevel === null ? 'builder-picker-art-unowned' : ''} ${
    blockedText ? 'builder-picker-art-dimmed' : ''
  }`

  return (
    <button
      aria-disabled={isUsedByOtherTeam}
      className={`border p-1 text-left transition-colors ${getPosseTileClassName(
        isActive,
        isUsedByOtherTeam,
        ownedLevel,
      )}`}
      onClick={() => {
        onClick()
      }}
      type='button'
    >
      <div className='relative aspect-square overflow-hidden border border-slate-400/35 bg-slate-900/70'>
        {posseAsset ? (
          <img
            alt={`${posse.name} posse`}
            className={imageClassName}
            draggable={false}
            src={posseAsset}
          />
        ) : (
          <span className='relative block h-full w-full'>
            <span className='sigil-placeholder' />
          </span>
        )}
        {topLabel ? <span className={topLabel.className}>{topLabel.text}</span> : null}
      </div>
      <p className={`mt-1 truncate text-[11px] ${isActive ? 'text-amber-100' : 'text-slate-200'}`}>
        {posse.name}
      </p>
    </button>
  )
}

interface PossePickerGridProps {
  filteredPosses: Posse[]
  activePosseId?: string
  teams: Team[]
  usedPosseByTeamOrder: Map<string, number>
  ownedPosseLevelById: Map<string, number | null>
  allowDupes: boolean
  effectiveActiveTeamId: string
  onSetActivePosse: (posseId?: string) => void
}

export function PossePickerGrid({
  filteredPosses,
  activePosseId,
  teams,
  usedPosseByTeamOrder,
  ownedPosseLevelById,
  allowDupes,
  effectiveActiveTeamId,
  onSetActivePosse,
}: PossePickerGridProps) {
  return (
    <div className='grid grid-cols-4 gap-2'>
      <button
        className={`border p-1 text-left transition-colors ${
          !activePosseId
            ? 'border-amber-200/60 bg-slate-800/80 text-amber-100'
            : 'border-slate-500/45 bg-slate-900/55 text-slate-300 hover:border-amber-200/45'
        }`}
        onClick={() => {
          onSetActivePosse(undefined)
        }}
        type='button'
      >
        <div className='aspect-square overflow-hidden border border-slate-400/35 bg-slate-900/70'>
          <span className='builder-disabled-icon'>
            <span className='builder-disabled-icon__glyph' />
          </span>
        </div>
        <p className='mt-1 truncate text-[11px] text-slate-200'>Not Set</p>
      </button>

      {filteredPosses.map((posse) => {
        const posseAsset = getPosseAssetById(posse.id)
        const isActive = activePosseId === posse.id
        const usedByTeamOrder = allowDupes ? undefined : usedPosseByTeamOrder.get(posse.id)
        const usedByTeam = usedByTeamOrder === undefined ? undefined : teams[usedByTeamOrder]
        const isUsedByOtherTeam =
          usedByTeamOrder !== undefined && usedByTeam?.id !== effectiveActiveTeamId
        const blockedText = isUsedByOtherTeam
          ? `Used in ${toOrdinal(usedByTeamOrder + 1)} team`
          : null
        const ownedLevel = ownedPosseLevelById.get(posse.id) ?? null

        return (
          <PossePickerTile
            blockedText={blockedText}
            isActive={isActive}
            isUsedByOtherTeam={isUsedByOtherTeam}
            key={posse.id}
            onClick={() => {
              onSetActivePosse(posse.id)
            }}
            ownedLevel={ownedLevel}
            posse={posse}
            posseAsset={posseAsset}
          />
        )
      })}
    </div>
  )
}
