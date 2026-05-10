import {memo, useEffect, useRef, type ReactNode} from 'react'

import {FaThumbtack, FaXmark} from 'react-icons/fa6'

import {
  DATABASE_ENTRY_TITLE_CLASS,
  DATABASE_POPOVER_CONTENT_FONT_SIZE,
  DATABASE_POPOVER_DIVIDER_CLASS,
  DATABASE_POPOVER_HEADER_CLASS,
  DATABASE_POPOVER_HEADER_FONT_SIZE,
} from '@/pages/database/utils/text-styles'

import type {PopoverHeaderModel} from './popover-header-model'
import {usePopoverDragContext} from './PopoverDragContext'

interface PopoverHeaderProps {
  title?: ReactNode
  icon?: ReactNode
  header?: PopoverHeaderModel
  onClose: () => void
  onBack?: () => void
}

export const PopoverHeader = memo(function PopoverHeader({
  title,
  icon,
  header,
  onClose,
  onBack: _onBack,
}: PopoverHeaderProps) {
  const headerIcon = header?.icon ?? icon
  const {dragAttributes, dragListeners, isPinned, onTogglePin} = usePopoverDragContext()
  const headerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = headerRef.current
    if (!el) return
    const prevent = (e: Event) => {
      e.preventDefault()
    }
    el.addEventListener('selectstart', prevent)
    return () => {
      el.removeEventListener('selectstart', prevent)
    }
  }, [])

  return (
    <div
      ref={headerRef}
      className={`${DATABASE_POPOVER_HEADER_CLASS} animate-in fade-in slide-in-from-bottom-1 cursor-grab touch-none duration-300 ease-out select-none active:cursor-grabbing`}
      {...dragAttributes}
      {...dragListeners}
      draggable={false}
      onDragStart={(e) => {
        e.preventDefault()
      }}
      onMouseDown={(e) => {
        if (dragListeners?.onMouseDown) {
          ;(dragListeners.onMouseDown as (e: React.MouseEvent) => void)(e)
        }
        e.stopPropagation()
      }}
      onPointerDown={(e) => {
        if (dragListeners?.onPointerDown) {
          ;(dragListeners.onPointerDown as (e: React.PointerEvent) => void)(e)
        }
        e.stopPropagation()
      }}
    >
      <div className='flex min-w-0 flex-1 items-center gap-2 overflow-hidden'>
        {headerIcon && (
          <div className='shrink-0' draggable={false}>
            {headerIcon}
          </div>
        )}
        <div className='min-w-0 flex-1 overflow-hidden'>
          {header ? (
            <PopoverHeaderContent header={header} />
          ) : typeof title === 'string' ? (
            <h3
              className={DATABASE_ENTRY_TITLE_CLASS}
              style={{fontSize: DATABASE_POPOVER_HEADER_FONT_SIZE}}
            >
              {title}
            </h3>
          ) : (
            title
          )}
        </div>

        {onTogglePin && <PopoverPinButton isPinned={isPinned} onTogglePin={onTogglePin} />}

        <PopoverCloseButton onClose={onClose} />
      </div>
    </div>
  )
})

function PopoverPinButton({isPinned, onTogglePin}: {isPinned?: boolean; onTogglePin: () => void}) {
  return (
    <button
      aria-label={isPinned ? 'Unpin popover' : 'Pin popover'}
      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-sm transition-all ${
        isPinned
          ? 'bg-amber-400/5 text-amber-300 hover:bg-amber-300/15'
          : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
      }`}
      onClick={onTogglePin}
      onMouseDown={(e) => {
        e.stopPropagation()
      }}
      onPointerDown={(e) => {
        e.stopPropagation()
      }}
      type='button'
    >
      <FaThumbtack className={isPinned ? '-rotate-45' : ''} size={11} />
    </button>
  )
}

function PopoverCloseButton({onClose}: {onClose: () => void}) {
  return (
    <button
      aria-label='Close popover'
      className='flex h-7 w-7 shrink-0 items-center justify-center rounded-sm text-slate-400 transition-all hover:bg-red-500/20 hover:text-red-300 active:scale-90'
      onClick={onClose}
      onMouseDown={(e) => {
        e.stopPropagation()
      }}
      onPointerDown={(e) => {
        e.stopPropagation()
      }}
      type='button'
    >
      <FaXmark size={14} />
    </button>
  )
}

function PopoverHeaderContent({header}: Readonly<{header: PopoverHeaderModel}>) {
  return (
    <div className='flex min-w-0 flex-col'>
      {header.eyebrow ? (
        <div
          className={`mb-0.5 min-w-0 overflow-hidden ${header.eyebrowClassName ?? ''}`}
          style={header.eyebrowStyle}
        >
          {header.eyebrow}
        </div>
      ) : null}

      <div className='flex min-w-0 items-center gap-2 overflow-hidden'>
        <h3
          className={`${DATABASE_ENTRY_TITLE_CLASS} min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap ${
            header.titleClassName ?? ''
          }`}
          style={{
            fontSize: DATABASE_POPOVER_HEADER_FONT_SIZE,
            ...header.titleStyle,
          }}
        >
          {header.title}
        </h3>

        {header.accent ? (
          <div className={`shrink-0 ${header.accentClassName ?? ''}`} style={header.accentStyle}>
            {header.accent}
          </div>
        ) : null}

        {header.action ? (
          <button
            className='shrink-0 rounded-sm border border-white/8 bg-white/5 px-1.5 py-0.5 text-[10px] font-medium tracking-wider text-slate-300 uppercase transition-colors hover:border-amber-300/30 hover:bg-amber-300/10 hover:text-amber-100'
            onClick={header.action.onClick}
            onMouseDown={(e) => {
              e.stopPropagation()
            }}
            onPointerDown={(e) => {
              e.stopPropagation()
            }}
            title={header.action.title}
            type='button'
          >
            {header.action.label}
          </button>
        ) : null}
      </div>
    </div>
  )
}

export function PopoverDivider() {
  return (
    <div
      className={`${DATABASE_POPOVER_DIVIDER_CLASS} animate-in fade-in zoom-in-x-95 duration-500 ease-out`}
    />
  )
}

interface PopoverContentProps {
  children: ReactNode
  className?: string
}

export function PopoverContent({children, className = ''}: PopoverContentProps) {
  return (
    <div
      className={`animate-in fade-in slide-in-from-top-1 fill-mode-both leading-relaxed text-slate-400 delay-75 duration-500 ease-out ${className}`}
      style={{fontSize: DATABASE_POPOVER_CONTENT_FONT_SIZE}}
    >
      {children}
    </div>
  )
}

interface PopoverFooterProps {
  children: ReactNode
}

export function PopoverFooter({children}: PopoverFooterProps) {
  return (
    <div className='mt-2.5 flex items-center justify-between border-t border-white/5 pt-2 text-[10px] text-slate-500'>
      {children}
    </div>
  )
}
