import type {ReactNode} from 'react'

import {useSortable} from '@dnd-kit/sortable'
import {CSS} from '@dnd-kit/utilities'

interface SortableTeamRowProps {
  teamId: string
  children: ReactNode
  isActive?: boolean
}

export function SortableTeamRow({teamId, children, isActive = false}: SortableTeamRowProps) {
  const {attributes, listeners, setNodeRef, transform, transition, isDragging} = useSortable({
    id: teamId,
    data: {kind: 'team-row', teamId},
    animateLayoutChanges: () => false,
  })

  const hasMeaningfulTransform =
    transform && (Math.abs(transform.x) > 0.5 || Math.abs(transform.y) > 0.5)

  const style: React.CSSProperties = {
    transform: hasMeaningfulTransform ? CSS.Transform.toString(transform) : undefined,
    transition: hasMeaningfulTransform || isDragging ? transition : undefined,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative' as const,
    zIndex: isDragging ? 10 : undefined,
  }

  return (
    <div ref={setNodeRef} {...attributes} style={style}>
      <div className='flex items-start gap-2'>
        <button
          className={`cursor-grab touch-none border px-2 py-3 text-slate-500 transition-colors hover:text-slate-200 ${
            isActive
              ? 'border-amber-300/45 bg-slate-800/72 text-amber-200'
              : 'border-slate-600/45 bg-slate-950/45'
          }`}
          type='button'
          {...listeners}
        >
          ⠿
        </button>
        <div className='min-w-0 flex-1'>{children}</div>
      </div>
    </div>
  )
}
