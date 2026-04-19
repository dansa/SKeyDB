import type {
  DatabaseBrowseState,
  RarityFilterId,
  RealmFilterId,
  TypeFilterId,
} from '@/domain/database-browse-state'
import {getRealmLabel} from '@/domain/realms'
import {wheelMainstatFilterOptions} from '@/domain/wheel-mainstat-filters'
import type {
  WheelsDatabaseBrowseState,
  WheelsDatabaseRarityFilterId,
  WheelsDatabaseRealmFilterId,
} from '@/domain/wheels-database-browse-state'

import type {ActiveFilterChip} from './ActiveFilterChips'
import {getTypeFilterLabel} from './database-browse-state'

interface AwakenerActiveFilterActions {
  clearQuery: () => void
  setRealmFilter: (next: RealmFilterId) => void
  setRarityFilter: (next: RarityFilterId) => void
  setTypeFilter: (next: TypeFilterId) => void
}

interface WheelActiveFilterActions {
  clearQuery: () => void
  setRealmFilter: (next: WheelsDatabaseRealmFilterId) => void
  setRarityFilter: (next: WheelsDatabaseRarityFilterId) => void
  setMainstatFilter: (next: WheelsDatabaseBrowseState['mainstatFilter']) => void
}

export function buildAwakenerActiveFilterChips(
  state: Pick<DatabaseBrowseState, 'query' | 'realmFilter' | 'rarityFilter' | 'typeFilter'>,
  actions: AwakenerActiveFilterActions,
): ActiveFilterChip[] {
  const chips: ActiveFilterChip[] = []

  const trimmedQuery = state.query.trim()
  if (trimmedQuery.length > 0) {
    chips.push({
      key: 'query',
      label: `Search: "${trimmedQuery}"`,
      onClear: actions.clearQuery,
    })
  }

  if (state.realmFilter !== 'ALL') {
    chips.push({
      key: 'realm',
      label: getRealmLabel(state.realmFilter),
      onClear: () => {
        actions.setRealmFilter('ALL')
      },
    })
  }

  if (state.rarityFilter !== 'ALL') {
    chips.push({
      key: 'rarity',
      label: state.rarityFilter,
      onClear: () => {
        actions.setRarityFilter('ALL')
      },
    })
  }

  if (state.typeFilter !== 'ALL') {
    chips.push({
      key: 'type',
      label: getTypeFilterLabel(state.typeFilter),
      onClear: () => {
        actions.setTypeFilter('ALL')
      },
    })
  }

  return chips
}

export function buildWheelActiveFilterChips(
  state: Pick<
    WheelsDatabaseBrowseState,
    'query' | 'realmFilter' | 'rarityFilter' | 'mainstatFilter'
  >,
  actions: WheelActiveFilterActions,
): ActiveFilterChip[] {
  const chips: ActiveFilterChip[] = []

  const trimmedQuery = state.query.trim()
  if (trimmedQuery.length > 0) {
    chips.push({
      key: 'query',
      label: `Search: "${trimmedQuery}"`,
      onClear: actions.clearQuery,
    })
  }

  if (state.realmFilter !== 'ALL') {
    chips.push({
      key: 'realm',
      label: getRealmLabel(state.realmFilter),
      onClear: () => {
        actions.setRealmFilter('ALL')
      },
    })
  }

  if (state.rarityFilter !== 'ALL') {
    chips.push({
      key: 'rarity',
      label: state.rarityFilter,
      onClear: () => {
        actions.setRarityFilter('ALL')
      },
    })
  }

  if (state.mainstatFilter !== 'ALL') {
    const mainstatLabel =
      wheelMainstatFilterOptions.find((entry) => entry.id === state.mainstatFilter)?.label ??
      state.mainstatFilter
    chips.push({
      key: 'mainstat',
      label: mainstatLabel,
      onClear: () => {
        actions.setMainstatFilter('ALL')
      },
    })
  }

  return chips
}
