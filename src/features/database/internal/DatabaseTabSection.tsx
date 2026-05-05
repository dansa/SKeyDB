import {Children, useId, useState, type ReactNode} from 'react'

import {
  getDatabaseDetailBodyTextStyle,
  getDatabaseDetailSectionHeadingStyle,
} from './database-detail-typography'
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
  const contentId = useId()
  const titleId = useId()

  return (
    <div className='border border-slate-600/30 bg-slate-900/30'>
      {title ? (
        collapsible ? (
          <button
            aria-controls={contentId}
            aria-expanded={!collapsed}
            className={`${DATABASE_SECTION_TITLE_CLASS} flex w-full items-center justify-between`}
            onClick={() => {
              setCollapsed((prev) => !prev)
            }}
            style={getDatabaseDetailSectionHeadingStyle()}
            type='button'
          >
            <span id={titleId}>{title}</span>
            <span className='text-[10px] text-slate-400/80'>{collapsed ? '▸ Show' : '▾ Hide'}</span>
          </button>
        ) : (
          <h4
            className={DATABASE_SECTION_TITLE_CLASS}
            id={titleId}
            style={getDatabaseDetailSectionHeadingStyle()}
          >
            {title}
          </h4>
        )
      ) : null}
      {collapsed ? null : (
        <div
          aria-labelledby={title ? titleId : undefined}
          id={contentId}
          role={title ? 'region' : undefined}
        >
          {children}
        </div>
      )}
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
        <p className='ui-title text-amber-200/90' style={getDatabaseDetailBodyTextStyle()}>
          {label}
        </p>
        <div className='mt-1.5'>{children}</div>
      </div>
    </div>
  )
}
