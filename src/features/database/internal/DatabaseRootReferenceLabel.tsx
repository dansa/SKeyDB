import {type CSSProperties, type ReactNode} from 'react'

import type {DatabaseReferenceInfo} from '@/domain/database-reference-layer'

import {useDatabasePopoverControllerContext} from './database-popover-context'
import {DATABASE_INHERIT_FONT_SIZE_CLASS} from './text-styles'

interface DatabaseRootReferenceLabelProps {
  children: ReactNode
  referenceKind?: DatabaseReferenceInfo['kind']
  referenceName: string
  style?: CSSProperties
}

export function DatabaseRootReferenceLabel({
  children,
  referenceKind,
  referenceName,
  style,
}: DatabaseRootReferenceLabelProps) {
  const popoverController = useDatabasePopoverControllerContext()

  if (!popoverController) {
    return <>{children}</>
  }

  return (
    <button
      className={`cursor-pointer text-slate-500 transition-colors hover:text-amber-100 ${DATABASE_INHERIT_FONT_SIZE_CLASS}`}
      onClick={(event) => {
        if (referenceKind) {
          popoverController.openRootReferenceByName(referenceName, event, referenceKind)
          return
        }
        popoverController.openRootReferenceByName(referenceName, event)
      }}
      style={style}
      type='button'
    >
      {children}
    </button>
  )
}
