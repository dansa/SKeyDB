import {formatBuilderV2EnlightenLabel} from './BuilderV2EnlightenLabel'

export type BuilderV2EnlightenMeterVariant = 'default' | 'compact'

export function BuilderV2EnlightenMeter({
  level,
  variant = 'default',
}: {
  level: number | null
  variant?: BuilderV2EnlightenMeterVariant
}) {
  const visibleLevel = Math.max(0, Math.min(level ?? 0, 3))
  const overflowLevel = level !== null ? Math.max(0, level - visibleLevel) : 0
  const label = formatBuilderV2EnlightenLabel(level)
  const diamonds = Array.from({length: 3}, (_, index) => index < visibleLevel)

  return (
    <span
      className={`builder-v2-enlighten-meter builder-v2-enlighten-meter--${variant}`}
      aria-label={label ? `Enlighten ${label}` : 'Enlighten 0'}
    >
      <span aria-hidden className='builder-v2-enlighten-diamonds'>
        {diamonds.map((isFilled, index) => (
          <span
            className={`builder-v2-enlighten-diamond ${
              isFilled ? 'builder-v2-enlighten-diamond--filled' : ''
            }`}
            key={index}
          />
        ))}
      </span>
      {overflowLevel > 0 ? (
        <span className='builder-v2-enlighten-overflow'>+{String(overflowLevel)}</span>
      ) : null}
    </span>
  )
}
