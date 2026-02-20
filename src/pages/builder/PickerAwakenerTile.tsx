import { useDraggable } from '@dnd-kit/core'
import { getAwakenerPortraitAsset } from '../../domain/awakener-assets'
import { getFactionTint } from '../../domain/factions'
import { formatAwakenerNameForUi } from '../../domain/name-format'
import { SHOW_PICKER_TILE_STATUS_LABELS } from './constants'
import type { DragData } from './types'

type PickerAwakenerTileProps = {
  awakenerName: string
  faction: string
  isFactionBlocked: boolean
  isInUse: boolean
  onClick: () => void
}

export function PickerAwakenerTile({ awakenerName, faction, isFactionBlocked, isInUse, onClick }: PickerAwakenerTileProps) {
  const displayName = formatAwakenerNameForUi(awakenerName)
  const portraitAsset = getAwakenerPortraitAsset(awakenerName)
  const isDimmed = isFactionBlocked || isInUse
  const factionTint = getFactionTint(faction)
  const statusText = isInUse
    ? isFactionBlocked
      ? 'Already Used / Wrong Faction'
      : 'Already Used'
    : isFactionBlocked
      ? 'Wrong Faction'
      : null
  const tileStatusText = SHOW_PICKER_TILE_STATUS_LABELS ? statusText : null
  const { attributes, listeners, isDragging, setNodeRef } = useDraggable({
    id: `picker:${awakenerName}`,
    data: { kind: 'picker-awakener', awakenerName } satisfies DragData,
  })

  return (
    <button
      className={`builder-picker-tile relative border border-slate-500/50 bg-slate-900/40 p-0.5 text-left transition-colors hover:border-amber-200/45 ${
        isDragging ? 'opacity-55 scale-[0.98]' : ''
      } ${isDimmed ? 'opacity-55' : ''}`}
      data-faction-blocked={isFactionBlocked ? 'true' : 'false'}
      data-in-use={isInUse ? 'true' : 'false'}
      onClick={onClick}
      ref={setNodeRef}
      type="button"
      {...attributes}
      {...listeners}
    >
      <div
        className="relative aspect-square overflow-hidden border border-slate-400/35 bg-slate-900/70"
      >
        {portraitAsset ? (
          <img
            alt={`${displayName} portrait`}
            className={`h-full w-full object-cover ${isDimmed ? 'grayscale-[0.9]' : ''}`}
            src={portraitAsset}
          />
        ) : (
          <span className="relative block h-full w-full">
            <span className="sigil-placeholder" />
          </span>
        )}
        <span
          className="pointer-events-none absolute inset-0 z-10 border"
          style={{ borderColor: factionTint }}
        />
        {tileStatusText ? (
          <span className="pointer-events-none absolute inset-x-0 top-0 truncate border-y border-slate-300/30 bg-slate-950/62 px-1 py-0.5 text-center text-[9px] tracking-wide text-slate-100/90">
            {tileStatusText}
          </span>
        ) : null}
      </div>
      <p className="mt-0.5 truncate text-[10px] text-slate-100">{displayName}</p>
    </button>
  )
}
