import type {ReactNode} from 'react'

import {useDroppable} from '@dnd-kit/core'

interface PickerDropZoneProps {
  id: string
  className: string
  children: ReactNode
}

export function PickerDropZone({id, className, children}: PickerDropZoneProps) {
  const {setNodeRef} = useDroppable({id})

  return (
    <div className={className} ref={setNodeRef}>
      {children}
    </div>
  )
}
