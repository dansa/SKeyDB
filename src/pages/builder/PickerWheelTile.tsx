import { useDraggable } from '@dnd-kit/core'
import type { DragData } from './types'

type PickerWheelTileProps = {
  wheelId?: string
  wheelName?: string
  wheelAsset?: string
  blockedText?: string | null
  isBlocked?: boolean
  isInUse?: boolean
  isOwned?: boolean
  isNotSet?: boolean
  onClick: () => void
}

export function PickerWheelTile({
  wheelId,
  wheelName,
  wheelAsset,
  blockedText = null,
  isBlocked = false,
  isInUse = false,
  isOwned = true,
  isNotSet = false,
  onClick,
}: PickerWheelTileProps) {
  const isDimmed = isBlocked || isInUse || (!isOwned && !isNotSet)
  const isSoftDimmed = !isBlocked && (isInUse || (!isOwned && !isNotSet))
  const draggableEnabled = !isNotSet && Boolean(wheelId)
  const { attributes, listeners, isDragging, setNodeRef } = useDraggable({
    id: draggableEnabled ? `picker-wheel:${wheelId}` : `picker-wheel:not-set`,
    data: draggableEnabled ? ({ kind: 'picker-wheel', wheelId: wheelId! } satisfies DragData) : undefined,
    disabled: !draggableEnabled,
  })
  const dragAttributes = { ...attributes } as Record<string, unknown>
  delete dragAttributes['aria-disabled']

  return (
    <button
      aria-disabled={isBlocked ? 'true' : undefined}
      className={`border p-1 text-left transition-colors ${
        isBlocked
          ? 'border-slate-500/45 bg-slate-900/45 opacity-55'
          : isSoftDimmed
            ? 'border-slate-500/45 bg-slate-900/45 opacity-55 hover:border-amber-200/45'
            : 'border-slate-500/45 bg-slate-900/55 hover:border-amber-200/45'
      } ${isDragging ? 'scale-[0.98] opacity-60' : ''}`}
      onClick={onClick}
      ref={setNodeRef}
      type="button"
      {...(draggableEnabled ? dragAttributes : {})}
      {...(draggableEnabled ? listeners : {})}
    >
      <div className="relative aspect-[75/113] overflow-hidden border border-slate-400/35 bg-slate-900/70">
        {wheelAsset ? (
          <img
            alt={`${wheelName ?? wheelId} wheel`}
            className={`builder-picker-wheel-image h-full w-full object-cover ${!isOwned && !isNotSet ? 'builder-picker-art-unowned' : ''} ${isDimmed ? 'builder-picker-art-dimmed' : ''}`}
            draggable={false}
            src={wheelAsset}
          />
        ) : (
          <span className="relative block h-full w-full">
            <span className="sigil-placeholder sigil-placeholder-wheel sigil-placeholder-no-plus sigil-placeholder-remove" />
            <span className="sigil-remove-x" />
          </span>
        )}
        {blockedText ? (
          <span className="pointer-events-none absolute inset-x-0 top-0 truncate border-y border-slate-300/30 bg-slate-950/62 px-1 py-0.5 text-center text-[9px] tracking-wide text-slate-100/90">
            {blockedText}
          </span>
        ) : !isNotSet && !isOwned ? (
          <span
            className="pointer-events-none absolute inset-x-0 top-0 truncate border-y border-rose-300/25 bg-slate-950/70 px-1 py-0.5 text-center text-[9px] tracking-wide text-rose-100/95"
          >
            Unowned
          </span>
        ) : null}
      </div>
      <p className="mt-1 truncate text-[11px] text-slate-200">{isNotSet ? 'Not Set' : wheelName ?? wheelId}</p>
    </button>
  )
}
