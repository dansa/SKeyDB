import {
  memo,
  useEffect,
  useId,
  useRef,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type ReactNode,
  type Ref,
} from 'react'

import {useDraggable, useDroppable} from '@dnd-kit/core'
import {FaCaretDown, FaCaretUp, FaCircleInfo, FaEraser, FaGear} from 'react-icons/fa6'

import type {
  AwakenerSortKey,
  CollectionSortDirection,
  WheelCollectionSortKey,
} from '@/domain/collection-sorting'
import {getMainstatByKey, getMainstatIcon} from '@/domain/mainstats'
import {getRealmAccent} from '@/domain/realms'
import {wheelMainstatFilterOptions} from '@/domain/wheel-mainstat-filters'

import {
  createBuilderV2PickerAwakenerDragPayload,
  createBuilderV2PickerCovenantDragPayload,
  createBuilderV2PickerPosseDragPayload,
  createBuilderV2PickerWheelDragPayload,
  makeBuilderV2PickerDndId,
  type BuilderV2DragPayload,
  type BuilderV2DropTargetDescriptor,
} from './builder-v2-dnd'
import {useBuilderV2DndEnabled} from './BuilderV2DndCapability'
import type {
  BuilderV2AwakenerFilter,
  BuilderV2AwakenerOption,
  BuilderV2CovenantOption,
  BuilderV2PickerClearTarget,
  BuilderV2PickerModel,
  BuilderV2PickerTab,
  BuilderV2PosseFilter,
  BuilderV2PosseOption,
  BuilderV2WheelOption,
  BuilderV2WheelRarityFilter,
} from './BuilderV2ModelTypes'
import {useStableEvent} from './useStableEvent'

interface BuilderV2AwakenerPickerProps {
  picker: BuilderV2PickerModel
  isDragActive?: boolean
  pickerClearTarget?: BuilderV2PickerClearTarget | null
  onAssignAwakener: (awakenerId: string) => void
  onAssignCovenant: (covenantId: string) => void
  onAssignPosse: (posseId: string) => void
  onAssignWheel: (wheelId: string) => void
  onClearPickerTarget?: () => void
  onOpenAwakenerDetail: (awakenerId: string) => void
  onOpenCovenantDetail: (covenantId: string) => void
  onOpenPosseDetail: (posseId: string) => void
  onOpenWheelDetail: (wheelId: string) => void
  predictedDropTarget?: BuilderV2DropTargetDescriptor | null
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

function noop() {
  return undefined
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
  isDragActive = false,
  picker,
  pickerClearTarget = null,
  onAssignAwakener,
  onAssignCovenant,
  onAssignPosse,
  onAssignWheel,
  onClearPickerTarget,
  onOpenAwakenerDetail,
  onOpenCovenantDetail,
  onOpenPosseDetail,
  onOpenWheelDetail,
  predictedDropTarget = null,
}: BuilderV2AwakenerPickerProps) {
  return (
    <aside className='builder-v2-panel builder-v2-armory' aria-label='Builder V2 armory'>
      <BuilderV2PickerContent
        onAssignAwakener={onAssignAwakener}
        onAssignCovenant={onAssignCovenant}
        onAssignPosse={onAssignPosse}
        onAssignWheel={onAssignWheel}
        onClearPickerTarget={onClearPickerTarget}
        onOpenAwakenerDetail={onOpenAwakenerDetail}
        onOpenCovenantDetail={onOpenCovenantDetail}
        onOpenPosseDetail={onOpenPosseDetail}
        onOpenWheelDetail={onOpenWheelDetail}
        picker={picker}
        pickerClearTarget={pickerClearTarget}
        isDragActive={isDragActive}
        predictedDropTarget={predictedDropTarget}
      />
    </aside>
  )
})

interface BuilderV2PickerContentProps extends BuilderV2AwakenerPickerProps {
  controlsPlacement?: 'top' | 'bottom'
  isCollapsed?: boolean
  onRequestExpand?: (restoreTarget?: HTMLElement | null) => void
  searchInputRef?: Ref<HTMLInputElement>
}

