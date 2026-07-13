import {memo, useCallback, type MouseEvent} from 'react'

import {FaClipboard} from 'react-icons/fa6'

import type {FullStats} from '@/domain/awakener-source-schema'
import {computeStatValue, fmtNum} from '@/domain/scaling'

import {FONT_SCALE_VALUES} from './font-scale'
import {useDatabaseDetailPreferences} from './useDatabaseDetailPreferences'

function parseFormulaComponents(formula: string): {
  calculation: string
  source: string | null
  operator: string
  multiplierTerm: string
} | null {
  let stripped = formula.trim()
  if (stripped.startsWith('(')) {
    stripped = stripped.slice(1)
  }

  if (stripped.endsWith(')')) {
    stripped = stripped.slice(0, -1)
  }

  const fromIdx = stripped.lastIndexOf(' from ')
  if (fromIdx < 0) {
    const isAdditive = stripped.includes(' + ')
    const operator = isAdditive ? '+' : '×'
    const parts = stripped.split(isAdditive ? ' + ' : ' × ')
    const multiplierTerm = parts.length > 1 ? parts[parts.length - 1].trim() : ''
    return {
      calculation: stripped,
      source: null,
      operator,
      multiplierTerm,
    }
  }

  const calculation = stripped.slice(0, fromIdx).trim()
  const source = stripped.slice(fromIdx + 6).trim()
  const isAdditive = calculation.includes(' + ')
  const operator = isAdditive ? '+' : '×'
  const parts = calculation.split(isAdditive ? ' + ' : ' × ')
  const multiplierTerm = parts.length > 1 ? parts[parts.length - 1].trim() : ''

  return {calculation, source, operator, multiplierTerm}
}

export type PopoverScalingGridProps = Readonly<{
  values: number[]
  suffix: string
  stat: string | null
  stats: FullStats | null
  currentLevel?: number
  levelLabelPrefix?: string
  levelStart?: number
  scalingFormulas?: string[]
  scalingFinalValues?: number[]
  scalingAbstractFormula?: string
  scalingAbstractFormulaExplanations?: {label: string; value: string; sourceName?: string}[]
  onOpenReferenceName?: (name: string, event?: MouseEvent) => void
  shouldCeil?: boolean
  showVisibleScaling?: boolean
  onLevelChange?: (level: number) => void
}>

