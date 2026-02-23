import { OwnershipLevelDisplay } from './OwnershipLevelDisplay'
import { CollectionLevelStepButton } from './CollectionLevelStepButton'

type CollectionLevelControlsProps = {
  ownedLevel: number | null
  onIncrease: () => void
  onDecrease: () => void
}

export function CollectionLevelControls({ ownedLevel, onIncrease, onDecrease }: CollectionLevelControlsProps) {
  return (
    <div
      className={`collection-card-level-controls ${
        ownedLevel === null ? 'collection-card-level-controls-disabled' : ''
      }`}
    >
      <OwnershipLevelDisplay ownedLevel={ownedLevel} />
      <div className="collection-step-group">
        <CollectionLevelStepButton
          ariaLabel="Increase enlighten level"
          direction="up"
          disabled={ownedLevel === null || ownedLevel >= 15}
          onStep={onIncrease}
        />
        <CollectionLevelStepButton
          ariaLabel="Decrease enlighten level"
          direction="down"
          disabled={ownedLevel === null || ownedLevel <= 0}
          onStep={onDecrease}
        />
      </div>
    </div>
  )
}
