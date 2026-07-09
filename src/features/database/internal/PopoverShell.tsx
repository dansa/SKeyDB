import {useId, type ReactNode} from 'react'

import type {PopoverHeaderModel} from './popover-header-model'
import {PopoverDivider, PopoverHeader} from './PopoverAtoms'
import {DATABASE_POPOVER_SHELL_CLASS, DATABASE_POPOVER_SURFACE_STYLE} from './text-styles'

export {PopoverContent, PopoverDivider, PopoverFooter, PopoverHeader} from './PopoverAtoms'

/**
 * Interface properties configuring visual presentation details of PopoverShell.
 */
interface PopoverShellProps {
  /** Optional visual react node representing the dialog title. */
  title?: ReactNode
  /** Optional icon graphic node. */
  icon?: ReactNode
  /** Unified visual header model. */
  header?: PopoverHeaderModel
  /** Callback fired immediately when close button click triggers. */
  onClose: () => void
  /** React children representing content sections. */
  children: ReactNode
  /** Optional sticky footer element. */
  footer?: ReactNode
  /** Current popover stacking level index. */
  depth?: number
  /** Total nested trail popovers count. */
  totalDepth?: number

  /** Visual class overrides. */
  className?: string
  /** Bounded dynamic inline styles mapping. */
  style?: React.CSSProperties
  /** Set to true to suppress displaying default headers. */
  hideHeader?: boolean
  /** Pin state status indicator. */
  isPinned?: boolean
  /** Callback triggered when pin button toggles. */
  onTogglePin?: (e: React.MouseEvent) => void
}

/**
 * Common container component supplying the standardized visual shell wrapper,
 * shadows, scroll styling, and layout controls.
 */
const DEFAULT_STYLE: React.CSSProperties = {}

export function PopoverShell({
  title,
  icon,
  header,
  onClose,
  children,
  footer,
  depth,
  totalDepth: _totalDepth,
  className = '',
  style = DEFAULT_STYLE,
  hideHeader = false,
  isPinned,
  onTogglePin,
}: PopoverShellProps) {
  const headerId = useId()

  return (
    <dialog
      open
      aria-labelledby={!hideHeader ? headerId : undefined}
      className={`${DATABASE_POPOVER_SHELL_CLASS} popover-scrollbar relative m-0 flex max-h-[inherit] flex-col border-none px-3.5 py-2.5 ${className}`}
      draggable={false}
      onDragStart={(e) => {
        e.preventDefault()
      }}
      style={{
        ...DATABASE_POPOVER_SURFACE_STYLE,
        ...style,
      }}
    >
      <div
        className='flex max-h-[inherit] min-h-0 flex-1 flex-col'
        onMouseDown={(e) => {
          e.stopPropagation()
        }}
      >
        {depth !== undefined && depth >= 1 && (
          <div className='pointer-events-none absolute top-0 left-0 px-1 py-0.5 text-[9px] font-bold text-slate-500/40 select-none'>
            {depth}
          </div>
        )}
        {!hideHeader && (
          <>
            <PopoverHeader
              header={header}
              icon={icon}
              onClose={onClose}
              title={title}
              titleId={headerId}
              isPinned={isPinned}
              onTogglePin={onTogglePin}
            />
            <PopoverDivider />
          </>
        )}
        {children}
        {footer}
      </div>
    </dialog>
  )
}
