import {type CSSProperties, type ReactNode} from 'react'

import {useDatabasePopoverControllerContext} from './database-popover-context'

interface DatabaseRootReferenceLabelProps {
  children: ReactNode
  referenceName: string
  style?: CSSProperties
}

export function DatabaseRootReferenceLabel({
  children,
  referenceName,
  style,
}: DatabaseRootReferenceLabelProps) {
  const popoverController = useDatabasePopoverControllerContext()

  if (!popoverController) {
    return <>{children}</>
  }

  return (
    <button
      className='cursor-pointer text-slate-500 transition-colors hover:text-amber-100'
      onClick={(event) => {
        popoverController.openRootReferenceByName(referenceName, event)
      }}
      style={style}
      type='button'
    >
      {children}
    </button>
  )
}
