import {useId, useState, type KeyboardEvent, type RefObject} from 'react'

import {
  getAwakenerScalingSubstatFilterOptions,
  getAwakenerScalingSubstatFilterRoleLabel,
  type AwakenerScalingSubstatFilter,
  type AwakenerScalingSubstatFilterRole,
  type SubstatScalingKey,
} from '@/domain/awakener-scaling-substats'
import {
  DATABASE_AVAILABILITY_FILTER_IDS,
  DATABASE_GAMEPLAY_FACTION_FILTER_IDS,
  DATABASE_RARITY_FILTER_IDS,
  DATABASE_REALM_FILTER_IDS,
  DATABASE_TYPE_FILTER_IDS,
  getAvailabilityFilterLabel,
  getTypeFilterLabel,
  type AvailabilityFilterId,
  type GameplayFactionFilterId,
  type RarityFilterId,
  type RealmFilterId,
  type TypeFilterId,
} from '@/domain/database-browse-state'
import {ChipFilterRow} from '@/ui/filters/ChipFilterRow'
import {FilterChipButton} from '@/ui/filters/FilterChipButton'
import {FilterRow} from '@/ui/filters/FilterRow'
import {SearchInput} from '@/ui/search/SearchInput'

import {CatalogMobileFilterGroup, CatalogRealmFilterRow} from './DatabaseChipPrimitives'
import {useMobileDatabaseFilters} from './useMobileDatabaseFilters'

interface DatabaseFiltersProps {
  query: string
  realmFilter: RealmFilterId
  rarityFilter: RarityFilterId
  typeFilter: TypeFilterId
  availabilityFilter: AvailabilityFilterId
  gameplayFactionFilters: readonly GameplayFactionFilterId[]
  scalingSubstatFilters: readonly AwakenerScalingSubstatFilter[]
  searchInputRef: RefObject<HTMLInputElement | null>
  onQueryChange: (query: string) => void
  onRealmFilterChange: (filter: RealmFilterId) => void
  onRarityFilterChange: (filter: RarityFilterId) => void
  onTypeFilterChange: (filter: TypeFilterId) => void
  onAvailabilityFilterChange: (filter: AvailabilityFilterId) => void
  onGameplayFactionFilterToggle: (filter: GameplayFactionFilterId) => void
  onScalingSubstatFilterToggle: (filter: SubstatScalingKey) => void
  onScalingSubstatFilterRoleChange: (
    filter: SubstatScalingKey,
    role: AwakenerScalingSubstatFilterRole,
  ) => void
  onScalingSubstatFilterRemove: (filter: SubstatScalingKey) => void
}

const REALM_FILTERS = DATABASE_REALM_FILTER_IDS.slice(1)

const rarityFilterTabs = DATABASE_RARITY_FILTER_IDS.map((id) => ({
  id,
  label: id === 'ALL' ? 'All' : id,
  summaryLabel: id === 'ALL' ? 'All' : id,
}))

const typeFilterTabs = DATABASE_TYPE_FILTER_IDS.map((id) => ({
  id,
  label: getTypeFilterLabel(id),
  summaryLabel: getTypeFilterLabel(id),
}))

const availabilityFilterTabs = DATABASE_AVAILABILITY_FILTER_IDS.map((id) => ({
  id,
  label: getAvailabilityFilterLabel(id),
  summaryLabel: getAvailabilityFilterLabel(id),
}))

const gameplayFactionOptions = DATABASE_GAMEPLAY_FACTION_FILTER_IDS.map((id) => ({
  id,
  label: id,
}))

const scalingSubstatOptions = getAwakenerScalingSubstatFilterOptions()

