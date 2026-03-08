import {useDraggable} from '@dnd-kit/core'

import {CompactArtTile} from '@/components/ui/CompactArtTile'
import {getPosseAssetById} from '@/domain/posse-assets'
import type {Posse} from '@/domain/posses'

import {PICKER_STATUS_CLASS, PICKER_UNOWNED_CLASS} from './picker-status-labels'
import type {DragData, Team} from './types'

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

function getPosseTopLabel(
  blockedText: string | null,
  ownedLevel: number | null,
): {text: string; className: string} | null {
  if (blockedText) {
    return {
      text: blockedText,
      className: PICKER_STATUS_CLASS,
    }
  }
  if (ownedLevel === null) {
    return {
      text: 'Unowned',
      className: PICKER_UNOWNED_CLASS,
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
  recommendationLabel?: string
  onClick: () => void
}

function PossePickerTile({
  posse,
  posseAsset,
  isActive,
  isUsedByOtherTeam,
  blockedText,
  ownedLevel,
  recommendationLabel,
  onClick,
}: PossePickerTileProps) {
  const topLabel = getPosseTopLabel(blockedText, ownedLevel)
  const imageClassName = `h-full w-full object-cover ${ownedLevel === null ? 'builder-picker-art-unowned' : ''} ${
    blockedText ? 'builder-picker-art-dimmed' : ''
  }`
  const {attributes, listeners, isDragging, setNodeRef} = useDraggable({
    id: `picker-posse:${posse.id}`,
    data: {kind: 'picker-posse', posseId: posse.id, posseName: posse.name} satisfies DragData,
    disabled: isUsedByOtherTeam,
  })
  const dragAttributes = {...attributes} as Record<string, unknown>
  delete dragAttributes['aria-disabled']

  return (
    <button
      aria-disabled={isUsedByOtherTeam ? 'true' : undefined}
      className={`builder-picker-tile border p-1 text-left transition-colors ${getPosseTileClassName(
        isActive,
        isUsedByOtherTeam,
        ownedLevel,
      )} ${isDragging ? 'scale-[0.98] opacity-60' : ''}`}
      onClick={() => {
        onClick()
      }}
      ref={setNodeRef}
      type='button'
      {...dragAttributes}
      {...listeners}
    >
      <CompactArtTile
        chips={
          recommendationLabel ? (
            <span className='builder-picker-recommendation-chip'>{recommendationLabel}</span>
          ) : undefined
        }
        name={posse.name}
        nameClassName={`truncate ${isActive ? 'text-amber-100' : ''}`}
        nameTitle={posse.name}
        preview={
          posseAsset ? (
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
          )
        }
        previewClassName='aspect-square border border-slate-400/35 bg-slate-900/70'
        statusBar={
          topLabel ? <span className={topLabel.className}>{topLabel.text}</span> : undefined
        }
      />
    </button>
  )
}

interface PossePickerGridProps {
  filteredPosses: Posse[]
  activePosseId?: string
  teams: Team[]
  usedPosseByTeamOrder: Map<string, number>
  ownedPosseLevelById: Map<string, number | null>
  teamRecommendedPosseIds: Set<string>
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
  teamRecommendedPosseIds,
  allowDupes,
  effectiveActiveTeamId,
  onSetActivePosse,
}: PossePickerGridProps) {
  return (
    <div className='grid grid-cols-4 items-start gap-2'>
      <button
        className={`builder-picker-tile border p-1 text-left transition-colors ${
          !activePosseId
            ? 'border-amber-200/60 bg-slate-800/80 text-amber-100'
            : 'border-slate-500/45 bg-slate-900/55 text-slate-300 hover:border-amber-200/45'
        }`}
        onClick={() => {
          onSetActivePosse(undefined)
        }}
        type='button'
      >
        <CompactArtTile
          name='Not Set'
          nameClassName='truncate'
          preview={
            <span className='builder-disabled-icon'>
              <span className='builder-disabled-icon__glyph' />
            </span>
          }
          previewClassName='aspect-square border border-slate-400/35 bg-slate-900/70'
        />
      </button>

      {filteredPosses.map((posse) => {
        const posseAsset = getPosseAssetById(posse.id)
        const isActive = activePosseId === posse.id
        const usedByTeamOrder = allowDupes ? undefined : usedPosseByTeamOrder.get(posse.id)
        const usedByTeam = usedByTeamOrder === undefined ? undefined : teams[usedByTeamOrder]
        const isUsedByOtherTeam =
          usedByTeamOrder !== undefined && usedByTeam?.id !== effectiveActiveTeamId
        const blockedText = isUsedByOtherTeam ? `Team ${String(usedByTeamOrder + 1)}` : null
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
            recommendationLabel={teamRecommendedPosseIds.has(posse.id) ? 'Rec' : undefined}
          />
        )
      })}
    </div>
  )
}
