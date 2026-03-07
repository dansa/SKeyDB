import {getAwakenerCardAsset, getAwakenerPortraitAsset} from '@/domain/awakener-assets'
import {getCovenantAssetById} from '@/domain/covenant-assets'
import {formatAwakenerNameForUi} from '@/domain/name-format'
import {getWheelAssetById} from '@/domain/wheel-assets'

import {BuilderTeamPreviewStrip} from './BuilderTeamPreviewStrip'
import {CardWheelZone} from './CardWheelZone'
import type {Team, TeamPreviewMode, TeamSlot} from './types'

export function PickerAwakenerGhost({awakenerName}: {awakenerName: string}) {
  const displayName = formatAwakenerNameForUi(awakenerName)
  const portraitAsset = getAwakenerPortraitAsset(awakenerName)

  return (
    <div className='w-[72px] border border-slate-400/65 bg-slate-900/90 p-0.5 text-left shadow-[0_6px_20px_rgba(2,6,23,0.45)]'>
      <div className='aspect-square overflow-hidden border border-slate-300/45 bg-slate-900/70'>
        {portraitAsset ? (
          <img
            alt={`${displayName} portrait`}
            className='h-full w-full object-cover'
            src={portraitAsset}
          />
        ) : (
          <span className='relative block h-full w-full'>
            <span className='sigil-placeholder' />
          </span>
        )}
      </div>
      <p className='mt-0.5 truncate text-[10px] text-slate-100'>{displayName}</p>
    </div>
  )
}

export function TeamCardGhost({
  slot,
  removeIntent = false,
  awakenerOwnedLevel = null,
  wheelOwnedLevels = [null, null],
}: {
  slot: TeamSlot | undefined
  removeIntent?: boolean
  awakenerOwnedLevel?: number | null
  wheelOwnedLevels?: [number | null, number | null]
}) {
  if (!slot?.awakenerName) {
    return null
  }

  const displayName = formatAwakenerNameForUi(slot.awakenerName)
  const cardAsset = getAwakenerCardAsset(slot.awakenerName)

  return (
    <article
      className={`builder-card builder-drag-ghost relative aspect-[25/56] w-[96px] border bg-slate-900/90 shadow-[0_8px_24px_rgba(2,6,23,0.5)] ${
        removeIntent ? 'border-rose-300/75' : 'border-slate-400/70'
      }`}
    >
      {cardAsset ? (
        <img
          alt=''
          className={`absolute inset-0 h-full w-full object-cover object-top ${awakenerOwnedLevel === null ? 'builder-card-art-unowned' : ''}`}
          src={cardAsset}
        />
      ) : null}
      <div
        className={`builder-card-bottom-shade pointer-events-none absolute inset-0 ${
          removeIntent ? 'brightness-[0.55] saturate-[0.45]' : ''
        }`}
      />
      {removeIntent ? (
        <div className='pointer-events-none absolute inset-0 z-20 bg-slate-950/58'>
          <span className='sigil-placeholder sigil-placeholder-card sigil-placeholder-no-plus sigil-placeholder-remove' />
          <span className='sigil-remove-x' />
        </div>
      ) : null}
      <div className='builder-card-name-wrap pointer-events-none absolute inset-x-0 top-0 px-2 pt-1 pb-[18%]'>
        <p className='builder-card-name builder-card-name-ghost ui-title text-slate-100'>
          {displayName}
        </p>
        {slot.isSupport ? <span className='builder-support-badge'>Support Awakener</span> : null}
        {awakenerOwnedLevel === null ? (
          <span className='builder-unowned-badge'>Unowned</span>
        ) : null}
      </div>
      {!removeIntent ? (
        <CardWheelZone
          awakenerLevel={slot.level ?? 60}
          awakenerOwnedLevel={awakenerOwnedLevel}
          compactCovenant
          interactive={false}
          slot={slot}
          wheelKeyPrefix='ghost'
          showOwnership
          wheelOwnedLevels={wheelOwnedLevels}
        />
      ) : null}
    </article>
  )
}

export function TeamPreviewGhost({
  team,
  mode,
  ownedAwakenerLevelByName,
  ownedWheelLevelById,
  removeIntent = false,
}: {
  team: Team
  mode: TeamPreviewMode
  ownedAwakenerLevelByName?: Map<string, number | null>
  ownedWheelLevelById?: Map<string, number | null>
  removeIntent?: boolean
}) {
  return (
    <div
      className={`builder-team-preview-ghost builder-drag-ghost ${removeIntent ? 'builder-team-preview-ghost-remove' : ''}`}
    >
      <BuilderTeamPreviewStrip
        className='builder-team-preview-ghost-strip'
        mode={mode}
        ownedAwakenerLevelByName={ownedAwakenerLevelByName}
        ownedWheelLevelById={ownedWheelLevelById}
        slots={team.slots}
        teamId={`${team.id}::ghost`}
      />
    </div>
  )
}

