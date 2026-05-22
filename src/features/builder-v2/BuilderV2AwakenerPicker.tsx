import {memo, useEffect, useRef, type CSSProperties, type ReactNode, type Ref} from 'react'
import {FaCaretDown, FaCaretUp} from 'react-icons/fa6'

import type {
  AwakenerSortKey,
  CollectionSortDirection,
  WheelCollectionSortKey,
} from '@/domain/collection-sorting'
import {getMainstatByKey, getMainstatIcon} from '@/domain/mainstats'
import {getRealmAccent} from '@/domain/realms'
import {wheelMainstatFilterOptions} from '@/domain/wheel-mainstat-filters'

import type {
  BuilderV2AwakenerFilter,
  BuilderV2AwakenerOption,
  BuilderV2CovenantOption,
  BuilderV2PickerModel,
  BuilderV2PickerTab,
  BuilderV2PosseOption,
  BuilderV2PosseFilter,
  BuilderV2WheelOption,
  BuilderV2WheelRarityFilter,
} from './BuilderV2ModelTypes'

interface BuilderV2AwakenerPickerProps {
  picker: BuilderV2PickerModel
  onAssignAwakener: (awakenerId: string) => void
  onAssignCovenant: (covenantId: string) => void
  onAssignPosse: (posseId: string) => void
  onAssignWheel: (wheelId: string) => void
}

const pickerTabs: {id: BuilderV2PickerTab; label: string}[] = [
  {id: 'awakeners', label: 'Awakeners'},
  {id: 'wheels', label: 'Wheels'},
  {id: 'covenants', label: 'Covenants'},
  {id: 'posses', label: 'Posses'},
]

const pickerCopy: Record<BuilderV2PickerTab, {title: string; searchLabel: string}> = {
  awakeners: {title: 'Awakeners', searchLabel: 'Search awakeners'},
  wheels: {title: 'Wheels', searchLabel: 'Search wheels'},
  covenants: {title: 'Covenants', searchLabel: 'Search covenants'},
  posses: {title: 'Posses', searchLabel: 'Search posses'},
}

function getKeyboardPickerTab(key: string, currentIndex: number): BuilderV2PickerTab | null {
  if (key === 'Home') {
    return pickerTabs[0].id
  }

  if (key === 'End') {
    return pickerTabs[pickerTabs.length - 1].id
  }

  if (key === 'ArrowLeft') {
    return pickerTabs[(currentIndex - 1 + pickerTabs.length) % pickerTabs.length].id
  }

  if (key === 'ArrowRight') {
    return pickerTabs[(currentIndex + 1) % pickerTabs.length].id
  }

  return null
}

const awakenerFilterTabs: {id: BuilderV2AwakenerFilter; label: string}[] = [
  {id: 'ALL', label: 'All'},
  {id: 'AEQUOR', label: 'Aequor'},
  {id: 'CARO', label: 'Caro'},
  {id: 'CHAOS', label: 'Chaos'},
  {id: 'ULTRA', label: 'Ultra'},
]

const posseFilterTabs: {id: BuilderV2PosseFilter; label: string}[] = [
  {id: 'ALL', label: 'All'},
  {id: 'FADED_LEGACY', label: 'Faded'},
  {id: 'AEQUOR', label: 'Aequor'},
  {id: 'CARO', label: 'Caro'},
  {id: 'CHAOS', label: 'Chaos'},
  {id: 'ULTRA', label: 'Ultra'},
]

const wheelRarityFilterTabs: {id: BuilderV2WheelRarityFilter; label: string}[] = [
  {id: 'ALL', label: 'All'},
  {id: 'SSR', label: 'SSR'},
  {id: 'SR', label: 'SR'},
  {id: 'R', label: 'R'},
]

export const BuilderV2AwakenerPicker = memo(function BuilderV2AwakenerPicker({
  picker,
  onAssignAwakener,
  onAssignCovenant,
  onAssignPosse,
  onAssignWheel,
}: BuilderV2AwakenerPickerProps) {
  return (
    <aside className='builder-v2-panel builder-v2-armory' aria-label='Builder V2 armory'>
      <BuilderV2PickerContent
        onAssignAwakener={onAssignAwakener}
        onAssignCovenant={onAssignCovenant}
        onAssignPosse={onAssignPosse}
        onAssignWheel={onAssignWheel}
        picker={picker}
      />
    </aside>
  )
})

