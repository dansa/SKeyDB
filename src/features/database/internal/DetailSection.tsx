import type {ReactNode} from 'react'

import type {DescribedRecord} from '@/domain/description-records'

import {
  DATABASE_DETAIL_BODY_CLASS,
  getDatabaseDetailBodyTextStyle,
  getDatabaseDetailSectionHeadingStyle,
} from './database-detail-typography'
import {DATABASE_ITEM_NAME_CLASS, DATABASE_SECTION_TITLE_CLASS} from './text-styles'

export interface DetailSectionItem {
  key: string
  label?: ReactNode
  name: string
  description: string
  keywordFooterText?: string
  record?: DescribedRecord
  descriptionRank?: number
  descriptionMaxRank?: number
  meta?: ReactNode
  nameColor?: string
}
interface DetailSectionProps {
  title: string
  items: DetailSectionItem[]
  emptyMessage?: string
  children?: ReactNode
  renderDescription?: (item: DetailSectionItem) => ReactNode
  onItemClick?: (item: DetailSectionItem, event: React.MouseEvent<HTMLElement>) => void
}
export function DetailSection({
  title,
  items,
  emptyMessage,
  children,
  renderDescription,
  onItemClick,
}: DetailSectionProps) {
  return (
    <div>
      <h4 className={DATABASE_SECTION_TITLE_CLASS} style={getDatabaseDetailSectionHeadingStyle()}>
        {title}
      </h4>
      {items.length === 0 && !children ? (
        <p className='px-4 pb-3 text-slate-400' style={getDatabaseDetailBodyTextStyle()}>
          {emptyMessage ?? 'No data available.'}
        </p>
      ) : (
        <div className='flex flex-col gap-y-3 pt-0 pb-2'>
          {items.map((item) => (
            <div
              className='border border-white/4 bg-white/2 px-3.5 py-2.5 shadow-sm'
              data-skill-name={item.name}
              key={item.key}
            >
              <div
                className='m-0 flex items-center justify-between text-slate-300'
                style={getDatabaseDetailBodyTextStyle()}
              >
                {onItemClick ? (
                  <button
                    type='button'
                    className='flex min-w-0 cursor-pointer items-center gap-1.5 bg-transparent p-0 text-inherit transition-colors hover:text-amber-100'
                    onClick={(event) => {
                      onItemClick(item, event)
                    }}
                  >
                    {item.label && (
                      <>
                        <span className='flex items-center text-slate-500'>{item.label}</span>
                        <span className='h-3 w-px shrink-0 bg-white/12' />
                      </>
                    )}
                    <span
                      className={DATABASE_ITEM_NAME_CLASS}
                      style={item.nameColor ? {color: item.nameColor} : undefined}
                    >
                      {item.name}
                    </span>
                  </button>
                ) : (
                  <div className='flex min-w-0 items-center gap-1.5'>
                    {item.label && (
                      <>
                        <span className='flex items-center text-slate-500'>{item.label}</span>
                        <span className='h-3 w-px shrink-0 bg-white/12' />
                      </>
                    )}
                    <span
                      className={DATABASE_ITEM_NAME_CLASS}
                      style={item.nameColor ? {color: item.nameColor} : undefined}
                    >
                      {item.name}
                    </span>
                  </div>
                )}
                {item.meta && <div className='shrink-0'>{item.meta}</div>}
              </div>
              <div className='mt-1.5 mb-1 h-px w-full bg-gradient-to-r from-white/8 via-white/3 to-transparent' />
              <div
                className={`mt-1 ${DATABASE_DETAIL_BODY_CLASS}`}
                style={getDatabaseDetailBodyTextStyle()}
              >
                {renderDescription ? renderDescription(item) : item.description}
              </div>
            </div>
          ))}
          {children}
        </div>
      )}
    </div>
  )
}
