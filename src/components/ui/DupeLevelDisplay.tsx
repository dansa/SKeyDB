interface DupeLevelDisplayProps {
  level: number | null
  className?: string
  filledSlotCount?: number
  levelSelection?: {
    getAriaLabel: (level: number) => string
    onSelect: (level: number) => void
  }
  showOverflowSlot?: boolean
}

function DupeDiamondArtwork({filled}: {filled: boolean}) {
  return (
    <svg aria-hidden className='collection-dupe-slot-svg-art' viewBox='0 0 24 24'>
      <rect
        fill='none'
        height='18'
        stroke='rgba(244, 234, 196, 0.42)'
        strokeWidth='1.1'
        width='18'
        x='3'
        y='3'
      />
      <polygon
        fill='rgba(4, 10, 20, 0.88)'
        points='12,1.75 22.25,12 12,22.25 1.75,12'
        stroke='rgba(244, 234, 196, 0.68)'
        strokeWidth='1.1'
      />
      {filled ? (
        <polygon
          fill='rgba(248, 243, 214, 0.72)'
          points='12,6.6 17.4,12 12,17.4 6.6,12'
          stroke='rgba(248, 243, 214, 0.95)'
          strokeWidth='0.9'
        />
      ) : null}
    </svg>
  )
}

export function DupeLevelDisplay({
  level,
  className = 'collection-enlighten-text collection-enlighten-text-owned',
  filledSlotCount = 3,
  levelSelection,
  showOverflowSlot = true,
}: DupeLevelDisplayProps) {
  if (level === null) {
    return null
  }

  const filledDiamondCount = Math.min(level, filledSlotCount)
  const overflowLevel = level > filledSlotCount ? level - filledSlotCount : 0

  return (
    <span className={className}>
      <span
        aria-hidden={levelSelection ? undefined : true}
        className='collection-dupe-svg collection-dupe-svg-overflow'
      >
        {Array.from({length: filledSlotCount}, (_, index) => {
          const slotLevel = index + 1
          const artwork = <DupeDiamondArtwork filled={index < filledDiamondCount} />

          return levelSelection ? (
            <button
              aria-label={levelSelection.getAriaLabel(slotLevel)}
              aria-pressed={level === slotLevel}
              className='collection-dupe-svg-slot cursor-pointer border-0 bg-transparent p-0 focus-visible:ring-2 focus-visible:ring-amber-200/70 focus-visible:outline-none'
              key={slotLevel}
              onClick={() => {
                if (level !== slotLevel) {
                  levelSelection.onSelect(slotLevel)
                }
              }}
              type='button'
            >
              {artwork}
            </button>
          ) : (
            <span className='collection-dupe-svg-slot' key={slotLevel}>
              {artwork}
            </span>
          )
        })}
        {showOverflowSlot ? (
          <span
            className={`collection-dupe-svg-slot collection-dupe-svg-slot-overflow ${overflowLevel > 0 ? '' : 'collection-dupe-svg-slot-overflow-hidden'}`}
          >
            <svg className='collection-dupe-slot-svg-art' viewBox='0 0 24 24'>
              <rect
                fill='none'
                height='18'
                stroke='rgba(244, 234, 196, 0.42)'
                strokeWidth='1.1'
                width='18'
                x='3'
                y='3'
              />
              <polygon
                fill='rgba(4, 10, 20, 0.88)'
                points='12,1.75 22.25,12 12,22.25 1.75,12'
                stroke='rgba(244, 234, 196, 0.68)'
                strokeWidth='1.1'
              />
              <text
                dominantBaseline='central'
                fill='rgba(244,234,196,0.96)'
                fontFamily='Droid Serif, Georgia, serif'
                fontSize='14'
                fontWeight='700'
                paintOrder='stroke'
                stroke='rgba(8,14,24,0.9)'
                strokeWidth='2'
                textAnchor='middle'
                x='12'
                y='12'
              >
                {overflowLevel > 0 ? overflowLevel : 0}
              </text>
            </svg>
          </span>
        ) : null}
      </span>
    </span>
  )
}