export function PickerWheelGhost({
  wheelId,
  isCovenant = false,
}: {
  wheelId: string
  isCovenant?: boolean
}) {
  const wheelAsset = isCovenant ? getCovenantAssetById(wheelId) : getWheelAssetById(wheelId)

  return (
    <div
      className={`w-[62px] border border-slate-400/65 bg-slate-900/90 p-0.5 shadow-[0_6px_20px_rgba(2,6,23,0.45)] ${
        isCovenant ? 'rounded-full' : ''
      } ${isCovenant ? 'w-[54px] border-0 bg-transparent p-0' : ''}`}
    >
      <div
        className={`relative overflow-hidden border border-slate-300/45 bg-slate-900/70 ${
          isCovenant ? 'aspect-square rounded-full' : 'aspect-[75/113]'
        }`}
      >
        {wheelAsset ? (
          <img
            alt={isCovenant ? '' : `${wheelId} wheel`}
            className={
              isCovenant
                ? 'builder-card-covenant-image h-full w-full object-cover'
                : 'builder-card-wheel-image h-full w-full object-cover'
            }
            src={wheelAsset}
          />
        ) : (
          <span className='relative block h-full w-full'>
            <span className='sigil-placeholder sigil-placeholder-wheel' />
          </span>
        )}
      </div>
    </div>
  )
}

function getTeamWheelGhostWrapperClassName(removeIntent: boolean, isCovenant: boolean): string {
  return `builder-drag-ghost w-[62px] border bg-slate-900/95 p-0.5 shadow-[0_8px_24px_rgba(2,6,23,0.5)] ${
    removeIntent ? 'border-rose-300/75' : 'border-slate-400/70'
  } ${isCovenant ? 'rounded-full' : ''} ${isCovenant ? 'w-[54px] border-0 bg-transparent p-0' : ''}`
}

function getTeamWheelGhostFrameClassName(isCovenant: boolean): string {
  return `relative overflow-hidden border border-slate-300/45 bg-slate-900/70 ${
    isCovenant ? 'aspect-square rounded-full' : 'aspect-[75/113]'
  }`
}

function getTeamWheelGhostImageClassName(
  isCovenant: boolean,
  isOwned: boolean,
  removeIntent: boolean,
): string {
  return `${
    isCovenant
      ? 'builder-card-covenant-image h-full w-full object-cover'
      : 'builder-card-wheel-image h-full w-full object-cover'
  } ${!isCovenant && !isOwned ? 'wheel-tile-unowned' : ''} ${
    removeIntent ? 'brightness-[0.55] saturate-[0.45]' : ''
  }`
}

function renderTeamWheelGhostRemoveOverlay(removeIntent: boolean, isCovenant: boolean) {
  if (!removeIntent) {
    return null
  }

  return (
    <span
      className={`pointer-events-none absolute inset-0 z-20 bg-slate-950/58 ${isCovenant ? 'rounded-full' : ''}`}
    >
      <span
        className={`sigil-placeholder sigil-placeholder-wheel sigil-placeholder-no-plus sigil-placeholder-remove ${
          isCovenant ? 'rounded-full' : ''
        }`}
      />
      <span className='sigil-remove-x' />
    </span>
  )
}

function renderTeamWheelGhostVisual(
  wheelId: string,
  wheelAsset: string | undefined,
  isCovenant: boolean,
  isOwned: boolean,
  removeIntent: boolean,
) {
  if (wheelAsset) {
    return (
      <img
        alt={isCovenant ? '' : `${wheelId} wheel`}
        className={getTeamWheelGhostImageClassName(isCovenant, isOwned, removeIntent)}
        src={wheelAsset}
      />
    )
  }

  return (
    <span className='relative block h-full w-full'>
      <span className='sigil-placeholder sigil-placeholder-wheel' />
    </span>
  )
}

export function TeamWheelGhost({
  wheelId,
  removeIntent = false,
  isCovenant = false,
  ownedLevel = null,
}: {
  wheelId: string
  removeIntent?: boolean
  isCovenant?: boolean
  ownedLevel?: number | null
}) {
  const wheelAsset = isCovenant ? getCovenantAssetById(wheelId) : getWheelAssetById(wheelId)
  const isOwned = ownedLevel !== null

  return (
    <div className={getTeamWheelGhostWrapperClassName(removeIntent, isCovenant)}>
      <div className={getTeamWheelGhostFrameClassName(isCovenant)}>
        {renderTeamWheelGhostVisual(wheelId, wheelAsset, isCovenant, isOwned, removeIntent)}
        {renderTeamWheelGhostRemoveOverlay(removeIntent, isCovenant)}
        {!isCovenant && !isOwned ? <span className='builder-unowned-chip'>Unowned</span> : null}
      </div>
    </div>
  )
}
