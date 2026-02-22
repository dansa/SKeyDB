import { useDraggable } from '@dnd-kit/core'
import type { DragData } from './types'

type PickerCovenantTileProps = {
  covenantId?: string
  covenantName?: string
  covenantAsset?: string
  isNotSet?: boolean
  onClick: () => void
}

export function PickerCovenantTile({
  covenantId,
  covenantName,
  covenantAsset,
  isNotSet = false,
  onClick,
}: PickerCovenantTileProps) {
  const draggableEnabled = !isNotSet && Boolean(covenantId)
  const { attributes, listeners, isDragging, setNodeRef } = useDraggable({
    id: draggableEnabled ? `picker-covenant:${covenantId}` : 'picker-covenant:not-set',
    data: draggableEnabled
      ? ({ kind: 'picker-covenant', covenantId: covenantId! } satisfies DragData)
      : undefined,
    disabled: !draggableEnabled,
  })
  const dragAttributes = { ...attributes } as Record<string, unknown>
  delete dragAttributes['aria-disabled']

  return (
    <button
      aria-label={isNotSet ? 'Not set covenant' : `${covenantName ?? covenantId} covenant`}
      className={`border p-1 text-left transition-colors border-slate-500/45 bg-slate-900/55 hover:border-amber-200/45 ${
        isDragging ? 'scale-[0.98] opacity-60' : ''
      }`}
      onClick={onClick}
      ref={setNodeRef}
      type="button"
      {...(draggableEnabled ? dragAttributes : {})}
      {...(draggableEnabled ? listeners : {})}
    >
      <div className="relative aspect-square overflow-hidden border border-slate-400/35 bg-slate-900/70">
        {covenantAsset ? (
          <img
            alt={`${covenantName ?? covenantId} covenant`}
            className="h-full w-full object-cover"
            draggable={false}
            src={covenantAsset}
          />
        ) : isNotSet ? (
          <span className="builder-disabled-icon">
            <span className="builder-disabled-icon__glyph" />
          </span>
        ) : (
          <span className="relative block h-full w-full">
            <span className="sigil-placeholder" />
          </span>
        )}
      </div>
      <p className="mt-1 truncate text-[11px] text-slate-200">{isNotSet ? 'Not Set' : covenantName ?? covenantId}</p>
    </button>
  )
}
