import {memo, useEffect, useRef, type CSSProperties, type ReactNode} from 'react'

import {FaThumbtack, FaXmark} from 'react-icons/fa6'

import costIcon from '@/assets/icons/UI_Battel_White_Buff_094.png'
import type {FullStats} from '@/domain/awakener-source-schema'
import {getExaltValue} from '@/domain/awakeners-full'
import {getAwakenerTextColor, type AwakenerTextColorName} from '@/domain/awakeners-text-colors'
import {getColoredMainstatIcon, getMainstatIcon} from '@/domain/mainstats'

import type {PopoverHeaderModel} from './popover-header-model'
import {
  DATABASE_ENTRY_TITLE_CLASS,
  DATABASE_POPOVER_DIVIDER_CLASS,
  DATABASE_POPOVER_HEADER_CLASS,
} from './text-styles'

interface PopoverHeaderProps {
  title?: ReactNode
  icon?: ReactNode
  header?: PopoverHeaderModel
  onClose: () => void
  isPinned?: boolean
  onTogglePin?: (e: React.MouseEvent) => void
  titleId?: string
}

export const PopoverHeader = memo(function PopoverHeader({
  title,
  icon,
  header,
  onClose,
  isPinned,
  onTogglePin,
  titleId,
}: PopoverHeaderProps) {
  const headerIcon = header?.icon ?? icon
  const headerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = headerRef.current
    if (!el) {
      return
    }

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
      className={`${DATABASE_POPOVER_HEADER_CLASS} animate-in fade-in slide-in-from-bottom-1 cursor-default touch-none duration-300 ease-out select-none`}
      role='presentation'
      draggable={false}
      onDragStart={(e) => {
        e.preventDefault()
      }}
    >
      <div className='flex min-w-0 flex-1 items-center gap-2 overflow-hidden'>
        <div className='min-w-0 flex-1 overflow-hidden'>
          {header ? (
            <PopoverHeaderContent header={header} headerIcon={headerIcon} titleId={titleId} />
          ) : (
            <div className='flex min-w-0 items-center gap-2 overflow-hidden'>
              {headerIcon && (
                <div className='shrink-0' draggable={false}>
                  {headerIcon}
                </div>
              )}
              {typeof title === 'string' ? (
                <h3
                  id={titleId}
                  className={DATABASE_ENTRY_TITLE_CLASS}
                  style={{fontSize: 'calc(var(--desc-font-scale, 1) * 12px)'}}
                >
                  {title}
                </h3>
              ) : (
                title
              )}
            </div>
          )}
        </div>
        {onTogglePin && <PopoverPinButton isPinned={isPinned} onTogglePin={onTogglePin} />}
        <PopoverCloseButton onClose={onClose} />
      </div>
    </div>
  )
})

