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
    <label className='grid gap-0.5'>
      <span className='flex items-center justify-between text-[9px] tracking-wide text-slate-400 uppercase'>
        <span>{label}</span>
        <span className='rounded-sm border border-white/10 bg-slate-950/60 px-1.5 py-0.5 font-mono text-[9px] tracking-normal text-slate-300 normal-case'>
          {valueLabel}
        </span>
      </span>
      <input
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
    </label>
  )
}
