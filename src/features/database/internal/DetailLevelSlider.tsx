import {BufferedLevelInput} from '@/ui/modal/BufferedLevelInput'
import {CALCULATION_CONTEXT_CONTROL_PROPS} from '@/ui/modal/calculationContextControl'

interface DetailLevelSliderProps {
  compact?: boolean
  label: string
  level: number
  min: number
  max: number
  formatValueLabel?: (level: number) => string
  onChange: (level: number) => void
}

export function DetailLevelSlider({
  compact = false,
  label,
  level,
  min,
  max,
  formatValueLabel,
  onChange,
}: DetailLevelSliderProps) {
  function clampLevel(nextLevel: number): number {
    if (!Number.isFinite(nextLevel)) {
      return min
    }

    return Math.min(max, Math.max(min, nextLevel))
  }

  const valueLabel = formatValueLabel ? formatValueLabel(level) : `Lv. ${String(level)}`

  return (
    <div className='grid gap-0.5' {...CALCULATION_CONTEXT_CONTROL_PROPS}>
      <span className='flex items-center justify-between text-[9px] tracking-wide text-slate-400 uppercase'>
        <span>{label}</span>
        <BufferedLevelInput
          ariaLabel={label}
          className={`rounded border border-slate-500/55 bg-slate-950/80 py-0.5 text-right font-mono text-[10px] tracking-normal text-slate-200 normal-case outline-none focus:border-amber-200/60 ${compact ? 'w-9 px-1' : 'w-11 px-1.5'}`}
          max={max}
          min={min}
          onCommit={onChange}
          title={valueLabel}
          value={level}
        />
      </span>
      <input
        aria-label={label}
        aria-valuetext={valueLabel}
        className={compact ? 'export-box-slider export-box-slider--compact' : 'export-box-slider'}
        max={max}
        min={min}
        onChange={(event) => {
          onChange(clampLevel(Number(event.target.value)))
        }}
        step={1}
        type='range'
        value={level}
      />
    </div>
  )
}
