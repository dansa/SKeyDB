import { OwnedTogglePill } from '../components/ui/OwnedTogglePill'
import { TogglePill } from '../components/ui/TogglePill'
import { Button } from '../components/ui/Button'
import { CollectionSortControls } from '../components/ui/CollectionSortControls'
import { Toast } from '../components/ui/Toast'
import { useRef } from 'react'
import type { ChangeEvent, WheelEvent } from 'react'
import { FaDownload, FaUpload } from 'react-icons/fa6'
import { getAwakenerCardAsset } from '../domain/awakener-assets'
import { getFactionTint } from '../domain/factions'
import { formatAwakenerNameForUi } from '../domain/name-format'
import { getPosseAssetById } from '../domain/posse-assets'
import { getWheelAssetById } from '../domain/wheel-assets'
import { wheelMainstatFilterOptions } from '../domain/wheel-mainstat-filters'
import { CollectionLevelControls } from './collection/CollectionLevelControls'
import { AwakenerLevelControl } from './collection/AwakenerLevelControl'
import { OwnedAwakenerBoxExport } from './collection/OwnedAwakenerBoxExport'
import { OwnedWheelBoxExport } from './collection/OwnedWheelBoxExport'
import { useOwnedAwakenerBoxEntries } from './collection/useOwnedAwakenerBoxEntries'
import { useOwnedWheelBoxEntries } from './collection/useOwnedWheelBoxEntries'
import { useGlobalCollectionSearchCapture } from './collection/useGlobalCollectionSearchCapture'
import { useCollectionViewModel } from './collection/useCollectionViewModel'
import { useTimedToast } from '../components/ui/useTimedToast'

const collectionTabs = [
  { id: 'awakeners', label: 'Awakeners' },
  { id: 'wheels', label: 'Wheels' },
  { id: 'posses', label: 'Posses' },
] as const

const awakenerFilterTabs = [
  { id: 'ALL', label: 'All' },
  { id: 'AEQUOR', label: 'Aequor' },
  { id: 'CARO', label: 'Caro' },
  { id: 'CHAOS', label: 'Chaos' },
  { id: 'ULTRA', label: 'Ultra' },
] as const

const wheelRarityFilterTabs = [
  { id: 'ALL', label: 'All' },
  { id: 'SSR', label: 'SSR' },
  { id: 'SR', label: 'SR' },
  { id: 'R', label: 'R' },
] as const

const posseFilterTabs = [
  { id: 'ALL', label: 'All' },
  { id: 'FADED_LEGACY', label: 'Faded Legacy' },
  { id: 'AEQUOR', label: 'Aequor' },
  { id: 'CARO', label: 'Caro' },
  { id: 'CHAOS', label: 'Chaos' },
  { id: 'ULTRA', label: 'Ultra' },
] as const

const collectionLabelByTab = {
  awakeners: 'awakeners',
  wheels: 'wheels',
  posses: 'posses',
} as const