export function DatabaseFilters({
  query,
  realmFilter,
  rarityFilter,
  typeFilter,
  availabilityFilter,
  gameplayFactionFilters,
  scalingSubstatFilters,
  searchInputRef,
  onQueryChange,
  onRealmFilterChange,
  onRarityFilterChange,
  onTypeFilterChange,
  onAvailabilityFilterChange,
  onGameplayFactionFilterToggle,
  onScalingSubstatFilterRemove,
  onScalingSubstatFilterRoleChange,
  onScalingSubstatFilterToggle,
}: DatabaseFiltersProps) {
  const [openMobileFilter, setOpenMobileFilter] = useState<'rarity' | 'type' | 'source' | null>(
    null,
  )
  const isMobileFilters = useMobileDatabaseFilters()

  return (
    <div className='space-y-3 sm:space-y-3.5'>
      <SearchInput
        label='Search awakeners'
        onQueryChange={onQueryChange}
        placeholder='Name, tag, realm, or role'
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
                activeId: rarityFilter,
                defaultId: 'ALL',
                key: 'rarity',
                label: 'Rarity',
                onChange: (next) => {
                  onRarityFilterChange(next as RarityFilterId)
                },
                options: rarityFilterTabs,
              },
              {
                activeId: typeFilter,
                defaultId: 'ALL',
                key: 'type',
                label: 'Type',
                onChange: (next) => {
                  onTypeFilterChange(next as TypeFilterId)
                },
                options: typeFilterTabs,
              },
              {
                activeId: availabilityFilter,
                defaultId: 'ALL',
                key: 'source',
                label: 'Source',
                onChange: (next) => {
                  onAvailabilityFilterChange(next as AvailabilityFilterId)
                },
                options: availabilityFilterTabs,
                toggleClassName: 'col-span-2',
              },
            ]}
            onOpenKeyChange={setOpenMobileFilter}
            openKey={openMobileFilter}
          />
          <AwakenerAdvancedFilters
            gameplayFactionFilters={gameplayFactionFilters}
            onGameplayFactionFilterToggle={onGameplayFactionFilterToggle}
            onScalingSubstatFilterRemove={onScalingSubstatFilterRemove}
            onScalingSubstatFilterRoleChange={onScalingSubstatFilterRoleChange}
            onScalingSubstatFilterToggle={onScalingSubstatFilterToggle}
            scalingSubstatFilters={scalingSubstatFilters}
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
            activeId={typeFilter}
            defaultId='ALL'
            label='Type'
            onChange={onTypeFilterChange}
            options={typeFilterTabs}
          />
          <ChipFilterRow
            activeId={availabilityFilter}
            defaultId='ALL'
            label='Source'
            onChange={onAvailabilityFilterChange}
            options={availabilityFilterTabs}
          />
          <AwakenerAdvancedFilters
            gameplayFactionFilters={gameplayFactionFilters}
            onGameplayFactionFilterToggle={onGameplayFactionFilterToggle}
            onScalingSubstatFilterRemove={onScalingSubstatFilterRemove}
            onScalingSubstatFilterRoleChange={onScalingSubstatFilterRoleChange}
            onScalingSubstatFilterToggle={onScalingSubstatFilterToggle}
            scalingSubstatFilters={scalingSubstatFilters}
          />
        </div>
      )}
    </div>
  )
}

interface AwakenerAdvancedFiltersProps {
  gameplayFactionFilters: readonly GameplayFactionFilterId[]
  scalingSubstatFilters: readonly AwakenerScalingSubstatFilter[]
  onGameplayFactionFilterToggle: (filter: GameplayFactionFilterId) => void
  onScalingSubstatFilterToggle: (filter: SubstatScalingKey) => void
  onScalingSubstatFilterRoleChange: (
    filter: SubstatScalingKey,
    role: AwakenerScalingSubstatFilterRole,
  ) => void
  onScalingSubstatFilterRemove: (filter: SubstatScalingKey) => void
}

