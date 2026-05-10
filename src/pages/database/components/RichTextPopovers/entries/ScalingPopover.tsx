import {memo} from 'react'

import type {AwakenerFullStats} from '@/domain/awakeners-full'
import {computeStatValue, fmtNum} from '@/domain/scaling'
import {DATABASE_POPOVER_CONTENT_FONT_SIZE} from '@/pages/database/utils/text-styles'

import type {PopoverHeaderModel} from '../core/popover-header-model'
import {PopoverContent, PopoverShell} from '../core/PopoverShell'

type ScalingPopoverProps = Readonly<{
  values: number[]
  suffix: string
  stat: string | null
  stats: AwakenerFullStats | null
  currentLevel?: number
  levelLabelPrefix?: string
  levelStart?: number
  onClose: () => void
  depth?: number
  totalDepth?: number
  onBack?: () => void
}>

export const ScalingPopover = memo(function ScalingPopover({
  values,
  suffix,
  stat,
  stats,
  currentLevel,
  levelLabelPrefix = 'Lv.',
  levelStart = 1,
  onClose,
  depth,
  totalDepth,
  onBack,
}: ScalingPopoverProps) {
  const usesCustomLevelLabels = levelLabelPrefix !== 'Lv.' || levelStart !== 1
  const getStatColor = (statName: string | null) => {
    if (statName === null) return 'text-amber-200'
    const upperName = statName.toUpperCase()
    if (upperName.includes('ATK')) return 'text-red-400'
    if (upperName.includes('CON')) return 'text-green-400'
    if (upperName.includes('DEF')) return 'text-blue-400'
    return 'text-amber-200'
  }

  const isMultiColumn = values.length > 3
  const columns = isMultiColumn ? [0, 1] : [0]
  const header: PopoverHeaderModel = stat
    ? {
        title: (
          <span className='flex items-baseline gap-2'>
            <span className={getStatColor(stat)}>{stat}</span>
            <span className='h-[1em] w-px shrink-0 translate-y-[0.15em] bg-white/10' />
            <span
              className='font-semibold tracking-tight text-amber-200'
              style={{fontSize: DATABASE_POPOVER_CONTENT_FONT_SIZE}}
            >
              Scaling
            </span>
          </span>
        ),
        titleClassName: 'font-semibold tracking-tight',
        titleStyle: {
          fontSize: DATABASE_POPOVER_CONTENT_FONT_SIZE,
        },
      }
    : {
        title: 'Lvl Scaling',
        titleClassName: 'font-semibold tracking-tight text-amber-200',
        titleStyle: {
          fontSize: DATABASE_POPOVER_CONTENT_FONT_SIZE,
        },
      }

  return (
    <PopoverShell
      className='max-w-[360px] resize-none overflow-hidden'
      depth={depth}
      header={header}
      onBack={onBack}
      onClose={onClose}
      totalDepth={totalDepth}
    >
      <PopoverContent>
        <div
          className={`flex tabular-nums ${
            isMultiColumn
              ? usesCustomLevelLabels
                ? 'gap-x-[0.9em]'
                : 'divide-x divide-slate-700/50'
              : ''
          }`}
        >
          {columns.map((col) => {
            const itemsPerCol = isMultiColumn ? Math.ceil(values.length / 2) : values.length
            const colItems = values.slice(col * itemsPerCol, (col + 1) * itemsPerCol)

            if (colItems.length === 0) return null

            const getColumnClassName = (colIndex: number) => {
              if (usesCustomLevelLabels) return 'flex min-w-0 flex-1 flex-col gap-y-[0.15em]'
              if (!isMultiColumn) return 'flex min-w-0 flex-col gap-y-[0.1em]'
              const base = 'flex min-w-0 flex-1 flex-col gap-y-[0.1em]'
              return colIndex === 0 ? `${base} pr-[0.8em]` : `${base} pl-[0.8em]`
            }

            return (
              <div className={getColumnClassName(col)} key={`column-${String(col)}`}>
                {colItems.map((value, index) => {
                  const globalIdx = col * itemsPerCol + index
                  const computed = computeStatValue(value, suffix, stat, stats)
                  const displayLevel = globalIdx + levelStart
                  const isCurrent = displayLevel === currentLevel

                  const getRowClassName = () => {
                    const base = usesCustomLevelLabels
                      ? 'grid grid-cols-[3.1em_minmax(0,1fr)] items-center gap-x-[0.7em] px-[0.45em] py-[0.22em]'
                      : '-mx-[0.3em] flex items-center gap-x-[0.8em] px-[0.3em] py-[0.1em]'

                    const status = isCurrent ? 'bg-amber-400/10' : 'hover:bg-white/5'

                    return `${base} rounded-[0.3em] transition-colors duration-200 ${status}`
                  }

                  return (
                    <div className={getRowClassName()} key={`level-${String(globalIdx + 1)}`}>
                      <span
                        className={
                          usesCustomLevelLabels
                            ? 'text-[0.8em] font-medium tracking-tight text-slate-500'
                            : 'w-[2em] shrink-0 text-[0.8em] font-medium tracking-tighter text-slate-500'
                        }
                      >
                        {levelLabelPrefix}
                        {displayLevel}
                      </span>

                      <div className='flex items-center justify-end gap-x-[0.45em]'>
                        {computed === null ? (
                          <span className='inline-block min-w-[3.2em] text-right font-bold text-amber-100'>
                            {fmtNum(value)}
                            {suffix}
                          </span>
                        ) : (
                          <>
                            <span className='inline-block min-w-[2em] text-right font-bold text-amber-100'>
                              {computed}
                            </span>
                            <span className='text-[0.8em] font-bold text-slate-700'>|</span>
                            <span className='inline-block min-w-[3em] text-left text-[0.85em] font-medium text-slate-500'>
                              {fmtNum(value)}
                              {suffix}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </PopoverContent>
    </PopoverShell>
  )
})