export const PopoverScalingGrid = memo(function PopoverScalingGrid({
  values,
  suffix,
  stat,
  stats,
  currentLevel,
  levelLabelPrefix = 'Lv.',
  levelStart = 1,
  scalingFormulas,
  scalingFinalValues,
  scalingAbstractFormula,
  scalingAbstractFormulaExplanations,
  onOpenReferenceName,
  shouldCeil = false,
  showVisibleScaling = true,
  onLevelChange,
}: PopoverScalingGridProps) {
  const {preferences} = useDatabaseDetailPreferences()
  const gridFontSizePx = 11 * FONT_SCALE_VALUES[preferences.shared.fontScale]
  const usesCustomLevelLabels = levelLabelPrefix !== 'Lv.' || levelStart !== 1
  const isMultiColumn = values.length > 3
  const columns = isMultiColumn ? [0, 1] : [0]

  const clampedCurrentLevel =
    currentLevel !== undefined
      ? Math.max(levelStart, Math.min(levelStart + values.length - 1, currentLevel))
      : undefined

  const activeLevelIndex =
    clampedCurrentLevel !== undefined &&
    clampedCurrentLevel - levelStart >= 0 &&
    clampedCurrentLevel - levelStart < values.length
      ? clampedCurrentLevel - levelStart
      : undefined
  const activeFormula =
    activeLevelIndex !== undefined ? scalingFormulas?.[activeLevelIndex] : undefined
  const activeFinalValue =
    activeLevelIndex !== undefined ? scalingFinalValues?.[activeLevelIndex] : undefined
  const activeBaseValue = activeLevelIndex !== undefined ? values[activeLevelIndex] : undefined

  const parsedFormula = activeFormula ? parseFormulaComponents(activeFormula) : null

  const computedFinal =
    activeFinalValue !== undefined
      ? computeStatValue(activeFinalValue, suffix, stat, stats)
      : activeBaseValue !== undefined
        ? computeStatValue(activeBaseValue, suffix, stat, stats)
        : null

  const rawPct = activeFinalValue ?? activeBaseValue ?? 0
  const displayPct = shouldCeil ? Math.ceil(rawPct - 1e-9) : rawPct

  const handleCopyFormula = useCallback(() => {
    const formulaText =
      scalingAbstractFormula ??
      (parsedFormula
        ? parsedFormula.source
          ? `base ${parsedFormula.operator} bonus from ${parsedFormula.source}`
          : `base`
        : '')

    if (formulaText) {
      void navigator.clipboard.writeText(formulaText)
    }
  }, [scalingAbstractFormula, parsedFormula])

  return (
    <div
      className='flex w-full flex-col'
      style={{fontSize: `${String(Math.round(gridFontSizePx))}px`}}
    >
      <div
        className={`flex w-full tabular-nums ${
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

          if (colItems.length === 0) {
            return null
          }

          const getColumnClassName = (colIndex: number) => {
            if (usesCustomLevelLabels) {
              return 'flex min-w-0 flex-1 flex-col gap-y-[0.15em]'
            }

            if (!isMultiColumn) {
              return 'flex min-w-0 w-full flex-col gap-y-[0.1em] px-[0.3em]'
            }

            const base = 'flex min-w-0 flex-1 flex-col gap-y-[0.1em]'
            return colIndex === 0
              ? `${base} pl-[0.3em] pr-[0.8em]`
              : `${base} pl-[0.8em] pr-[0.3em]`
          }

          return (
            <div className={getColumnClassName(col)} key={`column-${String(col)}`}>
              {colItems.map((value, index) => {
                const globalIdx = col * itemsPerCol + index
                const finalValue = scalingFinalValues?.[globalIdx]
                const hasUpgrade = finalValue !== undefined && Math.abs(finalValue - value) > 1e-4

                const formatGridValue = (val: number) => {
                  const displayVal = shouldCeil ? Math.ceil(val - 1e-9) : val
                  return fmtNum(displayVal)
                }

                const displayText = hasUpgrade
                  ? `${formatGridValue(value)} (${formatGridValue(finalValue)})`
                  : formatGridValue(value)

                const computed = computeStatValue(value, suffix, stat, stats)
                const computedFinalVal =
                  finalValue !== undefined
                    ? computeStatValue(finalValue, suffix, stat, stats)
                    : null
                const hasComputedUpgrade =
                  computed !== null && computedFinalVal !== null && computed !== computedFinalVal
                const displayLevel = globalIdx + levelStart
                const isCurrent = displayLevel === clampedCurrentLevel

                const baseClass = usesCustomLevelLabels
                  ? 'grid grid-cols-[3.2em_1fr_auto_1.2fr] items-center gap-x-[0.4em] px-[0.45em] py-[0.22em]'
                  : 'grid grid-cols-[2.5em_1fr_auto_1.2fr] items-center gap-x-[0.4em] px-[0.3em] py-[0.15em]'

                const interactiveClass = onLevelChange
                  ? 'cursor-pointer select-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-400/40'
                  : ''

                const statusClass = isCurrent
                  ? 'bg-amber-400/15 text-amber-200 shadow-[inset_0_0_0_1px_rgba(251,191,36,0.2)] font-medium'
                  : 'hover:bg-white/5 text-slate-300'

                const rowClassName = `${baseClass} rounded-[0.3em] transition-all duration-200 ${interactiveClass} ${statusClass}`

                const handleRowClick = () => {
                  if (onLevelChange) {
                    onLevelChange(displayLevel)
                  }
                }

                const rowContent = (
                  <>
                    <span
                      className={
                        usesCustomLevelLabels
                          ? 'text-[0.8em] font-medium tracking-tight text-slate-500'
                          : 'text-[0.8em] font-medium tracking-tighter text-slate-500'
                      }
                    >
                      {levelLabelPrefix}
                      {displayLevel}
                    </span>

                    {computed === null ? (
                      <span className='col-span-3 text-right font-bold text-amber-100'>
                        {displayText}
                        {suffix}
                      </span>
                    ) : (
                      <>
                        <span className='text-right font-bold text-amber-100'>
                          {hasComputedUpgrade
                            ? `${String(computed)} (${String(computedFinalVal)})`
                            : computed}
                        </span>
                        <span
                          className='h-[0.9em] w-px self-center justify-self-center bg-slate-700/60'
                          aria-hidden='true'
                        />
                        <span className='relative top-[0.07em] text-left text-[0.85em] font-medium text-slate-500'>
                          {displayText}
                          {suffix}
                        </span>
                      </>
                    )}
                  </>
                )

                if (onLevelChange) {
                  return (
                    <button
                      className={`${rowClassName} w-full border-none bg-transparent p-0 text-left align-middle font-normal`}
                      key={`level-${String(globalIdx + 1)}`}
                      onClick={handleRowClick}
                      style={{fontSize: 'inherit'}}
                      type='button'
                    >
                      {rowContent}
                    </button>
                  )
                }

                return (
                  <div
                    className={rowClassName}
                    key={`level-${String(globalIdx + 1)}`}
                    style={{fontSize: 'inherit'}}
                  >
                    {rowContent}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>

      {activeFormula && (
        <div className='mt-[0.6em] flex flex-col gap-y-[0.4em] border-t border-slate-700/40 pt-[0.6em] leading-snug tabular-nums'>
          {activeFormula.includes('\n') ? (
            <div className='flex flex-col gap-y-[0.3em] pr-[0.3em] pl-[0.2em] text-[0.8em] leading-relaxed text-slate-400'>
              <div className='font-semibold text-slate-500'>
                {levelLabelPrefix}
                {currentLevel}
              </div>
              <div className='font-medium whitespace-pre-wrap'>{activeFormula}</div>
            </div>
          ) : parsedFormula ? (
            <>
              <span className='text-[0.78em] font-semibold text-slate-400 not-italic'>
                {levelLabelPrefix}
                {currentLevel}
              </span>
              <span className='pl-[0.6em] text-[0.92em] leading-normal'>
                <span className='text-slate-400'>{parsedFormula.calculation}</span>
                <span className='text-slate-500'>{' = '}</span>
                {computedFinal !== null ? (
                  <>
                    <span className='text-[1.05em] font-bold text-amber-100'>{computedFinal}</span>
                    {showVisibleScaling && (
                      <span className='ml-[0.35em] text-[0.9em] font-medium text-slate-500'>
                        ({fmtNum(displayPct)}
                        {suffix})
                      </span>
                    )}
                  </>
                ) : (
                  <span className='text-[1.05em] font-bold text-amber-100'>
                    {fmtNum(displayPct)}
                    {suffix}
                  </span>
                )}
              </span>
              <span className='mt-[0.1em] flex items-center gap-x-[0.4em] pr-[0.3em] pl-[0.7em] text-[0.78em] text-slate-400/90'>
                <span>
                  {scalingAbstractFormula ??
                    (parsedFormula.source
                      ? `base ${parsedFormula.operator} bonus from ${parsedFormula.source}`
                      : `base`)}
                </span>
                <button
                  type='button'
                  onClick={handleCopyFormula}
                  className='flex shrink-0 items-center justify-center rounded p-[0.2em] text-slate-500 transition-colors duration-150 hover:bg-white/10 hover:text-slate-300'
                  style={{fontSize: 'inherit'}}
                  title='Copy formula'
                  aria-label='Copy formula'
                >
                  <FaClipboard className='h-[1.1em] w-[1.1em]' />
                </button>
              </span>
              {scalingAbstractFormulaExplanations &&
                scalingAbstractFormulaExplanations.length > 0 && (
                  <div className='flex flex-wrap items-center gap-x-[0.5em] gap-y-[0.1em] pr-[0.3em] pl-[0.7em] text-[0.75em] leading-normal text-slate-500/80'>
                    {scalingAbstractFormulaExplanations.map((item, idx) => (
                      <div
                        key={`${item.label}-${idx.toString()}`}
                        className='flex items-center gap-x-[0.5em]'
                      >
                        {idx > 0 && <span className='text-slate-500/40'>;</span>}
                        {item.sourceName ? (
                          <button
                            type='button'
                            onClick={(e) => {
                              const name = item.sourceName
                              if (name) {
                                onOpenReferenceName?.(name, e)
                              }
                            }}
                            className='cursor-pointer text-left text-slate-500 underline decoration-slate-600/65 transition-colors duration-150 hover:text-amber-200 hover:decoration-amber-300/40'
                            style={{fontSize: 'inherit'}}
                          >
                            {item.label} - {item.value}
                          </button>
                        ) : (
                          <span>
                            {item.label} - {item.value}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
            </>
          ) : null}
        </div>
      )}
    </div>
  )
})
