import {useDraggable, useDroppable} from '@dnd-kit/core'

import {getAwakenerCardAsset, getAwakenerPortraitAsset} from '@/domain/awakener-assets'
import {getCovenantAssetById} from '@/domain/covenant-assets'
import {getRealmTint} from '@/domain/factions'
import {getWheelAssetById} from '@/domain/wheel-assets'

import {makeTeamPreviewSlotDropZoneId} from './dnd-ids'
import type {DragData, TeamPreviewMode, TeamSlot} from './types'

export interface BuilderTeamSlotPreviewProps {
  slot: TeamSlot
  teamId: string
  slotIndex: number
  mode: TeamPreviewMode
  ownedAwakenerLevelByName: Map<string, number | null>
  ownedWheelLevelById: Map<string, number | null>
  enableDragAndDrop: boolean
}

function getTeamPreviewDragData(slot: TeamSlot, teamId: string): DragData | undefined {
  if (!slot.awakenerName) {
    return undefined
  }

  return {kind: 'team-preview-slot', teamId, slotId: slot.slotId}
}

function renderCompactSlotPreview(slot: TeamSlot, isAwakenerOwned: boolean) {
  if (!slot.awakenerName) {
    return (
      <span className='relative block h-full w-full'>
        <span className='sigil-placeholder sigil-placeholder-no-plus' />
      </span>
    )
  }

  return (
    <>
      <img
        alt={`${slot.awakenerName} team preview portrait`}
        className={`h-full w-full object-cover ${!isAwakenerOwned ? 'builder-picker-art-unowned' : ''}`}
        draggable={false}
        src={getAwakenerPortraitAsset(slot.awakenerName)}
      />
      <span
        className='pointer-events-none absolute inset-0 z-10 border'
        style={{borderColor: getRealmTint(slot.realm)}}
      />
      {slot.isSupport ? (
        <span className='builder-team-preview-support-overlay'>
          <span className='builder-team-preview-support-chip builder-team-preview-support-chip-compact'>
            Support
          </span>
        </span>
      ) : null}
      {!isAwakenerOwned ? <span className='builder-team-preview-unowned-chip'>Unowned</span> : null}
    </>
  )
}

function renderExpandedPreviewWheels(
  slot: TeamSlot,
  ownedWheelLevelById: Map<string, number | null>,
) {
  return slot.wheels.map((wheelId, index) => {
    const wheelAsset = wheelId ? getWheelAssetById(wheelId) : undefined
    const isWheelOwned = !wheelId || (ownedWheelLevelById.get(wheelId) ?? null) !== null
    return (
      <span
        className='builder-team-slot-preview-wheel'
        key={`${slot.slotId}-wheel-${String(index)}`}
      >
        {wheelAsset ? (
          <img
            alt=''
            className={`h-full w-full object-cover ${!isWheelOwned ? 'builder-picker-art-unowned' : ''}`}
            draggable={false}
            src={wheelAsset}
          />
        ) : (
          <span className='sigil-placeholder sigil-placeholder-wheel' />
        )}
      </span>
    )
  })
}

function renderExpandedSlotPreview(
  slot: TeamSlot,
  isAwakenerOwned: boolean,
  awakenerCardAsset: string | undefined,
  covenantAsset: string | undefined,
  ownedWheelLevelById: Map<string, number | null>,
) {
  return (
    <>
      {slot.awakenerName ? (
        <>
          <img
            alt={`${slot.awakenerName} expanded team preview card`}
            className={`builder-team-slot-preview-card-art ${!isAwakenerOwned ? 'builder-picker-art-unowned' : ''}`}
            draggable={false}
            src={awakenerCardAsset ?? getAwakenerPortraitAsset(slot.awakenerName)}
          />
          <span
            className='pointer-events-none absolute inset-0 z-10 border'
            style={{borderColor: getRealmTint(slot.realm)}}
          />
          {slot.isSupport ? (
            <span className='builder-team-preview-support-chip builder-team-preview-support-chip-expanded'>
              Support
            </span>
          ) : null}
          {!isAwakenerOwned ? (
            <span className='builder-team-preview-unowned-chip'>Unowned</span>
          ) : null}
        </>
      ) : (
        <span className='relative block h-full w-full'>
          <span className='sigil-placeholder sigil-placeholder-no-plus' />
        </span>
      )}
      <span className='builder-team-slot-preview-covenant'>
        {covenantAsset ? (
          <img
            alt=''
            className='h-full w-full object-cover'
            draggable={false}
            src={covenantAsset}
          />
        ) : (
          <span className='builder-team-slot-preview-covenant-empty' />
        )}
      </span>
      <div className='builder-team-slot-preview-wheel-strip builder-team-slot-preview-wheel-strip-embedded'>
        {renderExpandedPreviewWheels(slot, ownedWheelLevelById)}
      </div>
    </>
  )
}

export function BuilderTeamSlotPreview({
  slot,
  teamId,
  slotIndex,
  mode,
  ownedAwakenerLevelByName,
  ownedWheelLevelById,
  enableDragAndDrop,
}: BuilderTeamSlotPreviewProps) {
  const isAwakenerOwned =
    !slot.awakenerName || (ownedAwakenerLevelByName.get(slot.awakenerName) ?? null) !== null
  const covenantAsset = slot.covenantId ? getCovenantAssetById(slot.covenantId) : undefined
  const awakenerCardAsset = slot.awakenerName ? getAwakenerCardAsset(slot.awakenerName) : undefined
  const dropZoneId = makeTeamPreviewSlotDropZoneId(teamId, slot.slotId)
  const dragData = getTeamPreviewDragData(slot, teamId)
  const {isOver, setNodeRef: setDroppableRef} = useDroppable({
    id: dropZoneId,
    disabled: !enableDragAndDrop,
  })
  const {
    attributes,
    listeners,
    setNodeRef: setDraggableRef,
    isDragging,
  } = useDraggable({
    id: `${dropZoneId}:drag`,
    data: dragData,
    disabled: !enableDragAndDrop || !slot.awakenerName,
  })
  const previewAriaLabel = `Team preview slot ${String(slotIndex + 1)}`

  function setPreviewRef(node: HTMLDivElement | null) {
    setDroppableRef(node)
    setDraggableRef(node)
  }

  if (mode === 'compact') {
    return (
      <div
        aria-label={previewAriaLabel}
        className={`builder-picker-tile h-12 w-12 border border-slate-500/50 bg-slate-900/40 p-0.5 ${
          isDragging ? 'opacity-45' : ''
        } ${isOver ? 'builder-team-slot-preview-drop-over' : ''}`}
        ref={setPreviewRef}
        {...attributes}
        {...listeners}
      >
        <div className='builder-team-slot-preview-compact-surface relative h-full w-full overflow-hidden border border-slate-400/35 bg-slate-900/70'>
          {renderCompactSlotPreview(slot, isAwakenerOwned)}
        </div>
      </div>
    )
  }

  return (
    <div
      aria-label={previewAriaLabel}
      className={`builder-team-slot-preview builder-team-slot-preview-expanded ${isDragging ? 'opacity-45' : ''} ${
        isOver ? 'builder-team-slot-preview-drop-over' : ''
      }`}
      ref={setPreviewRef}
      {...attributes}
      {...listeners}
    >
      <div className='builder-team-slot-preview-card'>
        {renderExpandedSlotPreview(
          slot,
          isAwakenerOwned,
          awakenerCardAsset,
          covenantAsset,
          ownedWheelLevelById,
        )}
      </div>
    </div>
  )
}