export function CollectionPage() {
  const model = useCollectionViewModel()
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const importFileInputRef = useRef<HTMLInputElement | null>(null)
  const { toastMessage, showToast } = useTimedToast({ defaultDurationMs: 3200 })
  const ownedAwakenersForBoxExport = useOwnedAwakenerBoxEntries(model.getAwakenerOwnedLevel, model.getAwakenerLevel)
  const ownedWheelsForBoxExport = useOwnedWheelBoxEntries(model.getWheelOwnedLevel)
  const activeCollectionLabel = collectionLabelByTab[model.tab]
  const activeFilteredCount =
    model.tab === 'awakeners'
      ? model.filteredAwakeners.length
      : model.tab === 'wheels'
        ? model.filteredWheels.length
        : model.filteredPosses.length

  useGlobalCollectionSearchCapture({
    searchInputRef,
    onAppendCharacter: model.appendSearchCharacter,
    onClearSearch: model.clearActiveQuery,
  })

  function swallowOutsideLevelClickIfCardInteraction(event: MouseEvent | PointerEvent) {
    const target = event.target
    if (!(target instanceof Element)) {
      return
    }

    const interactionFrame = target.closest('.collection-card-frame')
    if (!interactionFrame) {
      return
    }

    // Clicking outside level editor but within an awakener card interaction area
    // should commit level edits without also toggling ownership.
    event.preventDefault()
    event.stopPropagation()

    const swallowNextClick = (clickEvent: MouseEvent) => {
      const clickTarget = clickEvent.target
      if (!(clickTarget instanceof Node)) {
        return
      }
      if (!interactionFrame.contains(clickTarget)) {
        return
      }
      clickEvent.preventDefault()
      clickEvent.stopPropagation()
    }

    document.addEventListener('click', swallowNextClick, { capture: true, once: true })
  }

  function handleCollectionCardWheel(
    event: WheelEvent<HTMLElement>,
    kind: 'awakeners' | 'wheels',
    id: string,
    ownedLevel: number | null,
  ) {
    if (!event.shiftKey || ownedLevel === null) {
      return
    }

    const target = event.target
    if (target instanceof Element && target.closest('input, textarea, select')) {
      return
    }

    event.preventDefault()
    if (event.deltaY < 0) {
      model.increaseLevel(kind, id)
      return
    }
    if (event.deltaY > 0) {
      model.decreaseLevel(kind, id)
    }
  }

  function handleSaveToFile() {
    const rawSnapshot = model.exportOwnershipSnapshot()
    const filename = `skeydb-collection-${new Date().toISOString().slice(0, 10)}.json`
    const blob = new Blob([rawSnapshot], { type: 'application/json;charset=utf-8' })
    const objectUrl = URL.createObjectURL(blob)

    const anchor = document.createElement('a')
    anchor.href = objectUrl
    anchor.download = filename
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    URL.revokeObjectURL(objectUrl)

    showToast(`Saved ${filename}`)
  }

  function handleOpenLoadFilePicker() {
    importFileInputRef.current?.click()
  }

  async function handleLoadFromFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    try {
      const rawSnapshot = await file.text()
      const parsed = model.importOwnershipSnapshot(rawSnapshot)
      if (!parsed.ok) {
        const errorMessage =
          parsed.error === 'invalid_json'
            ? 'Load failed: file is not valid JSON.'
            : parsed.error === 'unsupported_version'
              ? 'Load failed: snapshot version is unsupported.'
              : 'Load failed: file does not match collection snapshot format.'
        showToast(errorMessage)
      } else {
        showToast(`Loaded ${file.name}`)
      }
    } catch {
      showToast('Load failed: could not read file.')
    } finally {
      event.target.value = ''
    }
  }

  return (
    <section className="space-y-4">
      <header className="flex items-center justify-between">
        <h2 className="ui-title text-2xl text-amber-100">Collection</h2>
      </header>

      <div className="grid items-start gap-4 lg:grid-cols-[260px_1fr]">
        <aside className="flex min-h-[560px] flex-col border border-slate-500/45 bg-slate-900/45 p-3">
          <h3 className="ui-title text-lg text-amber-100">Ownership</h3>
          <p className="mt-1 text-xs text-slate-300">Track owned state and dupe levels.</p>

          <div className="mt-3 grid grid-cols-3 gap-1">
            {collectionTabs.map((entry) => (
              <button
                className={`border px-2 py-1.5 text-[11px] tracking-wide transition-colors ${
                  model.tab === entry.id
                    ? 'border-amber-200/60 bg-slate-800/80 text-amber-100'
                    : 'border-slate-500/45 bg-slate-900/55 text-slate-300 hover:border-amber-200/45'
                }`}
                key={entry.id}
                onClick={() => model.setTab(entry.id)}
                type="button"
              >
                {entry.label}
              </button>
            ))}
          </div>

          <div className="mt-2 flex items-center justify-between gap-3 text-xs text-slate-300">
            <span>Display Unowned</span>
            <TogglePill
              ariaLabel="Toggle display unowned"
              checked={model.displayUnowned}
              className="ownership-pill-builder"
              offLabel="Off"
              onChange={model.setDisplayUnowned}
              onLabel="On"
              variant="flat"
            />
          </div>

          <input
            className="mt-2 w-full border border-slate-800/95 bg-slate-950/90 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-amber-300/65 focus:bg-slate-950"
            onChange={(event) => model.setQuery(event.target.value)}
            placeholder={
              model.tab === 'awakeners'
                ? 'Search awakeners (name, faction, aliases)'
                : model.tab === 'wheels'
                  ? 'Search wheels (name, rarity, faction, awakener, main stat)'
                  : 'Search posses (name, realm, awakener)'
            }
            ref={searchInputRef}
            type="search"
            value={model.activeQuery}
          />

          {model.tab === 'awakeners' ? (
            <div className="mt-2 space-y-2">
              <div className="grid grid-cols-5 gap-1">
                {awakenerFilterTabs.map((entry) => (
                  <button
                    className={`border compact-filter-chip transition-colors ${
                      model.awakenerFilter === entry.id
                        ? 'border-amber-200/60 bg-slate-800/80 text-amber-100'
                        : 'border-slate-500/45 bg-slate-900/55 text-slate-300 hover:border-amber-200/45'
                    }`}
                    key={entry.id}
                    onClick={() => model.setAwakenerFilter(entry.id)}
                    type="button"
                  >
                    {entry.label}
                  </button>
                ))}
              </div>
              <div className="space-y-1">
                <CollectionSortControls
                  groupByFaction={model.awakenerSortGroupByFaction}
                  groupByFactionAriaLabel="Toggle grouping awakeners by faction"
                  onGroupByFactionChange={model.setAwakenerSortGroupByFaction}
                  onSortDirectionToggle={model.toggleAwakenerSortDirection}
                  onSortKeyChange={model.setAwakenerSortKey}
                  sortDirection={model.awakenerSortDirection}
                  sortKey={model.awakenerSortKey}
                  sortDirectionAriaLabel="Toggle collection awakener sort direction"
                  sortSelectAriaLabel="Collection awakener sort key"
                />
              </div>
            </div>
          ) : null}

          {model.tab === 'wheels' ? (
            <>
              <div className="mt-2 grid grid-cols-4 gap-1">
                {wheelRarityFilterTabs.map((entry) => (
                  <button
                    className={`border compact-filter-chip transition-colors ${
                      model.wheelRarityFilter === entry.id
                        ? 'border-amber-200/60 bg-slate-800/80 text-amber-100'
                        : 'border-slate-500/45 bg-slate-900/55 text-slate-300 hover:border-amber-200/45'
                    }`}
                    key={entry.id}
                    onClick={() => model.setWheelRarityFilter(entry.id)}
                    type="button"
                  >
                    {entry.label}
                  </button>
                ))}
              </div>
              <div className="mt-1.5 grid grid-cols-9 gap-1">
                {wheelMainstatFilterOptions.map((entry) => (
                  <button
                    aria-label={`Filter wheels by ${entry.label}`}
                    className={`flex h-7 items-center justify-center border transition-colors ${
                      model.wheelMainstatFilter === entry.id
                        ? 'border-amber-200/60 bg-slate-800/80 text-amber-100'
                        : 'border-slate-500/45 bg-slate-900/55 text-slate-300 hover:border-amber-200/45'
                    }`}
                    key={entry.id}
                    onClick={() => model.setWheelMainstatFilter(entry.id)}
                    title={entry.label}
                    type="button"
                  >
                    {entry.iconAsset ? (
                      <img
                        alt={entry.label}
                        className="h-[17px] w-[17px] object-contain opacity-95"
                        draggable={false}
                        src={entry.iconAsset}
                      />
                    ) : (
                      <span className="text-[10px] uppercase tracking-wide">All</span>
                    )}
                  </button>
                ))}
              </div>
            </>
          ) : null}

          {model.tab === 'posses' ? (
            <div className="mt-2 grid grid-cols-3 gap-1">
              {posseFilterTabs.map((entry) => (
                <button
                  className={`border compact-filter-chip transition-colors ${
                    model.posseFilter === entry.id
                      ? 'border-amber-200/60 bg-slate-800/80 text-amber-100'
                      : 'border-slate-500/45 bg-slate-900/55 text-slate-300 hover:border-amber-200/45'
                  }`}
                  key={entry.id}
                  onClick={() => model.setPosseFilter(entry.id)}
                  type="button"
                >
                  {entry.label}
                </button>
              ))}
            </div>
          ) : null}

          <div className="mt-2 border-t border-slate-500/45 pt-2">
            <div className="grid grid-cols-2 gap-1">
              <p className="col-span-2 text-[10px] uppercase tracking-wide text-slate-400">
                {`Quick-toggle filtered ${activeCollectionLabel} (${activeFilteredCount}):`}
              </p>
              <Button
                className="px-2 py-1 text-[10px] uppercase tracking-wide hover:border-emerald-300/55 hover:text-emerald-200"
                disabled={activeFilteredCount === 0}
                onClick={model.markFilteredOwned}
                type="button"
              >
                Set Owned
              </Button>
              <Button
                className="px-2 py-1 text-[10px] uppercase tracking-wide hover:border-rose-300/55 hover:text-rose-200"
                disabled={activeFilteredCount === 0}
                onClick={model.markFilteredUnowned}
                type="button"
              >
                Set Unowned
              </Button>
            </div>
          </div>

          <div className="mt-auto space-y-1.5 pt-3">
            <input
              accept="application/json,.json"
              className="hidden"
              onChange={handleLoadFromFile}
              ref={importFileInputRef}
              type="file"
            />
            <div className="grid grid-cols-2 gap-1">
              {model.tab === 'awakeners' ? (
                <OwnedAwakenerBoxExport
                  entries={ownedAwakenersForBoxExport}
                  onStatusMessage={showToast}
                />
              ) : null}
              {model.tab === 'wheels' ? (
                <OwnedWheelBoxExport entries={ownedWheelsForBoxExport} onStatusMessage={showToast} />
              ) : null}
              <Button
                className="px-2 py-1 text-[10px] uppercase tracking-wide"
                onClick={handleSaveToFile}
                type="button"
              >
                <span className="inline-flex items-center gap-1">
                  <FaDownload aria-hidden className="text-[9px]" />
                  <span>Save to File</span>
                </span>
              </Button>
              <Button
                className="px-2 py-1 text-[10px] uppercase tracking-wide"
                onClick={handleOpenLoadFilePicker}
                type="button"
              >
                <span className="inline-flex items-center gap-1">
                  <FaUpload aria-hidden className="text-[9px]" />
                  <span>Load from File</span>
                </span>
              </Button>
            </div>
          </div>
        </aside>

        <div className="border overflow-hidden max-h-[calc(100dvh-11.5rem)] border-slate-500/45 bg-slate-900/45 p-2">
          <div className="collection-scrollbar max-h-[calc(100dvh-11.5rem)] min-h-[560px] overflow-auto pr-1">
          {model.tab === 'awakeners' ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
              {model.filteredAwakeners.map((awakener) => {
                const awakenerId = model.awakenerIdByName.get(awakener.name)
                if (!awakenerId) {
                  return null
                }
                const ownedLevel = model.getAwakenerOwnedLevel(awakener.name)
                const cardAsset = getAwakenerCardAsset(awakener.name)

                return (
                  <article
                    className="collection-item-card group/collection p-1"
                    key={awakener.name}
                  >
                    <div
                      className={`collection-card-frame relative aspect-[25/56] overflow-hidden border border-slate-400/35 bg-slate-900/75 transition-[border-color,box-shadow] duration-150 group-hover/collection:border-amber-200/45 group-hover/collection:shadow-[0_0_0_1px_rgba(251,191,36,0.15)] ${
                        ownedLevel === null ? 'collection-card-frame-unowned' : ''
                      }`}
                      onWheel={(event) => handleCollectionCardWheel(event, 'awakeners', awakenerId, ownedLevel)}
                    >
                      <button
                        aria-label={`Toggle ownership for ${formatAwakenerNameForUi(awakener.name)}`}
                        className="absolute inset-0 z-[13]"
                        onClick={(event) => {
                          if (event.defaultPrevented) {
                            return
                          }
                          model.toggleOwned('awakeners', awakenerId)
                        }}
                        type="button"
                      />
                      {cardAsset ? (
                        <img
                          alt={`${formatAwakenerNameForUi(awakener.name)} card`}
                          className={`collection-card-art h-full w-full object-cover object-top ${ownedLevel === null ? 'builder-picker-art-unowned' : ''}`}
                          draggable={false}
                          src={cardAsset}
                        />
                      ) : (
                        <span className="sigil-placeholder sigil-placeholder-card" />
                      )}
                      <span
                        className="pointer-events-none absolute inset-0 z-10 border"
                        style={{ borderColor: getFactionTint(awakener.faction) }}
                      />
                      <p className="collection-card-title ui-title">
                        {formatAwakenerNameForUi(awakener.name)}
                      </p>
                      <div className="collection-card-controls">
                        {ownedLevel !== null ? (
                          <AwakenerLevelControl
                            disabled={ownedLevel === null}
                            level={model.getAwakenerLevel(awakener.name)}
                            name={formatAwakenerNameForUi(awakener.name)}
                            onCommitOutsideClick={swallowOutsideLevelClickIfCardInteraction}
                            onLevelChange={(nextLevel) => model.setAwakenerLevel(awakener.name, nextLevel)}
                          />
                        ) : null}
                        <CollectionLevelControls
                          onDecrease={() => model.decreaseLevel('awakeners', awakenerId)}
                          onIncrease={() => model.increaseLevel('awakeners', awakenerId)}
                          ownedLevel={ownedLevel}
                        />
                        <OwnedTogglePill
                          className="ownership-pill-full"
                          owned={ownedLevel !== null}
                          onToggle={() => model.toggleOwned('awakeners', awakenerId)}
                        />
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          ) : null}

          {model.tab === 'wheels' ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
              {model.filteredWheels.map((wheel) => {
                const ownedLevel = model.getWheelOwnedLevel(wheel.id)
                const wheelAsset = getWheelAssetById(wheel.id)

                return (
                  <article
                    className="collection-item-card group/collection p-1"
                    key={wheel.id}
                  >
                    <div
                      className={`collection-card-frame relative aspect-[75/113] overflow-hidden border border-slate-400/35 bg-slate-900/75 transition-[border-color,box-shadow] duration-150 group-hover/collection:border-amber-200/45 group-hover/collection:shadow-[0_0_0_1px_rgba(251,191,36,0.15)] ${
                        ownedLevel === null ? 'collection-card-frame-unowned' : ''
                      }`}
                      onWheel={(event) => handleCollectionCardWheel(event, 'wheels', wheel.id, ownedLevel)}
                    >
                      <button
                        aria-label={`Toggle ownership for ${wheel.name}`}
                        className="absolute inset-0 z-[13]"
                        onClick={(event) => {
                          if (event.defaultPrevented) {
                            return
                          }
                          model.toggleOwned('wheels', wheel.id)
                        }}
                        type="button"
                      />
                      {wheelAsset ? (
                        <img
                          alt={`${wheel.name} wheel`}
                          className={`collection-card-art builder-picker-wheel-image h-full w-full object-cover ${ownedLevel === null ? 'builder-picker-art-unowned' : ''}`}
                          draggable={false}
                          src={wheelAsset}
                        />
                      ) : (
                        <span className="sigil-placeholder sigil-placeholder-wheel" />
                      )}
                      <p className="collection-card-title collection-card-title-compact">{wheel.name}</p>
                      <div className="collection-card-controls">
                        <CollectionLevelControls
                          onDecrease={() => model.decreaseLevel('wheels', wheel.id)}
                          onIncrease={() => model.increaseLevel('wheels', wheel.id)}
                          ownedLevel={ownedLevel}
                        />
                        <OwnedTogglePill
                          className="ownership-pill-full"
                          owned={ownedLevel !== null}
                          onToggle={() => model.toggleOwned('wheels', wheel.id)}
                        />
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          ) : null}

          {model.tab === 'posses' ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
              {model.filteredPosses.map((posse) => {
                const ownedLevel = model.getPosseOwnedLevel(posse.id)
                const asset = getPosseAssetById(posse.id)

                return (
                  <article
                    className="collection-item-card group/collection p-1"
                    key={posse.id}
                  >
                    <div
                      className={`collection-card-frame relative aspect-square overflow-hidden border border-slate-400/35 bg-slate-900/75 transition-[border-color,box-shadow] duration-150 group-hover/collection:border-amber-200/45 group-hover/collection:shadow-[0_0_0_1px_rgba(251,191,36,0.15)] ${
                        ownedLevel === null ? 'collection-card-frame-unowned' : ''
                      }`}
                    >
                      <button
                        aria-label={`Toggle ownership for ${posse.name}`}
                        className="absolute inset-0 z-[13]"
                        onClick={(event) => {
                          if (event.defaultPrevented) {
                            return
                          }
                          model.toggleOwned('posses', posse.id)
                        }}
                        type="button"
                      />
                      {asset ? (
                        <img
                          alt={`${posse.name} posse`}
                          className={`collection-card-art h-full w-full object-cover ${ownedLevel === null ? 'builder-picker-art-unowned' : ''}`}
                          draggable={false}
                          src={asset}
                        />
                      ) : (
                        <span className="sigil-placeholder" />
                      )}
                      <p className="collection-card-title collection-card-title-compact">{posse.name}</p>
                    </div>
                    <div className="collection-card-toolbar">
                      <OwnedTogglePill className="ownership-pill-full" owned={ownedLevel !== null} onToggle={() => model.toggleOwned('posses', posse.id)} />
                    </div>
                  </article>
                )
              })}
            </div>
          ) : null}
          </div>
        </div>
      </div>
      <Toast
        className="pointer-events-none fixed right-4 bottom-4 z-[950] border border-amber-200/50 bg-slate-950/92 px-3 py-2 text-sm text-amber-100 shadow-[0_6px_20px_rgba(2,6,23,0.55)]"
        message={toastMessage}
      />
    </section>
  )
}
