import {useMemo} from 'react'

import {useDraggable} from '@dnd-kit/core'
import {FaCircleInfo} from 'react-icons/fa6'

import {getPosseAssetById} from '@/domain/posse-assets'
import type {Posse} from '@/domain/posses'
import {CompactArtTile} from '@/ui/cards/CompactArtTile'

import {
  PICKER_RECOMMENDATION_CLASS,
  PICKER_STATUS_CLASS,
  PICKER_UNOWNED_CLASS,
} from './picker-status-labels'
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

const notSetPossePreview = (
  <span className='builder-disabled-icon'>
    <span className='builder-disabled-icon__glyph' />
  </span>
)

interface PossePickerTileProps {
  posse: Posse
  posseAsset?: string
  isActive: boolean
  isUsedByOtherTeam: boolean
  blockedText: string | null
  ownedLevel: number | null
  recommendationLabel?: string
  onClick: () => void
  onOpenDetail: () => void
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
  onOpenDetail,
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
  const actions = useMemo(
    () => (
      <button
        aria-label='Open details overlay'
        className='builder-picker-detail-action inline-flex items-center justify-center text-slate-400 hover:text-amber-100 focus-visible:text-amber-100 focus-visible:outline-none'
        onClick={(event) => {
          event.preventDefault()
          event.stopPropagation()
          onOpenDetail()
        }}
        title={`Open ${posse.name} details overlay`}
        type='button'
      >
        <FaCircleInfo aria-hidden className='size-3' />
      </button>
    ),
    [onOpenDetail, posse.name],
  )
  const chips = useMemo(() => {
    if (!recommendationLabel) {
      return undefined
    }

    return <span className={PICKER_RECOMMENDATION_CLASS}>{recommendationLabel}</span>
  }, [recommendationLabel])
  const preview = useMemo(() => {
    if (posseAsset) {
      return (
        <img
          alt={`${posse.name} posse`}
          className={imageClassName}
          decoding='async'
          draggable={false}
          fetchPriority='low'
          loading='lazy'
          src={posseAsset}
        />
      )
    }

    return (
      <span className='relative block h-full w-full'>
        <span className='sigil-placeholder' />
      </span>
    )
  }, [imageClassName, posse.name, posseAsset])
  const statusBar = useMemo(() => {
    if (!topLabel) {
      return undefined
    }

    return (
      <span className={topLabel.className} title={topLabel.text}>
        {topLabel.text}
      </span>
    )
  }, [topLabel])

  return (
    <div className='group relative min-w-0'>
      <div
        className={`builder-picker-tile relative w-full min-w-0 border p-1 text-left transition-colors ${getPosseTileClassName(
          isActive,
          isUsedByOtherTeam,
          ownedLevel,
        )} ${isDragging ? 'scale-[0.98] opacity-60' : ''}`}
      >
        <button
          aria-disabled={isUsedByOtherTeam ? 'true' : undefined}
          aria-label={`${posse.name} posse`}
          className='absolute inset-0 z-20 cursor-pointer border-0 bg-transparent p-0 focus:outline-none focus-visible:ring-1 focus-visible:ring-amber-200/70'
          onClick={() => {
            onClick()
          }}
          ref={setNodeRef}
          type='button'
          {...dragAttributes}
          {...listeners}
        />
        <CompactArtTile
          actionPlacement='caption'
          actions={actions}
          chips={chips}
          chipPlacement='overlay-stack'
          name={posse.name}
          nameClassName={`truncate ${isActive ? 'text-amber-100' : ''}`}
          nameTitle={posse.name}
          preview={preview}
          previewClassName='aspect-square border border-slate-400/35 bg-slate-900/70'
          statusBar={statusBar}
        />
      </div>
    </div>
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
  onOpenPosseDetail: (posse: Posse) => void
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
  onOpenPosseDetail,
}: PossePickerGridProps) {
  return (
    <div className='grid grid-cols-[repeat(4,minmax(0,1fr))] items-start gap-2'>
      <button
        className={`builder-picker-tile w-full min-w-0 border p-1 text-left transition-colors ${
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
          preview={notSetPossePreview}
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
            onOpenDetail={() => {
              onOpenPosseDetail(posse)
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
