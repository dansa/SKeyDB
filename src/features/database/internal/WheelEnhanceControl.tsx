import {DupeLevelDisplay} from '@/components/ui/DupeLevelDisplay'
import {
  clampWheelEnhanceLevel,
  formatWheelEnhanceLevelLabel,
  getWheelEnhancePlusLevel,
} from '@/domain/wheel-enhance'

interface WheelEnhanceControlProps {
  enhanceLevel: number
  onChange: (level: number) => void
}

export function WheelEnhanceControl({enhanceLevel, onChange}: WheelEnhanceControlProps) {
  const normalizedLevel = clampWheelEnhanceLevel(enhanceLevel)
  const plusLevel = getWheelEnhancePlusLevel(normalizedLevel)
  const enhanceValueLabel = formatWheelEnhanceLevelLabel(normalizedLevel)

  return (
    <div className='flex flex-col gap-2.5'>
      <div className='flex flex-wrap items-center gap-x-4 gap-y-2'>
        <span className='ui-title text-[11px] tracking-[0.22em] text-amber-100/80 uppercase'>
          Enlighten
        </span>
        <div className='flex min-h-6 items-center gap-2.5'>
          <DupeLevelDisplay
            className='wheel-enlighten-display collection-enlighten-text collection-enlighten-text-owned'
            level={normalizedLevel}
            showOverflowSlot={false}
          />
          <span
            aria-hidden={plusLevel === 0}
            className={`inline-flex min-w-[2.5rem] items-center justify-start text-[10px] leading-none tracking-[0.14em] tabular-nums transition-opacity ${
              plusLevel > 0 ? 'text-amber-100/72' : 'text-transparent opacity-0'
            }`}
          >
            {plusLevel > 0 ? `+${String(plusLevel)}` : '+0'}
          </span>
        </div>
      </div>

      <input
        aria-label='Enhance'
        aria-valuetext={enhanceValueLabel}
        className='wheel-enhance-slider export-box-slider block w-full md:max-w-[16rem]'
        max={15}
        min={0}
        onChange={(event) => {
          onChange(clampWheelEnhanceLevel(Number(event.target.value)))
        }}
        step={1}
        type='range'
        value={normalizedLevel}
      />
    </div>
  )
}