export const PopoverPinButton = memo(function PopoverPinButton({
  isPinned,
  onTogglePin,
}: {
  isPinned?: boolean
  onTogglePin: (e: React.MouseEvent) => void
}) {
  return (
    <button
      aria-label={isPinned ? 'Unpin popover' : 'Pin popover'}
      title={isPinned ? 'Unpin popover' : 'Pin popover'}
      className={`hidden h-7 w-7 shrink-0 items-center justify-center rounded-sm transition-all md:flex ${
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
      <FaThumbtack
        className={`transition-transform duration-200 ${isPinned ? '-rotate-45 text-amber-300' : ''}`}
        size={11}
      />
    </button>
  )
})

export const PopoverCloseButton = memo(function PopoverCloseButton({
  onClose,
}: {
  onClose: () => void
}) {
  return (
    <button
      aria-label='Close database popover'
      className='flex size-8 shrink-0 items-center justify-center rounded-sm text-white/70 transition-all hover:bg-red-500/20 hover:text-red-300 active:scale-90'
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
})

function PopoverHeaderContent({
  header,
  headerIcon,
  titleId,
}: Readonly<{
  header: PopoverHeaderModel
  headerIcon?: React.ReactNode
  titleId?: string
}>) {
  return (
    <div className='flex min-w-0 flex-col'>
      <div className='flex min-w-0 items-center gap-2 overflow-hidden'>
        {headerIcon && (
          <div className='shrink-0' draggable={false}>
            {headerIcon}
          </div>
        )}
        <h3
          id={titleId}
          className={`${DATABASE_ENTRY_TITLE_CLASS} min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap ${
            header.titleClassName ?? ''
          }`}
          style={{
            fontSize: 'calc(var(--desc-font-scale, 1) * 12px)',
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
            className='shrink-0 rounded-sm border border-white/8 bg-white/5 px-1.5 py-0.5 text-[10px] font-medium tracking-wider text-white/80 uppercase transition-colors hover:border-amber-300/30 hover:bg-amber-300/10 hover:text-amber-100'
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
      {header.eyebrow ? (
        <div
          className={`mt-0.5 min-w-0 overflow-hidden ${header.eyebrowClassName ?? ''}`}
          style={header.eyebrowStyle}
        >
          {header.eyebrow}
        </div>
      ) : null}
    </div>
  )
}

export const PopoverDivider = memo(function PopoverDivider() {
  return (
    <div
      className={`${DATABASE_POPOVER_DIVIDER_CLASS} animate-in fade-in zoom-in-x-95 duration-500 ease-out`}
    />
  )
})

interface PopoverContentProps {
  children: ReactNode
  className?: string
  style?: React.CSSProperties
}

export const PopoverContent = memo(function PopoverContent({
  children,
  className = '',
  style,
}: PopoverContentProps) {
  return (
    <div
      className={`popover-scrollbar animate-in fade-in slide-in-from-top-1 fill-mode-both flex-1 overflow-x-hidden overflow-y-auto leading-relaxed text-slate-400 delay-75 duration-500 ease-out ${className}`}
      style={{
        fontSize: 'calc(var(--desc-font-scale, 1) * 11px)',
        ...style,
      }}
    >
      {children}
    </div>
  )
})

interface PopoverFooterProps {
  children: ReactNode
}

export const PopoverFooter = memo(function PopoverFooter({children}: PopoverFooterProps) {
  return (
    <div className='mt-2.5 flex items-center justify-between border-t border-white/5 pt-2 text-[10px] text-slate-500'>
      {children}
    </div>
  )
})

export type SkillType = 'command' | 'exalt' | 'talent' | 'enlighten'

interface SkillHeaderIconProps {
  skillType?: SkillType
  isInteractive?: boolean
}

export const SkillHeaderIcon = memo(function SkillHeaderIcon({
  skillType,
  isInteractive,
}: SkillHeaderIconProps) {
  const isCommand = skillType === 'command'
  const isExalt = skillType === 'exalt'
  if (isCommand) {
    return (
      <img
        alt=''
        aria-hidden='true'
        className={`h-[1.4em] w-[1.4em] object-contain opacity-70 transition-opacity ${
          isInteractive ? 'group-hover:opacity-100' : ''
        }`}
        draggable={false}
        src={costIcon}
      />
    )
  }
  if (isExalt) {
    const aliemusIcon = getColoredMainstatIcon('ALIEMUS_REGEN')
    if (!aliemusIcon) {
      return null
    }

    return (
      <img
        alt=''
        aria-hidden='true'
        className={`h-[1.2em] w-[1.2em] object-contain opacity-80 transition-opacity ${
          isInteractive ? 'group-hover:opacity-100' : ''
        }`}
        draggable={false}
        src={aliemusIcon}
      />
    )
  }

  return null
})

interface SkillHeaderValueProps {
  skillType?: SkillType
  cost?: string
  label: string
  stats: FullStats | null
  isInteractive?: boolean
  isOverExalt?: boolean
}

export const SkillHeaderValue = memo(function SkillHeaderValue({
  skillType,
  cost,
  label,
  isInteractive,
  stats,
  isOverExalt,
}: SkillHeaderValueProps) {
  const isCommand = skillType === 'command'
  const isExalt = skillType === 'exalt'
  if (isCommand) {
    return (
      <span
        className={`ui-title font-bold text-[#ededed] transition-colors ${
          isInteractive ? 'group-hover:text-amber-100' : ''
        }`}
        style={{fontSize: 'calc(var(--desc-font-scale, 1) * 12px)'}}
      >
        {cost ?? label}
      </span>
    )
  }
  if (isExalt) {
    const exaltValue = getExaltValue(cost ?? (isOverExalt ? 'over' : ''), stats)
    return (
      <span
        className={`ui-title font-bold text-amber-200/90 transition-colors ${
          isInteractive ? 'group-hover:text-amber-100' : ''
        }`}
        style={{fontSize: 'calc(var(--desc-font-scale, 1) * 12px)'}}
      >
        {exaltValue}
      </span>
    )
  }
  return (
    <span
      className='shrink-0 text-slate-500 italic'
      style={{fontSize: 'calc(var(--desc-font-scale, 1) * 11px)'}}
    >
      {label}
    </span>
  )
})

export interface StatTriadValues {
  CON: number
  ATK: number
  DEF: number
}

const STAT_DISPLAY = [
  {key: 'CON', colorName: 'heal'},
  {key: 'ATK', colorName: 'damage'},
  {key: 'DEF', colorName: 'shield'},
] satisfies {key: keyof StatTriadValues; colorName: AwakenerTextColorName}[]

type StatIconStyle = CSSProperties & {
  '--stat-icon-color': string
  '--stat-icon-url': string
}

export const DatabaseStatTriad = memo(function DatabaseStatTriad({
  stats,
}: {
  stats: StatTriadValues
}) {
  return (
    <div
      aria-label={`Stats CON ${String(stats.CON)}, ATK ${String(stats.ATK)}, DEF ${String(stats.DEF)}`}
      className='database-stat-triad'
    >
      {STAT_DISPLAY.map(({key, colorName}) => {
        const icon = getMainstatIcon(key)
        const iconStyle: StatIconStyle | null = icon
          ? {
              '--stat-icon-color': getAwakenerTextColor(colorName),
              '--stat-icon-url': `url(${icon})`,
            }
          : null
        return (
          <span key={key} className='database-stat-triad__cell'>
            {icon ? (
              <span
                aria-hidden
                className='database-stat-triad__icon'
                style={iconStyle ?? undefined}
              />
            ) : null}
            <span>{stats[key]}</span>
          </span>
        )
      })}
    </div>
  )
})
