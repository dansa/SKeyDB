import {getRealmBadge, getRealmLabel} from '@/domain/realms'

interface BuilderV2RealmBadgeProps {
  badgeClassName: string
  fallbackClassName: string
  fallbackLabel?: (realmLabel: string) => string
  realm: string
}

export function BuilderV2RealmBadge({
  badgeClassName,
  fallbackClassName,
  fallbackLabel = (realmLabel) => realmLabel,
  realm,
}: BuilderV2RealmBadgeProps) {
  const realmBadge = getRealmBadge(realm)
  const realmLabel = getRealmLabel(realm)

  if (!realmBadge) {
    return <span className={fallbackClassName}>{fallbackLabel(realmLabel)}</span>
  }

  return (
    <span className={badgeClassName}>
      <img alt='' draggable={false} src={realmBadge} />
      <span className='sr-only'>{realmLabel}</span>
    </span>
  )
}
