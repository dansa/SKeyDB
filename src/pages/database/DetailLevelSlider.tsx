interface DetailLevelSliderProps {
  compact?: boolean
  label: string
  level: number
  min: number
  max: number
  onChange: (level: number) => void
}

export function DetailLevelSlider({
  compact = false,
  label,
  level,
  min,
  max,
  onChange,
}: DetailLevelSliderProps) {
  return (
    <label className='grid gap-1'>
      <span className='flex items-center justify-between text-[10px] tracking-wide text-slate-400 uppercase'>
        <span>{label}</span>
        <span className='rounded border border-slate-500/55 bg-slate-950/80 px-1.5 py-0.5 font-mono text-[11px] tracking-normal text-slate-200 normal-case'>
          Lv. {level}
        </span>
      </span>
      <input
        className={compact ? 'export-box-slider export-box-slider--compact' : 'export-box-slider'}
        max={max}
        min={min}
        onChange={(event) => {
          onChange(Number(event.target.value))
        }}
        step={1}
        type='range'
        value={level}
      />
    </label>
  )
}
