import {memo, useEffect, useState} from 'react'

interface DetailLevelSliderProps {
  compact?: boolean
  label: string
  level: number
  min: number
  max: number
  onChange: (level: number) => void
  valuePrefix?: string
}

export const DetailLevelSlider = memo(function DetailLevelSlider({
  compact = false,
  label,
  level,
  min,
  max,
  onChange,
  valuePrefix,
}: DetailLevelSliderProps) {
  const [inputValue, setInputValue] = useState(String(level))

  useEffect(() => {
    setInputValue(String(level))
  }, [level])

  function commitInput(rawValue: string) {
    const nextLevel = Number.parseInt(rawValue, 10)
    if (Number.isNaN(nextLevel)) {
      setInputValue(String(level))
      return
    }

    const clampedLevel = Math.min(max, Math.max(min, nextLevel))
    setInputValue(String(clampedLevel))
    if (clampedLevel !== level) {
      onChange(clampedLevel)
    }
  }

  return (
    <label className='grid gap-1'>
      <span className='flex items-center justify-between pt-1 text-[12px] font-bold tracking-wide text-slate-400'>
        <span>{label}</span>
        <span className='flex h-6 w-15 shrink-0 items-center rounded border border-slate-500/55 bg-slate-950/80 px-1 py-0.5 font-mono text-[12px] tracking-normal text-slate-200 normal-case'>
          <span className='pl-1 text-[12px] leading-none text-slate-400'>{valuePrefix ?? ''}</span>
          <input
            aria-label={`${label} value`}
            className='h-full min-w-0 flex-1 border-0 bg-transparent p-0 text-center text-slate-200 tabular-nums outline-none'
            inputMode='numeric'
            onBlur={(event) => {
              commitInput(event.target.value)
            }}
            onChange={(event) => {
              const raw = event.target.value.replace(/[^\d-]/g, '')
              setInputValue(raw)
              const nextVal = Number.parseInt(raw, 10)
              if (!Number.isNaN(nextVal) && nextVal >= min && nextVal <= max && nextVal !== level) {
                onChange(nextVal)
              }
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                commitInput(event.currentTarget.value)
                event.currentTarget.blur()
              }
            }}
            type='text'
            value={inputValue}
          />
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
})