function AwakenerAdvancedFilters({
  gameplayFactionFilters,
  onGameplayFactionFilterToggle,
  onScalingSubstatFilterRemove,
  onScalingSubstatFilterRoleChange,
  onScalingSubstatFilterToggle,
  scalingSubstatFilters,
}: AwakenerAdvancedFiltersProps) {
  const activeCount = gameplayFactionFilters.length + scalingSubstatFilters.length
  const [open, setOpen] = useState(activeCount > 0)

  return (
    <div className='border-t border-slate-800/70 pt-2.5'>
      <button
        aria-expanded={open}
        className={`flex min-h-9 w-full items-center justify-between gap-3 rounded-[2px] border px-2.5 py-2 text-left text-[11px] transition-[background-color,border-color,color,box-shadow] duration-150 focus-visible:border-amber-200/70 focus-visible:ring-2 focus-visible:ring-amber-200/30 focus-visible:outline-none ${
          open || activeCount > 0
            ? 'border-amber-300/38 bg-slate-950/62 text-amber-50'
            : 'border-slate-700/70 bg-[linear-gradient(180deg,rgba(15,23,42,0.72),rgba(10,15,28,0.58))] text-slate-300 hover:border-slate-500/70 hover:bg-slate-900/70'
        }`}
        onClick={() => {
          setOpen((current) => !current)
        }}
        type='button'
      >
        <span className='tracking-[0.16em] text-slate-400 uppercase'>Advanced filters</span>
        <span className='flex items-center gap-2'>
          {activeCount > 0 ? (
            <span className='rounded-[2px] border border-amber-300/30 bg-amber-300/10 px-1.5 py-0.5 text-amber-100'>
              {activeCount} active
            </span>
          ) : null}
          <span aria-hidden='true' className={open ? 'text-amber-200' : 'text-slate-500'}>
            {open ? '-' : '+'}
          </span>
        </span>
      </button>

      {open ? (
        <div className='space-y-2.5 border-x border-b border-slate-800/70 bg-slate-950/20 px-2.5 py-2.5 sm:px-3'>
          <FilterRow label='Faction'>
            {gameplayFactionOptions.map((option) => (
              <FilterChipButton
                active={gameplayFactionFilters.includes(option.id)}
                key={option.id}
                onClick={() => {
                  onGameplayFactionFilterToggle(option.id)
                }}
                onContextMenu={(event) => {
                  event.preventDefault()
                  onGameplayFactionFilterToggle(option.id)
                }}
              >
                {option.label}
              </FilterChipButton>
            ))}
          </FilterRow>

          <ScalingSubstatFilterRow
            activeFilters={scalingSubstatFilters}
            onRemove={onScalingSubstatFilterRemove}
            onRoleChange={onScalingSubstatFilterRoleChange}
            onToggle={onScalingSubstatFilterToggle}
          />
        </div>
      ) : null}
    </div>
  )
}

interface ScalingSubstatFilterRowProps {
  activeFilters: readonly AwakenerScalingSubstatFilter[]
  onRemove: (filter: SubstatScalingKey) => void
  onRoleChange: (filter: SubstatScalingKey, role: AwakenerScalingSubstatFilterRole) => void
  onToggle: (filter: SubstatScalingKey) => void
}

const SCALING_ROLE_OPTIONS: readonly AwakenerScalingSubstatFilterRole[] = [
  'ANY',
  'PRIMARY',
  'SECONDARY',
]

function getScalingFilterRoleChipSuffix(role: AwakenerScalingSubstatFilterRole): string | null {
  if (role === 'PRIMARY') {
    return 'Primary'
  }
  if (role === 'SECONDARY') {
    return 'Secondary'
  }
  return null
}

function focusScalingMenuButton(
  menu: HTMLElement,
  direction: 'first' | 'last' | 'next' | 'previous',
) {
  const buttons = Array.from(menu.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'))
  if (buttons.length === 0) {
    return
  }
  const activeIndex = buttons.findIndex((button) => button === document.activeElement)
  if (direction === 'first') {
    buttons[0].focus()
    return
  }
  if (direction === 'last') {
    buttons[buttons.length - 1].focus()
    return
  }
  if (activeIndex === -1) {
    buttons[direction === 'next' ? 0 : buttons.length - 1].focus()
    return
  }
  const nextIndex =
    direction === 'next'
      ? (activeIndex + 1) % buttons.length
      : (activeIndex <= 0 ? buttons.length : activeIndex) - 1
  buttons[nextIndex].focus()
}

function handleScalingRoleMenuKeyDown(event: KeyboardEvent<HTMLDivElement>, onClose: () => void) {
  if (event.key === 'Escape') {
    event.preventDefault()
    onClose()
    const trigger = event.currentTarget.previousElementSibling
    if (trigger instanceof HTMLButtonElement) {
      trigger.focus()
    }
    return
  }
  if (event.key === 'Home') {
    event.preventDefault()
    focusScalingMenuButton(event.currentTarget, 'first')
    return
  }
  if (event.key === 'End') {
    event.preventDefault()
    focusScalingMenuButton(event.currentTarget, 'last')
    return
  }
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    focusScalingMenuButton(event.currentTarget, 'next')
    return
  }
  if (event.key === 'ArrowUp') {
    event.preventDefault()
    focusScalingMenuButton(event.currentTarget, 'previous')
  }
}

