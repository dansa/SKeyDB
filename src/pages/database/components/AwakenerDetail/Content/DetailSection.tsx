import type {ReactNode} from 'react'

import {scaledFontStyle} from '../../../utils/font-scale'
import {DATABASE_ITEM_NAME_CLASS, DATABASE_SECTION_TITLE_CLASS} from '../../../utils/text-styles'

export interface DetailSectionItem {
  key: string
  label: ReactNode
  rightLabel?: ReactNode
  name: string
  nameColor?: string
  description: string
}

type DetailSectionProps = Readonly<{
  title: string
  items: DetailSectionItem[]
  emptyMessage?: string
  children?: ReactNode
  renderDescription?: (description: string) => ReactNode
  realmTint?: string
}>

export function DetailSection({
  title,
  items,
  emptyMessage,
  children,
  renderDescription,
  realmTint,
}: DetailSectionProps) {
  return (
    <div>
      <h4
        className={DATABASE_SECTION_TITLE_CLASS}
        style={{...scaledFontStyle(20), color: realmTint}}
      >
        {title}
      </h4>

      {items.length === 0 && !children ? (
        <p className='px-4 pb-3 text-xs text-slate-400'>{emptyMessage ?? 'No data available.'}</p>
      ) : (
        <div className='flex flex-col gap-y-3 pt-0 pb-2'>
          {items.map((item) => (
            <div
              className='border border-white/4 bg-white/2 px-3.5 py-2.5 shadow-sm'
              key={item.key}
            >
              <div
                className='m-0 flex items-center justify-between text-slate-300'
                style={scaledFontStyle(12)}
              >
                <div className='flex items-center gap-1.5'>
                  <span className='flex items-center text-slate-500'>{item.label}</span>
                  <span className='text-slate-600'>·</span>
                  <span
                    className={DATABASE_ITEM_NAME_CLASS}
                    style={item.nameColor ? {color: item.nameColor} : undefined}
                  >
                    {item.name}
                  </span>
                </div>
                {item.rightLabel && (
                  <span className='shrink-0 text-slate-500 italic' style={scaledFontStyle(10)}>
                    {item.rightLabel}
                  </span>
                )}
              </div>
              <div className='my-2 h-px w-full bg-linear-to-r from-white/8 via-white/3 to-transparent' />
              <div className='mt-1 pl-2 leading-relaxed text-slate-400' style={scaledFontStyle(12)}>
                {renderDescription ? renderDescription(item.description) : item.description}
              </div>
            </div>
          ))}
          {children}
        </div>
      )}
    </div>
  )
}
