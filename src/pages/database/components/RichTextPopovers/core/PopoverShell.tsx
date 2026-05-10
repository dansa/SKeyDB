import {type ReactNode} from 'react'

import {
  DATABASE_POPOVER_SHELL_CLASS,
  DATABASE_POPOVER_SURFACE_STYLE,
} from '@/pages/database/utils/text-styles'

import type {PopoverHeaderModel} from './popover-header-model'
import {PopoverDivider, PopoverHeader} from './PopoverAtoms'

export {PopoverContent, PopoverDivider, PopoverFooter, PopoverHeader} from './PopoverAtoms'

interface PopoverShellProps {
  title?: ReactNode
  icon?: ReactNode
  header?: PopoverHeaderModel
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  depth?: number
  totalDepth?: number
  onBack?: () => void
  className?: string
  style?: React.CSSProperties
}

export function PopoverShell({
  title,
  icon,
  header,
  onClose,
  children,
  footer,
  depth,
  totalDepth: _totalDepth,
  onBack,
  className = '',
  style = {},
}: PopoverShellProps) {
  return (
    <div
      className={`${DATABASE_POPOVER_SHELL_CLASS} relative overflow-auto px-3.5 py-2.5 ${className}`}
      draggable={false}
      onDragStart={(e) => {
        e.preventDefault()
      }}
      onMouseDown={(e) => {
        e.stopPropagation()
      }}
      style={{
        ...DATABASE_POPOVER_SURFACE_STYLE,
        ...style,
      }}
    >
      {depth && depth > 1 && (
        <div className='pointer-events-none absolute top-0 left-0 px-1 py-0.5 text-[9px] font-bold text-slate-600 select-none'>
          {depth}
        </div>
      )}
      <PopoverHeader header={header} icon={icon} onBack={onBack} onClose={onClose} title={title} />
      <PopoverDivider />
      {children}
      {footer}
    </div>
  )
}
