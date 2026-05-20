import {
  getAwakenerScalingSubstatLabel,
  type SubstatScalingKey,
} from '@/domain/awakener-scaling-substats'
import {
  getAvailabilityFilterLabel,
  getTypeFilterLabel,
  type AvailabilityFilterId,
  type DatabaseBrowseState,
  type GameplayFactionFilterId,
  type RarityFilterId,
  type RealmFilterId,
  type TypeFilterId,
} from '@/domain/database-browse-state'
import {getRealmLabel} from '@/domain/realms'
import {
  getPosseDatabaseRealmFilterLabel,
  type CovenantDatabaseBrowseState,
  type PosseDatabaseBrowseState,
  type PosseDatabaseRealmFilterId,
} from '@/domain/simple-artifact-database-browse-state'
import {wheelMainstatFilterOptions} from '@/domain/wheel-mainstat-filters'
import type {
  WheelsDatabaseBrowseState,
  WheelsDatabaseRarityFilterId,
  WheelsDatabaseRealmFilterId,
} from '@/domain/wheels-database-browse-state'
import type {ActiveFilterChip} from '@/ui/filters/ActiveFilterChips'

interface AwakenerActiveFilterActions {
  clearQuery: () => void
  setRealmFilter: (next: RealmFilterId) => void
  setRarityFilter: (next: RarityFilterId) => void
  setTypeFilter: (next: TypeFilterId) => void
  setAvailabilityFilter: (next: AvailabilityFilterId) => void
  setGameplayFactionFilters: (next: GameplayFactionFilterId[]) => void
  setScalingSubstatFilters: (next: SubstatScalingKey[]) => void
}

interface PosseActiveFilterActions {
  clearQuery: () => void
  setRealmFilter: (next: PosseDatabaseRealmFilterId) => void
}

interface CovenantActiveFilterActions {
  clearQuery: () => void
}

interface WheelActiveFilterActions {
  clearQuery: () => void
  setRealmFilter: (next: WheelsDatabaseRealmFilterId) => void
  setRarityFilter: (next: WheelsDatabaseRarityFilterId) => void
  setMainstatFilter: (next: WheelsDatabaseBrowseState['mainstatFilter']) => void
}

export function buildAwakenerActiveFilterChips(
  state: Pick<
    DatabaseBrowseState,
    | 'query'
    | 'realmFilter'
    | 'rarityFilter'
    | 'typeFilter'
    | 'availabilityFilter'
    | 'gameplayFactionFilters'
    | 'scalingSubstatFilters'
  >,
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

  if (state.availabilityFilter !== 'ALL') {
    chips.push({
      key: 'availability',
      label: getAvailabilityFilterLabel(state.availabilityFilter),
      onClear: () => {
        actions.setAvailabilityFilter('ALL')
      },
    })
  }

  for (const faction of state.gameplayFactionFilters) {
    chips.push({
      key: `faction-${faction}`,
      label: faction,
      onClear: () => {
        actions.setGameplayFactionFilters([])
      },
    })
  }

  for (const substat of state.scalingSubstatFilters) {
    chips.push({
      key: `scaling-${substat}`,
      label: getAwakenerScalingSubstatLabel(substat),
      onClear: () => {
        actions.setScalingSubstatFilters(
          state.scalingSubstatFilters.filter((value) => value !== substat),
        )
      },
    })
  }

  return chips
}

export function buildPosseActiveFilterChips(
  state: PosseDatabaseBrowseState,
  actions: PosseActiveFilterActions,
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
      label: getPosseDatabaseRealmFilterLabel(state.realmFilter),
      onClear: () => {
        actions.setRealmFilter('ALL')
      },
    })
  }

  return chips
}

export function buildCovenantActiveFilterChips(
  state: CovenantDatabaseBrowseState,
  actions: CovenantActiveFilterActions,
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
