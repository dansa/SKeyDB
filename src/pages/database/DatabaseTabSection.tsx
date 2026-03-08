import {Children, useState, type ReactNode} from 'react'

import {scaledFontStyle} from './font-scale'
import {DATABASE_SECTION_TITLE_CLASS} from './text-styles'

interface DatabaseTabProps {
  children: ReactNode
}

interface DatabaseTabSectionProps {
  title?: string
  collapsible?: boolean
  defaultCollapsed?: boolean
  children: ReactNode
}

interface DatabaseTabRowProps {
  label: string
  children: ReactNode
  showDivider?: boolean
}

interface DatabaseTabSubsectionProps {
  children: ReactNode
}

interface DatabaseTabProseProps {
  children: ReactNode
  baseFontPx?: number
}

export function DatabaseTab({children}: DatabaseTabProps) {
  return <div className='space-y-4'>{children}</div>
}

export function DatabaseTabSection({
  title,
  collapsible = false,
  defaultCollapsed = false,
  children,
}: DatabaseTabSectionProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed)

  return (
    <div className='border border-slate-600/30 bg-slate-900/30'>
      {title ? (
        collapsible ? (
          <button
            className={`${DATABASE_SECTION_TITLE_CLASS} flex w-full items-center justify-between`}
            onClick={() => {
              setCollapsed((prev) => !prev)
            }}
            style={scaledFontStyle(14)}
            type='button'
          >
            <span>{title}</span>
            <span className='text-[10px] text-slate-400/80'>{collapsed ? '▸ Show' : '▾ Hide'}</span>
          </button>
        ) : (
          <h4 className={DATABASE_SECTION_TITLE_CLASS} style={scaledFontStyle(14)}>
            {title}
          </h4>
        )
      ) : null}
      {collapsed ? null : <div>{children}</div>}
    </div>
  )
}

export function DatabaseTabSubsection({children}: DatabaseTabSubsectionProps) {
  const items = Children.toArray(children)
  return (
    <div>
      {items.map((child, index) => (
        <div key={index}>
          {index > 0 ? (
            <div className='mx-4 h-px bg-gradient-to-r from-slate-600/50 via-slate-600/20 to-transparent' />
          ) : null}
          {child}
        </div>
      ))}
    </div>
  )
}

export function DatabaseTabRow({label, children, showDivider = false}: DatabaseTabRowProps) {
  return (
    <div>
      {showDivider ? (
        <div className='mx-4 h-px bg-gradient-to-r from-slate-600/50 via-slate-600/20 to-transparent' />
      ) : null}
      <div className='px-4 py-2.5'>
        <p className='ui-title text-amber-200/90' style={scaledFontStyle(12)}>
          {label}
        </p>
        <div className='mt-1.5'>{children}</div>
      </div>
    </div>
  )
}

export function DatabaseTabProse({children, baseFontPx = 12}: DatabaseTabProseProps) {
  return (
    <div className='px-4 py-2.5'>
      <p className='leading-relaxed text-slate-400' style={scaledFontStyle(baseFontPx)}>
        {children}
      </p>
    </div>
  )
}
