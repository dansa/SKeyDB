import { useHoldRepeatAction } from './useHoldRepeatAction'

type CollectionLevelStepButtonProps = {
  ariaLabel: string
  disabled: boolean
  direction: 'up' | 'down'
  onStep: () => void
}

export function CollectionLevelStepButton({
  ariaLabel,
  disabled,
  direction,
  onStep,
}: CollectionLevelStepButtonProps) {
  const hold = useHoldRepeatAction({ onStep, disabled })
  const glyphPath = direction === 'up' ? 'M3.2 10.2 8 5.5l4.8 4.7' : 'M3.2 5.8 8 10.5l4.8-4.7'

  return (
    <button
      aria-label={ariaLabel}
      className="collection-step-btn"
      disabled={disabled}
      onBlur={hold.onBlur}
      onClick={hold.onClick}
      onPointerCancel={hold.onPointerCancel}
      onPointerDown={hold.onPointerDown}
      onPointerLeave={hold.onPointerLeave}
      onPointerUp={hold.onPointerUp}
      type="button"
    >
      <svg aria-hidden="true" className="collection-step-glyph" viewBox="0 0 16 16">
        <path
          d={glyphPath}
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
      </svg>
    </button>
  )
}
