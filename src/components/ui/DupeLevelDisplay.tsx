type DupeLevelDisplayProps = {
  level: number | null
  className?: string
  filledSlotCount?: number
}

export function DupeLevelDisplay({
  level,
  className = 'collection-enlighten-text collection-enlighten-text-owned',
  filledSlotCount = 3,
}: DupeLevelDisplayProps) {
  if (level === null) {
    return null
  }

  const filledDiamondCount = Math.min(level, filledSlotCount)
  const overflowLevel = level > filledSlotCount ? level - filledSlotCount : 0

  return (
    <span className={className}>
      <span
        aria-hidden
        className={`collection-dupe-diamonds ${overflowLevel > 0 ? 'collection-dupe-diamonds-overflow' : ''}`}
      >
        {Array.from({ length: filledSlotCount }, (_, index) => (
          <span className={`collection-dupe-slot ${index < filledDiamondCount ? 'collection-dupe-slot-filled' : ''}`} key={index}>
            <span className="collection-dupe-slot-core" />
          </span>
        ))}
        {overflowLevel > 0 ? (
          <span className="collection-dupe-slot collection-dupe-slot-overflow">
            <span className="collection-dupe-slot-overflow-text">{overflowLevel}</span>
          </span>
        ) : null}
      </span>
    </span>
  )
}

