import type {RarityFilterId, RealmFilterId, TypeFilterId} from '../../hooks/useDatabaseStore'

export const REALM_FILTERS: readonly RealmFilterId[] = ['AEQUOR', 'CARO', 'CHAOS', 'ULTRA']

export const RARITY_FILTER_TABS: readonly Readonly<{id: RarityFilterId; label: string}>[] = [
  {id: 'ALL', label: 'All'},
  {id: 'Genesis', label: 'Genesis'},
  {id: 'SSR', label: 'SSR'},
  {id: 'SR', label: 'SR'},
]

export const TYPE_FILTER_TABS: readonly Readonly<{id: TypeFilterId; label: string}>[] = [
  {id: 'ALL', label: 'All'},
  {id: 'ASSAULT', label: 'Assault'},
  {id: 'WARDEN', label: 'Warden'},
  {id: 'CHORUS', label: 'Chorus'},
]
