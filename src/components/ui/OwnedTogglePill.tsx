type OwnedTogglePillProps = {
  owned: boolean
  onToggle: () => void
  className?: string
  variant?: 'default' | 'flat'
  onLabel?: string
  offLabel?: string
}

export function OwnedTogglePill({
  owned,
  onToggle,
  className = '',
  variant = 'default',
  onLabel = 'Owned',
  offLabel = 'Unowned',
}: OwnedTogglePillProps) {
  return (
    <button
      aria-label={owned ? 'Set unowned' : 'Set owned'}
      className={`ownership-pill ${variant === 'flat' ? 'ownership-pill-flat' : ''} ${className}`.trim()}
      data-owned={owned ? 'true' : 'false'}
      onClick={onToggle}
      type="button"
    >
      <span className="ownership-pill__track" />
      <span className="ownership-pill__thumb">
        <span className="ownership-pill__label ownership-pill__label-unowned">{offLabel}</span>
        <span className="ownership-pill__label ownership-pill__label-owned">{onLabel}</span>
      </span>
    </button>
  )
}
