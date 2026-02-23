import { TogglePill } from './TogglePill'

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
    <TogglePill
      aria-label={owned ? 'Set unowned' : 'Set owned'}
      checked={owned}
      className={className}
      offLabel={offLabel}
      onChange={() => onToggle()}
      onLabel={onLabel}
      variant={variant}
    />
  )
}
