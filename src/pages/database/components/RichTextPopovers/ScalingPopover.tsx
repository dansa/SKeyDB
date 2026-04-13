import {FaXmark} from 'react-icons/fa6'

import type {AwakenerFullStats} from '@/domain/awakeners-full'
import {computeStatValue, fmtNum} from '@/domain/scaling'
import {
  DATABASE_ENTRY_TITLE_CLASS,
  DATABASE_POPOVER_DIVIDER_CLASS,
  DATABASE_POPOVER_HEADER_CLASS,
  DATABASE_POPOVER_SHELL_CLASS,
  DATABASE_POPOVER_SURFACE_STYLE,
} from '@/pages/database/utils/text-styles'

type ScalingPopoverProps = Readonly<{
  values: number[]
  suffix: string
  stat: string | null
  stats: AwakenerFullStats | null
  currentLevel?: number
  levelLabelPrefix?: string
  levelStart?: number
  onClose: () => void
}>

export function ScalingPopover({
  values,
  suffix,
  stat,
  stats,
  currentLevel,
  levelLabelPrefix = 'Lv.',
  levelStart = 1,
  onClose,
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
  const title = stat ? (
    <>
      <span className={getStatColor(stat)}>{stat}</span> Scaling
    </>
  ) : (
    'Lvl Scaling'
  )

  return (
    <div
      className={`${DATABASE_POPOVER_SHELL_CLASS} ${usesCustomLevelLabels ? 'w-60 max-w-60' : ''} p-[0.7em]`}
      style={{
        fontSize: 'calc(var(--desc-font-scale, 1) * 10px)',
        ...DATABASE_POPOVER_SURFACE_STYLE,
      }}
    >
      <div className={`${DATABASE_POPOVER_HEADER_CLASS} pl-0`}>
        <h3
          className={`${DATABASE_ENTRY_TITLE_CLASS} text-[1.2em] font-semibold tracking-tight text-amber-200`}
        >
          {title}
        </h3>
        <button
          className='-mt-[0.1em] -mr-[0.1em] text-slate-400 transition-colors hover:text-white'
          onClick={onClose}
          type='button'
        >
          <FaXmark size='1.1em' />
        </button>
      </div>
      <div className={DATABASE_POPOVER_DIVIDER_CLASS} />

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

          const columnClassName = usesCustomLevelLabels
            ? 'flex min-w-0 flex-1 flex-col gap-y-[0.15em]'
            : !isMultiColumn
              ? 'flex flex-col gap-y-[0.1em]'
              : col === 0
                ? 'flex flex-col gap-y-[0.1em] pr-[0.8em]'
                : 'flex flex-col gap-y-[0.1em] pl-[0.8em]'

          return (
            <div className={columnClassName} key={`column-${String(col)}`}>
              {colItems.map((value, index) => {
                const globalIdx = col * itemsPerCol + index
                const computed = computeStatValue(value, suffix, stat, stats)
                const displayLevel = globalIdx + levelStart
                const isCurrent = displayLevel === currentLevel
                const rowClassName = usesCustomLevelLabels
                  ? isCurrent
                    ? 'grid grid-cols-[3.1em_minmax(0,1fr)] items-center gap-x-[0.7em] rounded-[0.3em] bg-amber-400/10 px-[0.45em] py-[0.22em] transition-colors duration-200'
                    : 'grid grid-cols-[3.1em_minmax(0,1fr)] items-center gap-x-[0.7em] rounded-[0.3em] px-[0.45em] py-[0.22em] transition-colors duration-200 hover:bg-white/5'
                  : isCurrent
                    ? '-mx-[0.3em] flex items-center gap-x-[0.8em] rounded-[0.3em] bg-amber-400/10 px-[0.3em] py-[0.1em] transition-colors duration-200'
                    : '-mx-[0.3em] flex items-center gap-x-[0.8em] rounded-[0.3em] px-[0.3em] py-[0.1em] transition-colors duration-200 hover:bg-white/5'

                return (
                  <div className={rowClassName} key={`level-${String(globalIdx + 1)}`}>
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
                        <span className='inline-block min-w-[3.2em] text-right text-[1.1em] font-bold text-amber-100'>
                          {fmtNum(value)}
                          {suffix}
                        </span>
                      ) : (
                        <>
                          <span className='inline-block min-w-[2em] text-right text-[1.1em] font-bold text-amber-100'>
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
    </div>
  )
}