function ScalingSubstatFilterRow({
  activeFilters,
  onRemove,
  onRoleChange,
  onToggle,
}: ScalingSubstatFilterRowProps) {
  const [openFilterKey, setOpenFilterKey] = useState<SubstatScalingKey | null>(null)
  const menuIdPrefix = useId()

  return (
    <FilterRow
      controlsClassName='grid min-w-0 flex-1 grid-cols-2 gap-1.5 sm:flex sm:flex-wrap sm:items-center'
      label='Scaling'
    >
      {scalingSubstatOptions.map((option) => {
        const activeFilter = activeFilters.find((filter) => filter.key === option.id)
        const roleSuffix = activeFilter ? getScalingFilterRoleChipSuffix(activeFilter.role) : null
        const menuOpen = openFilterKey === option.id
        const menuId = `${menuIdPrefix}-${option.id}`

        return (
          <span
            className={`relative min-w-0 ${menuOpen ? 'col-span-2 sm:col-span-1' : ''}`}
            key={option.id}
            onBlur={(event) => {
              const nextTarget = event.relatedTarget
              if (!(nextTarget instanceof Node) || !event.currentTarget.contains(nextTarget)) {
                setOpenFilterKey(null)
              }
            }}
          >
            <FilterChipButton
              active={Boolean(activeFilter)}
              ariaControls={activeFilter ? menuId : undefined}
              ariaExpanded={activeFilter ? menuOpen : undefined}
              ariaHasPopup={activeFilter ? 'menu' : undefined}
              ariaLabel={
                activeFilter
                  ? `Change scaling role for ${option.label}`
                  : `Filter by ${option.label} scaling`
              }
              className='w-full min-w-0 justify-start sm:w-auto'
              onClick={() => {
                if (!activeFilter) {
                  onToggle(option.id)
                  setOpenFilterKey(option.id)
                  return
                }
                setOpenFilterKey((current) => (current === option.id ? null : option.id))
              }}
              onContextMenu={(event) => {
                event.preventDefault()
                onToggle(option.id)
                setOpenFilterKey(null)
              }}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  setOpenFilterKey(null)
                }
              }}
            >
              {option.iconAsset ? (
                <img
                  alt=''
                  className='size-3.5 shrink-0 object-contain'
                  draggable={false}
                  src={option.iconAsset}
                />
              ) : null}
              <span className='truncate'>{option.label}</span>
              {roleSuffix ? (
                <span className='ml-1.5 border-l border-amber-200/25 pl-1.5 text-[10px] text-amber-100/78'>
                  {roleSuffix}
                </span>
              ) : null}
            </FilterChipButton>
            {activeFilter && menuOpen ? (
              <div
                className='z-50 mt-1.5 w-full min-w-0 border border-slate-700/80 bg-slate-950/98 p-1.5 shadow-[0_14px_28px_rgba(2,6,23,0.55)] sm:absolute sm:top-[calc(100%+0.35rem)] sm:left-0 sm:mt-0 sm:w-[11.5rem] sm:min-w-[11.5rem]'
                id={menuId}
                onKeyDown={(event) => {
                  handleScalingRoleMenuKeyDown(event, () => {
                    setOpenFilterKey(null)
                  })
                }}
                role='menu'
              >
                {SCALING_ROLE_OPTIONS.map((role) => (
                  <button
                    className={`flex w-full items-center justify-between gap-3 rounded-[2px] px-2 py-1.5 text-left text-[11px] transition-colors duration-150 focus-visible:bg-amber-300/12 focus-visible:text-amber-50 focus-visible:outline-none ${
                      activeFilter.role === role
                        ? 'bg-amber-300/10 text-amber-100'
                        : 'text-slate-300 hover:bg-slate-800/70 hover:text-slate-100'
                    }`}
                    key={role}
                    onClick={() => {
                      onRoleChange(option.id, role)
                      setOpenFilterKey(null)
                    }}
                    aria-checked={activeFilter.role === role}
                    role='menuitemradio'
                    type='button'
                  >
                    <span>{getAwakenerScalingSubstatFilterRoleLabel(role)}</span>
                  </button>
                ))}
                <button
                  className='mt-1 w-full border-t border-slate-800/90 px-2 pt-2 pb-1.5 text-left text-[11px] text-slate-400 transition-colors hover:text-rose-200 focus-visible:text-rose-200 focus-visible:outline-none'
                  onClick={() => {
                    onRemove(option.id)
                    setOpenFilterKey(null)
                  }}
                  role='menuitem'
                  type='button'
                >
                  Remove filter
                </button>
              </div>
            ) : null}
          </span>
        )
      })}
    </FilterRow>
  )
}
