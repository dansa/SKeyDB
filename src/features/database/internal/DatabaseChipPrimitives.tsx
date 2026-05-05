import type {ReactNode} from 'react'

import {getRealmAccent, getRealmIcon, getRealmLabel} from '@/domain/realms'
import {ChipFilterRow} from '@/ui/filters/ChipFilterRow'

interface CatalogRealmFilterRowProps<TValue extends string> {
  activeRealm: TValue
  allLabel?: ReactNode
  label?: string
  onChange: (next: TValue) => void
  realms: readonly TValue[]
}

export function CatalogRealmFilterRow<TValue extends string>({
  activeRealm,
  allLabel = 'All',
  label = 'Realm',
  onChange,
  realms,
}: CatalogRealmFilterRowProps<TValue>) {
  const options = [
    {
      id: 'ALL' as TValue,
      label: allLabel,
    },
    ...realms.map((realm) => ({
      id: realm,
      label: getRealmLabel(realm),
      iconSrc: getRealmIcon(realm),
      activeStyle: (() => {
        const accent = getRealmAccent(realm)
        return {borderColor: `${accent}88`, color: accent}
      })(),
    })),
  ]

  return (
    <ChipFilterRow activeId={activeRealm} label={label} onChange={onChange} options={options} />
  )
}
