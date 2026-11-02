import {useState, type RefObject} from 'react'

import {wheelMainstatFilterOptions, type WheelMainstatFilter} from '@/domain/wheel-mainstat-filters'
import {
  WHEELS_DATABASE_RARITY_FILTER_IDS,
  WHEELS_DATABASE_REALM_FILTER_IDS,
  WHEELS_DATABASE_AVAILABILITY_FILTER_IDS,
  getWheelAvailabilityFilterLabel,
  type WheelsDatabaseAvailabilityFilterId,
  type WheelsDatabaseRarityFilterId,
  type WheelsDatabaseRealmFilterId,
} from '@/domain/wheels-database-browse-state'
import {ChipFilterRow} from '@/ui/filters/ChipFilterRow'
import {SearchInput} from '@/ui/search/SearchInput'

import {CatalogMobileFilterGroup, CatalogRealmFilterRow} from './DatabaseChipPrimitives'
import {useMobileDatabaseFilters} from './useMobileDatabaseFilters'

interface WheelDatabaseFiltersProps {
  availabilityFilter: WheelsDatabaseAvailabilityFilterId
  onAvailabilityFilterChange: (filter: WheelsDatabaseAvailabilityFilterId) => void
  query: string
  realmFilter: WheelsDatabaseRealmFilterId
  rarityFilter: WheelsDatabaseRarityFilterId
  mainstatFilter: WheelMainstatFilter
  searchInputRef: RefObject<HTMLInputElement | null>
  onQueryChange: (query: string) => void
  onRealmFilterChange: (filter: WheelsDatabaseRealmFilterId) => void
  onRarityFilterChange: (filter: WheelsDatabaseRarityFilterId) => void
  onMainstatFilterChange: (filter: WheelMainstatFilter) => void
}

const REALM_FILTERS = WHEELS_DATABASE_REALM_FILTER_IDS.slice(1)
const availabilityFilterTabs = WHEELS_DATABASE_AVAILABILITY_FILTER_IDS.map((id) => ({
  id,
  label: getWheelAvailabilityFilterLabel(id),
  summaryLabel: getWheelAvailabilityFilterLabel(id),
}))

const rarityFilterTabs = WHEELS_DATABASE_RARITY_FILTER_IDS.map((id) => ({
  id,
  label: id === 'ALL' ? 'All' : id,
  summaryLabel: id === 'ALL' ? 'All' : id,
}))

export function WheelDatabaseFilters({
  availabilityFilter,
  onAvailabilityFilterChange,
  mainstatFilter,
  onMainstatFilterChange,
  onQueryChange,
  onRarityFilterChange,
  onRealmFilterChange,
  query,
  rarityFilter,
  realmFilter,
  searchInputRef,
}: WheelDatabaseFiltersProps) {
  const [openMobileFilter, setOpenMobileFilter] = useState<
    'rarity' | 'mainstat' | 'availability' | null
  >(null)
  const isMobileFilters = useMobileDatabaseFilters()
  const mainstatFilterTabs = wheelMainstatFilterOptions.map((entry) => ({
    id: entry.id,
    iconSrc: entry.iconAsset,
    label: entry.label,
    summaryLabel: entry.label,
  }))

  return (
    <div className='space-y-3 sm:space-y-3.5'>
      <SearchInput
        label='Search wheels'
        onQueryChange={onQueryChange}
        placeholder='Name, owner, realm, rarity, or effect'
        query={query}
        searchInputRef={searchInputRef}
      />
      {isMobileFilters ? (
        <div className='space-y-2.5'>
          <CatalogRealmFilterRow
            activeRealm={realmFilter}
            onChange={onRealmFilterChange}
            realms={REALM_FILTERS}
          />

          <CatalogMobileFilterGroup
            groups={[
              {
                activeId: availabilityFilter,
                defaultId: 'ALL',
                key: 'availability',
                label: 'Source',
                toggleClassName: 'col-span-2',
                onChange: (next) => {
                  onAvailabilityFilterChange(next as WheelsDatabaseAvailabilityFilterId)
                },
                options: availabilityFilterTabs,
              },
              {
                activeId: rarityFilter,
                defaultId: 'ALL',
                key: 'rarity',
                label: 'Rarity',
                onChange: (next) => {
                  onRarityFilterChange(next as WheelsDatabaseRarityFilterId)
                },
                options: rarityFilterTabs,
              },
              {
                activeId: mainstatFilter,
                defaultId: 'ALL',
                key: 'mainstat',
                label: 'Main stat',
                onChange: (next) => {
                  onMainstatFilterChange(next as WheelMainstatFilter)
                },
                options: mainstatFilterTabs,
              },
            ]}
            onOpenKeyChange={setOpenMobileFilter}
            openKey={openMobileFilter}
          />
        </div>
      ) : (
        <div className='space-y-2.5 sm:space-y-3'>
          <div className='grid gap-2 lg:grid-cols-2'>
            <CatalogRealmFilterRow
              activeRealm={realmFilter}
              onChange={onRealmFilterChange}
              realms={REALM_FILTERS}
            />

            <ChipFilterRow
              activeId={rarityFilter}
              defaultId='ALL'
              label='Rarity'
              onChange={onRarityFilterChange}
              options={rarityFilterTabs}
            />
          </div>

          <ChipFilterRow
            activeId={mainstatFilter}
            controlsClassName='flex min-w-0 flex-1 flex-wrap items-center gap-1.5 sm:grid sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
            defaultId='ALL'
            label='Main stat'
            onChange={onMainstatFilterChange}
            options={mainstatFilterTabs}
          />
          <ChipFilterRow
            activeId={availabilityFilter}
            defaultId='ALL'
            label='Source'
            onChange={onAvailabilityFilterChange}
            options={availabilityFilterTabs}
          />
        </div>
      )}
    </div>
  )
}
