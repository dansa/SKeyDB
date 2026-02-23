type TogglePillProps = {
  checked: boolean
  onChange: (nextChecked: boolean) => void
  className?: string
  variant?: 'default' | 'flat'
  onLabel?: string
  offLabel?: string
  ariaLabel?: string
  disabled?: boolean
}

export function TogglePill({
  checked,
  onChange,
  className = '',
  variant = 'default',
  onLabel = 'On',
  offLabel = 'Off',
  ariaLabel,
  disabled = false,
}: TogglePillProps) {
  return (
    <button
      aria-label={ariaLabel}
      className={`ownership-pill ${variant === 'flat' ? 'ownership-pill-flat' : ''} ${className}`.trim()}
      data-checked={checked ? 'true' : 'false'}
      data-owned={checked ? 'true' : 'false'}
      disabled={disabled}
      onClick={() => onChange(!checked)}
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