type PickerDropRef = ((element: HTMLDivElement | null) => void) | undefined

export const BuilderV2PickerContent = memo(function BuilderV2PickerContent(
  props: BuilderV2PickerContentProps,
) {
  const isDndEnabled = useBuilderV2DndEnabled()

  if (isDndEnabled) {
    return <BuilderV2PickerContentWithDnd {...props} />
  }

  return (
    <BuilderV2PickerContentFrame
      {...props}
      isDndEnabled={false}
      isRemoveTarget={false}
      pickerDropRef={undefined}
    />
  )
})

function BuilderV2PickerContentWithDnd(props: BuilderV2PickerContentProps) {
  const {isOver: isPickerRemoveTarget, setNodeRef: setPickerDropRef} = useDroppable({
    id: makeBuilderV2PickerDndId(),
  })
  const isRemoveTarget = props.isDragActive
    ? props.predictedDropTarget?.kind === 'picker'
    : isPickerRemoveTarget

  return (
    <BuilderV2PickerContentFrame
      {...props}
      isDndEnabled
      isRemoveTarget={isRemoveTarget}
      pickerDropRef={setPickerDropRef}
    />
  )
}

function BuilderV2PickerContentFrame({
  controlsPlacement = 'top',
  isCollapsed = false,
  onRequestExpand,
  picker,
  isDndEnabled,
  isRemoveTarget,
  pickerDropRef,
  searchInputRef,
  onAssignAwakener,
  onAssignCovenant,
  onAssignPosse,
  onAssignWheel,
  onClearPickerTarget,
  onOpenAwakenerDetail,
  onOpenCovenantDetail,
  onOpenPosseDetail,
  onOpenWheelDetail,
  pickerClearTarget = null,
}: BuilderV2PickerContentProps & {
  isDndEnabled: boolean
  isRemoveTarget: boolean
  pickerDropRef: PickerDropRef
}) {
  const activeCopy = pickerCopy[picker.tab]
  const pickerInstanceId = `builder-v2-picker-${useId().replaceAll(':', '')}`
  const pickerPanelId = `${pickerInstanceId}-panel`
  const getPickerTabId = (tab: BuilderV2PickerTab) => `${pickerInstanceId}-tab-${tab}`
  const assignAwakener = useStableEvent(onAssignAwakener)
  const assignWheel = useStableEvent(onAssignWheel)
  const assignCovenant = useStableEvent(onAssignCovenant)
  const assignPosse = useStableEvent(onAssignPosse)
  const clearPickerTarget = useStableEvent(onClearPickerTarget ?? noop)
  const openAwakenerDetail = useStableEvent(onOpenAwakenerDetail)
  const openWheelDetail = useStableEvent(onOpenWheelDetail)
  const openCovenantDetail = useStableEvent(onOpenCovenantDetail)
  const openPosseDetail = useStableEvent(onOpenPosseDetail)
  const placesControlsAfterResults = controlsPlacement === 'bottom' && !isCollapsed

  const tabs = (
    <div className='builder-v2-picker-tabs' role='tablist' aria-label='Picker categories'>
      {pickerTabs.map((tab, tabIndex) => {
        const isActive = tab.id === picker.tab
        return (
          <button
            aria-controls={pickerPanelId}
            aria-selected={isActive}
            className={`builder-v2-tab ${isActive ? 'builder-v2-tab--active' : ''}`}
            id={getPickerTabId(tab.id)}
            key={tab.id}
            onKeyDown={(event) => {
              const nextTab = getKeyboardPickerTab(event.key, tabIndex)
              if (!nextTab) {
                return
              }
              event.preventDefault()
              picker.setTab(nextTab)
              if (isCollapsed) {
                onRequestExpand?.(event.currentTarget)
              }
              document.getElementById(getPickerTabId(nextTab))?.focus()
            }}
            onClick={(event) => {
              picker.setTab(tab.id)
              if (isCollapsed) {
                onRequestExpand?.(event.currentTarget)
              }
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
  )

  const toolbar = (
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
  )

  const filters = <BuilderV2PickerFilters picker={picker} />

  const results = (
    <div
      aria-labelledby={getPickerTabId(picker.tab)}
      className={`builder-v2-picker-results ui-scrollbar ${
        isRemoveTarget ? 'builder-v2-picker-results--remove-target' : ''
      }`}
      id={pickerPanelId}
      ref={pickerDropRef}
      role='tabpanel'
    >
      {pickerClearTarget && onClearPickerTarget ? (
        <BuilderV2PickerClearTile onClear={clearPickerTarget} target={pickerClearTarget} />
      ) : null}

      {picker.tab === 'awakeners'
        ? picker.awakeners.map((awakener) => (
            <BuilderV2AwakenerPickerTile
              awakener={awakener}
              isDndEnabled={isDndEnabled}
              key={awakener.id}
              onAssign={assignAwakener}
              onOpenDetail={openAwakenerDetail}
            />
          ))
        : null}

      {picker.tab === 'wheels'
        ? picker.wheels.map((wheel) => (
            <BuilderV2WheelPickerTile
              isDndEnabled={isDndEnabled}
              key={wheel.id}
              onAssign={assignWheel}
              onOpenDetail={openWheelDetail}
              wheel={wheel}
            />
          ))
        : null}

      {picker.tab === 'covenants'
        ? picker.covenants.map((covenant) => (
            <BuilderV2CovenantPickerTile
              covenant={covenant}
              isDndEnabled={isDndEnabled}
              key={covenant.id}
              onAssign={assignCovenant}
              onOpenDetail={openCovenantDetail}
            />
          ))
        : null}

      {picker.tab === 'posses'
        ? picker.posses.map((posse) => (
            <BuilderV2PossePickerTile
              isDndEnabled={isDndEnabled}
              key={posse.id}
              onAssign={assignPosse}
              onOpenDetail={openPosseDetail}
              posse={posse}
            />
          ))
        : null}
    </div>
  )

  return (
    <div
      className={`builder-v2-picker-content ${
        isRemoveTarget ? 'builder-v2-picker-content--remove-target' : ''
      } ${placesControlsAfterResults ? 'builder-v2-picker-content--controls-bottom' : ''}`}
      ref={isCollapsed ? pickerDropRef : undefined}
    >
      {placesControlsAfterResults ? null : tabs}

      {isCollapsed ? (
        <div className='builder-v2-picker-toolbar builder-v2-picker-toolbar--collapsed'>
          <button
            className='builder-v2-adaptive-picker-expand'
            onClick={(event) => {
              onRequestExpand?.(event.currentTarget)
            }}
            type='button'
          >
            Show Picker
          </button>
        </div>
      ) : null}

      {!isCollapsed ? (
        placesControlsAfterResults ? (
          <>
            {toolbar}
            {filters}
            {results}
            <div className='builder-v2-picker-bottom-controls'>{tabs}</div>
          </>
        ) : (
          <>
            {toolbar}
            {filters}
            {results}
          </>
        )
      ) : null}
    </div>
  )
}

function BuilderV2PickerFilters({picker}: {picker: BuilderV2PickerModel}) {
  if (picker.tab === 'awakeners') {
    return (
      <div className='builder-v2-picker-filter-stack'>
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
      </div>
    )
  }

  if (picker.tab === 'wheels') {
    return (
      <div className='builder-v2-picker-filter-stack'>
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
      </div>
    )
  }

  if (picker.tab === 'posses') {
    return (
      <div className='builder-v2-picker-filter-stack'>
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
      </div>
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
      <summary className='builder-v2-picker-menu-button'>
        <FaGear aria-hidden className='builder-v2-picker-menu-icon' />
        <span className='sr-only'>Options</span>
      </summary>
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

const BuilderV2PickerClearTile = memo(function BuilderV2PickerClearTile({
  onClear,
  target,
}: {
  onClear: () => void
  target: BuilderV2PickerClearTarget
}) {
  return (
    <button
      aria-label={target.ariaLabel}
      className='builder-v2-picker-tile builder-v2-picker-clear-tile'
      onClick={onClear}
      title={target.ariaLabel}
      type='button'
    >
      <span className='builder-v2-picker-clear-tile-icon' aria-hidden>
        <FaEraser />
      </span>
      <span className='builder-v2-picker-clear-tile-copy'>
        <span className='builder-v2-picker-clear-tile-title'>{target.label}</span>
        <span className='builder-v2-picker-clear-tile-description'>{target.description}</span>
      </span>
    </button>
  )
})

const BuilderV2AwakenerPickerTile = memo(function BuilderV2AwakenerPickerTile({
  awakener,
  isDndEnabled,
  onAssign,
  onOpenDetail,
}: {
  awakener: BuilderV2AwakenerOption
  isDndEnabled: boolean
  onAssign: (awakenerId: string) => void
  onOpenDetail: (awakenerId: string) => void
}) {
  const stateChips = [
    !awakener.owned ? 'Unowned' : null,
    awakener.blockReason === 'Realm limit' ? 'Realm' : null,
    awakener.inUseLabel,
  ].filter(isPresent)

  return (
    <PickerTileFrame
      detailLabel={`View ${awakener.displayName} details`}
      onOpenDetail={() => {
        onOpenDetail(awakener.id)
      }}
    >
      <PickerTileButton
        aria-label={getAwakenerPickerTileLabel(awakener)}
        className='builder-v2-picker-tile builder-v2-picker-tile--awakener'
        data-blocked={awakener.blocked}
        dndId={`builder-v2-picker-awakener-${awakener.id}`}
        getDndData={
          isDndEnabled ? () => createBuilderV2PickerAwakenerDragPayload(awakener) : undefined
        }
        isDndEnabled={isDndEnabled}
        data-in-use={awakener.inUse}
        data-owned={awakener.owned}
        onClick={() => {
          onAssign(awakener.id)
        }}
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
      </PickerTileButton>
    </PickerTileFrame>
  )
}, areAwakenerPickerTilePropsEqual)

function areAwakenerPickerTilePropsEqual(
  previous: {
    awakener: BuilderV2AwakenerOption
    isDndEnabled: boolean
    onAssign: (awakenerId: string) => void
    onOpenDetail: (awakenerId: string) => void
  },
  next: {
    awakener: BuilderV2AwakenerOption
    isDndEnabled: boolean
    onAssign: (awakenerId: string) => void
    onOpenDetail: (awakenerId: string) => void
  },
): boolean {
  return (
    previous.isDndEnabled === next.isDndEnabled &&
    previous.onAssign === next.onAssign &&
    previous.onOpenDetail === next.onOpenDetail &&
    areAwakenerOptionsEqual(previous.awakener, next.awakener)
  )
}

const BuilderV2WheelPickerTile = memo(function BuilderV2WheelPickerTile({
  isDndEnabled,
  onAssign,
  onOpenDetail,
  wheel,
}: {
  isDndEnabled: boolean
  onAssign: (wheelId: string) => void
  onOpenDetail: (wheelId: string) => void
  wheel: BuilderV2WheelOption
}) {
  const isDimmed = wheel.inUse || !wheel.owned

  return (
    <PickerTileFrame
      detailLabel={`View ${wheel.name} details`}
      onOpenDetail={() => {
        onOpenDetail(wheel.id)
      }}
    >
      <PickerTileButton
        aria-label={getWheelPickerTileLabel(wheel)}
        className='builder-v2-picker-tile builder-v2-picker-tile--wheel'
        dndId={`builder-v2-picker-wheel-${wheel.id}`}
        getDndData={isDndEnabled ? () => createBuilderV2PickerWheelDragPayload(wheel) : undefined}
        isDndEnabled={isDndEnabled}
        data-in-use={wheel.inUse}
        data-owned={wheel.owned}
        data-recommended={wheel.recommended}
        onClick={() => {
          onAssign(wheel.id)
        }}
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
      </PickerTileButton>
    </PickerTileFrame>
  )
}, areWheelPickerTilePropsEqual)

function areWheelPickerTilePropsEqual(
  previous: {
    isDndEnabled: boolean
    onAssign: (wheelId: string) => void
    onOpenDetail: (wheelId: string) => void
    wheel: BuilderV2WheelOption
  },
  next: {
    isDndEnabled: boolean
    onAssign: (wheelId: string) => void
    onOpenDetail: (wheelId: string) => void
    wheel: BuilderV2WheelOption
  },
): boolean {
  return (
    previous.isDndEnabled === next.isDndEnabled &&
    previous.onAssign === next.onAssign &&
    previous.onOpenDetail === next.onOpenDetail &&
    areWheelOptionsEqual(previous.wheel, next.wheel)
  )
}

const BuilderV2CovenantPickerTile = memo(function BuilderV2CovenantPickerTile({
  covenant,
  isDndEnabled,
  onAssign,
  onOpenDetail,
}: {
  covenant: BuilderV2CovenantOption
  isDndEnabled: boolean
  onAssign: (covenantId: string) => void
  onOpenDetail: (covenantId: string) => void
}) {
  return (
    <PickerTileFrame
      detailLabel={`View ${covenant.name} details`}
      onOpenDetail={() => {
        onOpenDetail(covenant.id)
      }}
    >
      <PickerTileButton
        aria-label={getCovenantPickerTileLabel(covenant)}
        className='builder-v2-picker-tile builder-v2-picker-tile--covenant'
        dndId={`builder-v2-picker-covenant-${covenant.id}`}
        getDndData={
          isDndEnabled ? () => createBuilderV2PickerCovenantDragPayload(covenant) : undefined
        }
        isDndEnabled={isDndEnabled}
        data-in-use={covenant.inUse}
        data-recommended={covenant.recommended}
        onClick={() => {
          onAssign(covenant.id)
        }}
      >
        <PickerTileArt
          alt={`${covenant.name} covenant`}
          chips={
            <>
              {covenant.recommendationLabel ? (
                <PickerStateChip tone='recommendation'>
                  {covenant.recommendationLabel}
                </PickerStateChip>
              ) : null}
              {covenant.inUse ? <PickerStateChip tone='status'>Used</PickerStateChip> : null}
            </>
          }
          fallback={covenant.name}
          src={covenant.assetSrc}
        />
        <PickerTileCaption title={covenant.name} />
      </PickerTileButton>
    </PickerTileFrame>
  )
}, areCovenantPickerTilePropsEqual)

function areCovenantPickerTilePropsEqual(
  previous: {
    covenant: BuilderV2CovenantOption
    isDndEnabled: boolean
    onAssign: (covenantId: string) => void
    onOpenDetail: (covenantId: string) => void
  },
  next: {
    covenant: BuilderV2CovenantOption
    isDndEnabled: boolean
    onAssign: (covenantId: string) => void
    onOpenDetail: (covenantId: string) => void
  },
): boolean {
  return (
    previous.isDndEnabled === next.isDndEnabled &&
    previous.onAssign === next.onAssign &&
    previous.onOpenDetail === next.onOpenDetail &&
    areCovenantOptionsEqual(previous.covenant, next.covenant)
  )
}

const BuilderV2PossePickerTile = memo(function BuilderV2PossePickerTile({
  isDndEnabled,
  onAssign,
  onOpenDetail,
  posse,
}: {
  isDndEnabled: boolean
  onAssign: (posseId: string) => void
  onOpenDetail: (posseId: string) => void
  posse: BuilderV2PosseOption
}) {
  return (
    <PickerTileFrame
      detailLabel={`View ${posse.name} details`}
      onOpenDetail={() => {
        onOpenDetail(posse.id)
      }}
    >
      <PickerTileButton
        aria-label={getPossePickerTileLabel(posse)}
        className='builder-v2-picker-tile builder-v2-picker-tile--posse'
        data-active={posse.isActive}
        data-blocked={posse.blocked}
        dndId={`builder-v2-picker-posse-${posse.id}`}
        getDndData={isDndEnabled ? () => createBuilderV2PickerPosseDragPayload(posse) : undefined}
        isDndEnabled={isDndEnabled}
        data-owned={posse.owned}
        data-recommended={posse.recommended}
        onClick={() => {
          onAssign(posse.id)
        }}
      >
        <PickerTileArt
          alt={`${posse.name} posse`}
          chips={
            <>
              {posse.isActive ? (
                <PickerStateChip tone='recommendation'>Active</PickerStateChip>
              ) : null}
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
      </PickerTileButton>
    </PickerTileFrame>
  )
}, arePossePickerTilePropsEqual)

function arePossePickerTilePropsEqual(
  previous: {
    isDndEnabled: boolean
    onAssign: (posseId: string) => void
    onOpenDetail: (posseId: string) => void
    posse: BuilderV2PosseOption
  },
  next: {
    isDndEnabled: boolean
    onAssign: (posseId: string) => void
    onOpenDetail: (posseId: string) => void
    posse: BuilderV2PosseOption
  },
): boolean {
  return (
    previous.isDndEnabled === next.isDndEnabled &&
    previous.onAssign === next.onAssign &&
    previous.onOpenDetail === next.onOpenDetail &&
    arePosseOptionsEqual(previous.posse, next.posse)
  )
}

interface PickerTileButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  dndId: string
  getDndData?: () => BuilderV2DragPayload
  isDndEnabled: boolean
}

function PickerTileFrame({
  children,
  detailLabel,
  onOpenDetail,
}: {
  children: ReactNode
  detailLabel: string
  onOpenDetail: () => void
}) {
  return (
    <div className='builder-v2-picker-tile-frame'>
      {children}
      <button
        aria-label={detailLabel}
        className='builder-v2-picker-detail-button'
        onClick={(event) => {
          event.preventDefault()
          event.stopPropagation()
          onOpenDetail()
        }}
        title={detailLabel}
        type='button'
      >
        <FaCircleInfo aria-hidden />
      </button>
    </div>
  )
}

function PickerTileButton({
  children,
  dndId,
  getDndData,
  isDndEnabled,
  ...buttonProps
}: PickerTileButtonProps) {
  if (isDndEnabled && getDndData) {
    return (
      <DraggablePickerTileButton dndId={dndId} getDndData={getDndData} {...buttonProps}>
        {children}
      </DraggablePickerTileButton>
    )
  }

  return (
    <button type='button' {...buttonProps}>
      {children}
    </button>
  )
}

function DraggablePickerTileButton({
  children,
  dndId,
  getDndData,
  ...buttonProps
}: Omit<PickerTileButtonProps, 'getDndData' | 'isDndEnabled'> & {
  getDndData: () => BuilderV2DragPayload
}) {
  const {listeners, setNodeRef} = useDraggable({
    id: dndId,
    data: getDndData(),
  })

  return (
    <button ref={setNodeRef} type='button' {...buttonProps} {...listeners}>
      {children}
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
          className={
            isDimmed
              ? 'builder-v2-picker-tile-image builder-v2-picker-tile-image--dimmed'
              : 'builder-v2-picker-tile-image'
          }
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

function getAwakenerPickerTileLabel(awakener: BuilderV2AwakenerOption): string {
  return joinAccessibleParts([
    awakener.displayName,
    `Level ${String(awakener.level)}`,
    formatEnlightenLabel(awakener.enlightenLevel),
    awakener.owned ? null : 'Unowned',
    formatInUseLabel(awakener.inUseLabel),
    awakener.blockReason ? `Blocked: ${awakener.blockReason}` : null,
  ])
}

function getWheelPickerTileLabel(wheel: BuilderV2WheelOption): string {
  const recommendedMainstatLabel = wheel.recommendedMainstatKey
    ? getMainstatByKey(wheel.recommendedMainstatKey)?.label
    : null

  return joinAccessibleParts([
    wheel.name,
    wheel.rarity,
    wheel.mainstat,
    formatEnlightenLabel(wheel.enlightenLevel),
    wheel.owned ? null : 'Unowned',
    formatInUseLabel(wheel.inUseLabel),
    wheel.recommendationLabel ? `Recommended ${wheel.recommendationLabel}` : null,
    recommendedMainstatLabel ? `Recommended mainstat ${recommendedMainstatLabel}` : null,
  ])
}

function getCovenantPickerTileLabel(covenant: BuilderV2CovenantOption): string {
  return joinAccessibleParts([
    covenant.name,
    covenant.inUse ? 'In use' : null,
    covenant.recommendationLabel ? `Recommended ${covenant.recommendationLabel}` : null,
  ])
}

function getPossePickerTileLabel(posse: BuilderV2PosseOption): string {
  return joinAccessibleParts([
    posse.name,
    posse.realm,
    getPosseAccessibleStatus(posse),
    posse.recommended && !posse.statusLabel ? 'Recommended' : null,
  ])
}

function formatInUseLabel(label: string | null): string | null {
  return label ? `In use by ${label}` : null
}

function getPosseAccessibleStatus(posse: BuilderV2PosseOption): string | null {
  if (posse.isActive) {
    return 'Active'
  }
  if (posse.blocked && posse.statusLabel) {
    return `In use by ${posse.statusLabel}`
  }
  if (!posse.owned) {
    return 'Unowned'
  }
  return posse.statusLabel
}

function joinAccessibleParts(parts: (string | null | undefined)[]): string {
  return parts.filter(isPresent).join(', ')
}

function areWheelOptionsEqual(previous: BuilderV2WheelOption, next: BuilderV2WheelOption): boolean {
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

function areAwakenerOptionsEqual(
  previous: BuilderV2AwakenerOption,
  next: BuilderV2AwakenerOption,
): boolean {
  return (
    previous.id === next.id &&
    previous.name === next.name &&
    previous.displayName === next.displayName &&
    previous.realm === next.realm &&
    previous.portraitSrc === next.portraitSrc &&
    previous.inUse === next.inUse &&
    previous.inUseLabel === next.inUseLabel &&
    previous.owned === next.owned &&
    previous.level === next.level &&
    previous.enlightenLevel === next.enlightenLevel &&
    previous.blocked === next.blocked &&
    previous.blockReason === next.blockReason
  )
}

function areCovenantOptionsEqual(
  previous: BuilderV2CovenantOption,
  next: BuilderV2CovenantOption,
): boolean {
  return (
    previous.id === next.id &&
    previous.name === next.name &&
    previous.assetSrc === next.assetSrc &&
    previous.inUse === next.inUse &&
    previous.recommended === next.recommended &&
    previous.recommendationLabel === next.recommendationLabel
  )
}

function arePosseOptionsEqual(previous: BuilderV2PosseOption, next: BuilderV2PosseOption): boolean {
  return (
    previous.id === next.id &&
    previous.name === next.name &&
    previous.realm === next.realm &&
    previous.assetSrc === next.assetSrc &&
    previous.inUse === next.inUse &&
    previous.isActive === next.isActive &&
    previous.owned === next.owned &&
    previous.recommended === next.recommended &&
    previous.blocked === next.blocked &&
    previous.statusLabel === next.statusLabel
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