interface BuilderV2PickerContentProps extends BuilderV2AwakenerPickerProps {
  searchInputRef?: Ref<HTMLInputElement>
}

export function BuilderV2PickerContent({
  picker,
  searchInputRef,
  onAssignAwakener,
  onAssignCovenant,
  onAssignPosse,
  onAssignWheel,
}: BuilderV2PickerContentProps) {
  const activeCopy = pickerCopy[picker.tab]

  return (
    <>
      <div className='builder-v2-picker-tabs' role='tablist' aria-label='Picker categories'>
        {pickerTabs.map((tab, tabIndex) => {
          const isActive = tab.id === picker.tab
          return (
            <button
              aria-controls='builder-v2-picker-panel'
              aria-selected={isActive}
              className={`builder-v2-tab ${isActive ? 'builder-v2-tab--active' : ''}`}
              id={`builder-v2-tab-${tab.id}`}
              key={tab.id}
              onKeyDown={(event) => {
                const nextTab = getKeyboardPickerTab(event.key, tabIndex)
                if (!nextTab) {
                  return
                }
                event.preventDefault()
                picker.setTab(nextTab)
                document.getElementById(`builder-v2-tab-${nextTab}`)?.focus()
              }}
              onClick={() => {
                picker.setTab(tab.id)
              }}
              role='tab'
              tabIndex={isActive ? 0 : -1}
              type='button'
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      <div className='builder-v2-picker-toolbar'>
        <label className='builder-v2-search-label'>
          <span className='sr-only'>{activeCopy.searchLabel}</span>
          <span aria-hidden className='builder-v2-search-icon'>
            ⌕
          </span>
          <input
            className='builder-v2-search'
            onChange={(event) => {
              picker.setSearchQuery(event.target.value)
            }}
            placeholder={activeCopy.searchLabel}
            ref={searchInputRef}
            type='search'
            value={picker.searchQuery}
          />
        </label>
        <BuilderV2PickerOptionsMenu picker={picker} />
      </div>

      <BuilderV2PickerFilters picker={picker} />

      <div
        aria-labelledby={`builder-v2-tab-${picker.tab}`}
        className='builder-v2-picker-results'
        id='builder-v2-picker-panel'
        role='tabpanel'
      >
        {picker.tab === 'awakeners'
          ? picker.awakeners.map((awakener) => (
              <BuilderV2AwakenerPickerTile
                awakener={awakener}
                key={awakener.id}
                onAssign={onAssignAwakener}
              />
            ))
          : null}

        {picker.tab === 'wheels'
          ? picker.wheels.map((wheel) => (
              <BuilderV2WheelPickerTile key={wheel.id} onAssign={onAssignWheel} wheel={wheel} />
            ))
          : null}

        {picker.tab === 'covenants'
          ? picker.covenants.map((covenant) => (
              <BuilderV2CovenantPickerTile
                covenant={covenant}
                key={covenant.id}
                onAssign={onAssignCovenant}
              />
            ))
          : null}

        {picker.tab === 'posses'
          ? picker.posses.map((posse) => (
              <BuilderV2PossePickerTile key={posse.id} onAssign={onAssignPosse} posse={posse} />
            ))
          : null}
      </div>
    </>
  )
}

function BuilderV2PickerFilters({picker}: {picker: BuilderV2PickerModel}) {
  if (picker.tab === 'awakeners') {
    return (
      <PickerChipRow label='Awakener realm filters'>
        {awakenerFilterTabs.map((filter) => (
          <PickerChip
            isActive={picker.preferences.awakenerFilter === filter.id}
            key={filter.id}
            label={filter.label}
            onClick={() => {
              picker.setAwakenerFilter(filter.id)
            }}
          />
        ))}
      </PickerChipRow>
    )
  }

  if (picker.tab === 'wheels') {
    return (
      <>
        <PickerChipRow label='Wheel rarity filters'>
          {wheelRarityFilterTabs.map((filter) => (
            <PickerChip
              isActive={picker.preferences.wheelRarityFilter === filter.id}
              key={filter.id}
              label={filter.label}
              onClick={() => {
                picker.setWheelRarityFilter(filter.id)
              }}
            />
          ))}
        </PickerChipRow>
        <PickerChipRow label='Wheel mainstat filters'>
          {wheelMainstatFilterOptions.map((filter) => (
            <PickerChip
              ariaLabel={`Filter wheels by ${filter.label}`}
              iconSrc={filter.iconAsset}
              isActive={picker.preferences.wheelMainstatFilter === filter.id}
              key={filter.id}
              label={filter.id === 'ALL' ? 'All stats' : filter.label}
              onClick={() => {
                picker.setWheelMainstatFilter(filter.id)
              }}
            />
          ))}
        </PickerChipRow>
      </>
    )
  }

  if (picker.tab === 'posses') {
    return (
      <PickerChipRow label='Posse filters'>
        {posseFilterTabs.map((filter) => (
          <PickerChip
            isActive={picker.preferences.posseFilter === filter.id}
            key={filter.id}
            label={filter.label}
            onClick={() => {
              picker.setPosseFilter(filter.id)
            }}
          />
        ))}
      </PickerChipRow>
    )
  }

  return null
}

function BuilderV2PickerOptionsMenu({picker}: {picker: BuilderV2PickerModel}) {
  const menuRef = useRef<HTMLDetailsElement>(null)

  useEffect(() => {
    const closeMenuOnOutsidePointer = (event: PointerEvent) => {
      const menu = menuRef.current
      if (!menu?.open || !(event.target instanceof Node) || menu.contains(event.target)) {
        return
      }
      menu.open = false
    }

    document.addEventListener('pointerdown', closeMenuOnOutsidePointer)
    return () => {
      document.removeEventListener('pointerdown', closeMenuOnOutsidePointer)
    }
  }, [])

  return (
    <details className='builder-v2-picker-menu' ref={menuRef}>
      <summary className='builder-v2-picker-menu-button'>Options</summary>
      <div className='builder-v2-picker-menu-popover'>
        {picker.tab === 'awakeners' ? (
          <>
            <PickerSortRow
              direction={picker.preferences.awakenerSortDirection}
              label='Sort'
              onDirectionToggle={picker.toggleAwakenerSortDirection}
              select={
                <select
                  aria-label='Sort awakeners by'
                  value={picker.preferences.awakenerSortKey}
                  onChange={(event) => {
                    picker.setAwakenerSortKey(event.target.value as AwakenerSortKey)
                  }}
                >
                  <option value='LEVEL'>Level</option>
                  <option value='ENLIGHTEN'>Enlighten</option>
                  <option value='RARITY'>Rarity</option>
                  <option value='ALPHABETICAL'>Name</option>
                  <option value='RELEASE_DATE'>Release</option>
                </select>
              }
            />
            <PickerToggle
              checked={picker.preferences.awakenerSortGroupByRealm}
              label='Group by realm'
              onChange={(checked) => {
                picker.setAwakenerSortGroupByRealm(checked)
              }}
            />
          </>
        ) : null}
        {picker.tab === 'wheels' ? (
          <>
            <PickerSortRow
              direction={picker.preferences.wheelSortDirection}
              label='Sort'
              onDirectionToggle={picker.toggleWheelSortDirection}
              select={
                <select
                  aria-label='Sort wheels by'
                  value={picker.preferences.wheelSortKey}
                  onChange={(event) => {
                    picker.setWheelSortKey(event.target.value as WheelCollectionSortKey)
                  }}
                >
                  <option value='RARITY'>Rarity</option>
                  <option value='ENLIGHTEN'>Enlighten</option>
                  <option value='ALPHABETICAL'>Name</option>
                  <option value='REALM'>Realm</option>
                  <option value='MAINSTAT'>Mainstat</option>
                </select>
              }
            />
          </>
        ) : null}
        <PickerToggle
          checked={picker.preferences.displayUnowned}
          label='Display unowned'
          onChange={(checked) => {
            picker.setDisplayUnowned(checked)
          }}
        />
        {picker.preferences.displayUnowned ? (
          <PickerToggle
            checked={picker.preferences.sinkUnownedToBottom}
            label='Move unowned to bottom'
            onChange={(checked) => {
              picker.setSinkUnownedToBottom(checked)
            }}
          />
        ) : null}
        <PickerToggle
          checked={picker.preferences.allowDupes}
          label='Allow dupes'
          onChange={(checked) => {
            picker.setAllowDupes(checked)
          }}
        />
        {picker.tab === 'wheels' || picker.tab === 'covenants' ? (
          <PickerToggle
            checked={picker.preferences.promoteRecommendedGear}
            label='Promote recommendations'
            onChange={(checked) => {
              picker.setPromoteRecommendedGear(checked)
            }}
          />
        ) : null}
        {picker.tab === 'wheels' && picker.preferences.promoteRecommendedGear ? (
          <PickerToggle
            checked={picker.preferences.promoteMatchingWheelMainstats}
            label='Promote mainstat matches'
            onChange={(checked) => {
              picker.setPromoteMatchingWheelMainstats(checked)
            }}
          />
        ) : null}
      </div>
    </details>
  )
}

function BuilderV2AwakenerPickerTile({
  awakener,
  onAssign,
}: {
  awakener: BuilderV2AwakenerOption
  onAssign: (awakenerId: string) => void
}) {
  const stateChips = [
    !awakener.owned ? 'Unowned' : null,
    awakener.blockReason === 'Realm limit' ? 'Realm' : null,
    awakener.inUseLabel,
  ].filter(isPresent)

  return (
    <button
      aria-label={`${awakener.displayName}${awakener.inUse ? ' in use' : ''}${
        awakener.inUseLabel ? ` ${awakener.inUseLabel}` : ''
      }`}
      className='builder-v2-picker-tile builder-v2-picker-tile--awakener'
      data-blocked={awakener.blocked}
      data-in-use={awakener.inUse}
      data-owned={awakener.owned}
      onClick={() => {
        onAssign(awakener.id)
      }}
      type='button'
    >
      <PickerTileArt
        alt={`${awakener.displayName} portrait`}
        chips={stateChips.map((chip) => (
          <PickerStateChip key={chip} tone={getStateChipTone(chip)}>
            {chip}
          </PickerStateChip>
        ))}
        footer={renderEnlightenChip(awakener.enlightenLevel)}
        fallback={awakener.displayName}
        realm={awakener.realm}
        src={awakener.portraitSrc}
      />
      <PickerTileCaption title={awakener.displayName} />
    </button>
  )
}

const BuilderV2WheelPickerTile = memo(function BuilderV2WheelPickerTile({
  onAssign,
  wheel,
}: {
  onAssign: (wheelId: string) => void
  wheel: BuilderV2WheelOption
}) {
  const isDimmed = wheel.inUse || !wheel.owned

  return (
    <button
      aria-label={`${wheel.name}${wheel.inUse ? ' in use' : ''}${
        wheel.inUseLabel ? ` ${wheel.inUseLabel}` : ''
      }`}
      className='builder-v2-picker-tile builder-v2-picker-tile--wheel'
      data-in-use={wheel.inUse}
      data-owned={wheel.owned}
      data-recommended={wheel.recommended}
      onClick={() => {
        onAssign(wheel.id)
      }}
      type='button'
    >
      <PickerTileArt
        alt={`${wheel.name} wheel`}
        chips={
          <>
            {!wheel.owned ? <PickerStateChip tone='danger'>Unowned</PickerStateChip> : null}
            {wheel.inUseLabel ? (
              <PickerStateChip tone='status'>{wheel.inUseLabel}</PickerStateChip>
            ) : null}
            {wheel.recommendationLabel ? (
              <PickerStateChip tone='recommendation'>{wheel.recommendationLabel}</PickerStateChip>
            ) : (
              <RecommendedMainstatChip mainstatKey={wheel.recommendedMainstatKey} />
            )}
          </>
        }
        fallback={wheel.name}
        footer={renderEnlightenChip(wheel.enlightenLevel)}
        isDimmed={isDimmed}
        src={wheel.assetSrc}
      />
      <PickerTileCaption title={wheel.name} />
    </button>
  )
}, areWheelPickerTilePropsEqual)

function areWheelPickerTilePropsEqual(
  previous: {
    onAssign: (wheelId: string) => void
    wheel: BuilderV2WheelOption
  },
  next: {
    onAssign: (wheelId: string) => void
    wheel: BuilderV2WheelOption
  },
): boolean {
  return previous.onAssign === next.onAssign && areWheelOptionsEqual(previous.wheel, next.wheel)
}

function BuilderV2CovenantPickerTile({
  covenant,
  onAssign,
}: {
  covenant: BuilderV2CovenantOption
  onAssign: (covenantId: string) => void
}) {
  return (
    <button
      aria-label={`${covenant.name}${covenant.inUse ? ' in use' : ''}`}
      className='builder-v2-picker-tile builder-v2-picker-tile--covenant'
      data-in-use={covenant.inUse}
      data-recommended={covenant.recommended}
      onClick={() => {
        onAssign(covenant.id)
      }}
      type='button'
    >
      <PickerTileArt
        alt={`${covenant.name} covenant`}
        chips={
          <>
            {covenant.recommendationLabel ? (
              <PickerStateChip tone='recommendation'>{covenant.recommendationLabel}</PickerStateChip>
            ) : null}
            {covenant.inUse ? <PickerStateChip tone='status'>Used</PickerStateChip> : null}
          </>
        }
        fallback={covenant.name}
        src={covenant.assetSrc}
      />
      <PickerTileCaption title={covenant.name} />
    </button>
  )
}

function BuilderV2PossePickerTile({
  onAssign,
  posse,
}: {
  onAssign: (posseId: string) => void
  posse: BuilderV2PosseOption
}) {
  return (
    <button
      aria-label={`${posse.name}${posse.inUse ? ' in use' : ''}${
        posse.statusLabel ? ` ${posse.statusLabel}` : ''
      }`}
      className='builder-v2-picker-tile builder-v2-picker-tile--posse'
      data-active={posse.isActive}
      data-blocked={posse.blocked}
      data-owned={posse.owned}
      data-recommended={posse.recommended}
      onClick={() => {
        onAssign(posse.id)
      }}
      type='button'
    >
      <PickerTileArt
        alt={`${posse.name} posse`}
        chips={
          <>
            {posse.isActive ? <PickerStateChip tone='recommendation'>Active</PickerStateChip> : null}
            {posse.recommended && !posse.isActive ? (
              <PickerStateChip tone='recommendation'>Rec</PickerStateChip>
            ) : null}
            {!posse.owned ? <PickerStateChip tone='danger'>Unowned</PickerStateChip> : null}
            {posse.statusLabel && posse.statusLabel !== 'Unowned' && !posse.isActive ? (
              <PickerStateChip tone={posse.blocked ? 'status' : 'quiet'}>
                {posse.statusLabel}
              </PickerStateChip>
            ) : null}
          </>
        }
        fallback={posse.name}
        realm={posse.realm}
        src={posse.assetSrc}
      />
      <PickerTileCaption title={posse.name} />
    </button>
  )
}

function PickerTileArt({
  alt,
  chips,
  fallback,
  footer,
  isDimmed = false,
  realm,
  src,
}: {
  alt: string
  chips?: ReactNode
  fallback: string
  footer?: ReactNode
  isDimmed?: boolean
  realm?: string
  src: string | undefined
}) {
  const realmAccent = realm ? getRealmAccent(realm) : undefined
  return (
    <span
      className='builder-v2-picker-tile-art'
      style={realmAccent ? ({'--picker-realm-accent': realmAccent} as CSSProperties) : undefined}
    >
      {src ? (
        <img
          alt={alt}
          className={isDimmed ? 'builder-v2-picker-tile-image builder-v2-picker-tile-image--dimmed' : 'builder-v2-picker-tile-image'}
          decoding='async'
          draggable={false}
          fetchPriority='low'
          loading='lazy'
          src={src}
        />
      ) : (
        <span className='builder-v2-picker-tile-fallback'>{fallback.slice(0, 1)}</span>
      )}
      {chips || footer ? (
        <span className='builder-v2-picker-tile-overlay' aria-hidden={false}>
          <span className='builder-v2-picker-tile-chips'>{chips}</span>
          <span className='builder-v2-picker-tile-footer'>{footer}</span>
        </span>
      ) : null}
    </span>
  )
}

function PickerTileCaption({title}: {title: string}) {
  return (
    <span className='builder-v2-picker-tile-caption'>
      <span className='builder-v2-picker-tile-name' title={title}>
        {title}
      </span>
    </span>
  )
}

function PickerStateChip({
  children,
  tone,
}: {
  children: ReactNode
  tone: 'danger' | 'quiet' | 'recommendation' | 'status'
}) {
  return (
    <span className='builder-v2-picker-state-chip' data-tone={tone}>
      {children}
    </span>
  )
}

function renderEnlightenChip(enlightenLevel: number | null): ReactNode {
  const label = formatEnlightenLabel(enlightenLevel)
  if (!label) {
    return null
  }
  return <PickerStateChip tone='quiet'>{label}</PickerStateChip>
}

function isPresent<TValue>(value: TValue | null | undefined): value is TValue {
  return value !== null && value !== undefined
}

function areWheelOptionsEqual(
  previous: BuilderV2WheelOption,
  next: BuilderV2WheelOption,
): boolean {
  return (
    previous.id === next.id &&
    previous.name === next.name &&
    previous.rarity === next.rarity &&
    previous.realm === next.realm &&
    previous.mainstat === next.mainstat &&
    previous.mainstatKey === next.mainstatKey &&
    previous.assetSrc === next.assetSrc &&
    previous.inUse === next.inUse &&
    previous.inUseLabel === next.inUseLabel &&
    previous.owned === next.owned &&
    previous.enlightenLevel === next.enlightenLevel &&
    previous.recommended === next.recommended &&
    previous.recommendationLabel === next.recommendationLabel &&
    previous.recommendedMainstatKey === next.recommendedMainstatKey
  )
}

function RecommendedMainstatChip({
  mainstatKey,
}: {
  mainstatKey: BuilderV2WheelOption['recommendedMainstatKey']
}) {
  if (!mainstatKey) {
    return null
  }
  const icon = getMainstatIcon(mainstatKey)
  const label = getMainstatByKey(mainstatKey)?.label ?? mainstatKey
  if (!icon) {
    return null
  }

  return (
    <span
      aria-label={`Recommended mainstat ${label}`}
      className='builder-v2-picker-state-chip builder-v2-picker-state-chip--icon'
      data-tone='recommendation'
      title={`Recommended mainstat ${label}`}
    >
      <img alt='' draggable={false} src={icon} />
    </span>
  )
}

function formatEnlightenLabel(enlightenLevel: number | null): string | null {
  if (!enlightenLevel || enlightenLevel <= 0) {
    return null
  }
  const baseLevel = Math.min(enlightenLevel, 3)
  const overflow = enlightenLevel - baseLevel
  return overflow > 0 ? `E${String(baseLevel)}+${String(overflow)}` : `E${String(baseLevel)}`
}

function getStateChipTone(chip: string): 'danger' | 'quiet' | 'recommendation' | 'status' {
  return chip === 'Unowned' ? 'danger' : 'status'
}

function PickerChipRow({children, label}: {children: ReactNode; label: string}) {
  return (
    <div className='builder-v2-picker-chips' aria-label={label}>
      {children}
    </div>
  )
}

function PickerChip({
  ariaLabel,
  iconSrc,
  isActive,
  label,
  onClick,
}: {
  ariaLabel?: string
  iconSrc?: string
  isActive: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      aria-label={ariaLabel}
      aria-pressed={isActive}
      className={`builder-v2-picker-chip ${iconSrc ? 'builder-v2-picker-chip--icon' : ''} ${
        isActive ? 'builder-v2-picker-chip--active' : ''
      }`}
      onClick={onClick}
      type='button'
    >
      {iconSrc ? <img alt='' draggable={false} src={iconSrc} /> : null}
      <span className={iconSrc ? 'sr-only' : undefined}>{label}</span>
    </button>
  )
}

function PickerSortRow({
  direction,
  label,
  onDirectionToggle,
  select,
}: {
  direction: CollectionSortDirection
  label: string
  onDirectionToggle: () => void
  select: ReactNode
}) {
  const directionLabel = direction === 'DESC' ? 'High to low' : 'Low to high'

  return (
    <div className='builder-v2-picker-field builder-v2-picker-sort-row'>
      <span>{label}</span>
      <div className='builder-v2-picker-sort-control'>
        {select}
        <button
          aria-label={`Toggle sort direction, currently ${directionLabel}`}
          className='builder-v2-picker-sort-direction'
          onClick={onDirectionToggle}
          title={directionLabel}
          type='button'
        >
          {direction === 'DESC' ? (
            <FaCaretDown aria-hidden className='builder-v2-picker-sort-direction-icon' />
          ) : (
            <FaCaretUp aria-hidden className='builder-v2-picker-sort-direction-icon' />
          )}
        </button>
      </div>
    </div>
  )
}

function PickerToggle({
  checked,
  label,
  onChange,
}: {
  checked: boolean
  label: string
  onChange: (checked: boolean) => void
}) {
  return (
    <label className='builder-v2-picker-toggle'>
      <span>{label}</span>
      <input
        checked={checked}
        onChange={(event) => {
          onChange(event.target.checked)
        }}
        type='checkbox'
      />
    </label>
  )
}
