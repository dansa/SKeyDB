import { DndContext, DragOverlay } from '@dnd-kit/core'
import { useEffect, useMemo, useRef, useState } from 'react'
import { AwakenerCard } from './builder/AwakenerCard'
import { allAwakeners, awakenerByName, initialTeamSlots } from './builder/constants'
import { ActiveTeamHeader } from './builder/ActiveTeamHeader'
import { BuilderToast } from './builder/BuilderToast'
import { PickerAwakenerGhost, TeamCardGhost } from './builder/DragGhosts'
import { PickerDropZone } from './builder/PickerDropZone'
import { PickerAwakenerTile } from './builder/PickerAwakenerTile'
import {
  assignAwakenerToFirstEmptySlot,
  assignAwakenerToSlot,
  clearSlotAssignment,
  getTeamFactionSet,
  type TeamStateViolationCode,
  swapSlotAssignments,
} from './builder/team-state'
import type { TeamSlot } from './builder/types'
import { PICKER_DROP_ZONE_ID, useBuilderDnd } from './builder/useBuilderDnd'
import { formatAwakenerNameForUi } from '../domain/name-format'
import { searchAwakeners } from '../domain/awakeners-search'
import { getPosseAssetBySlug } from '../domain/posse-assets'
import { searchPosses } from '../domain/posses-search'
import { getPosses } from '../domain/posses'

function normalizeAwakenerNameKey(name: string): string {
  return name.trim().toLowerCase()
}

type PickerTab = 'awakeners' | 'wheels' | 'posses' | 'covenants'
type AwakenerFilter = 'ALL' | 'AEQUOR' | 'CARO' | 'CHAOS' | 'ULTRA'
type PosseFilter = 'ALL' | 'FADED_LEGACY' | 'AEQUOR' | 'CARO' | 'CHAOS' | 'ULTRA'

const pickerTabs: Array<{ id: PickerTab; label: string }> = [
  { id: 'awakeners', label: 'Awakeners' },
  { id: 'wheels', label: 'Wheels' },
  { id: 'posses', label: 'Posses' },
  { id: 'covenants', label: 'Covenants' },
]

const awakenerFilterTabs: Array<{ id: AwakenerFilter; label: string }> = [
  { id: 'ALL', label: 'All' },
  { id: 'AEQUOR', label: 'Aequor' },
  { id: 'CARO', label: 'Caro' },
  { id: 'CHAOS', label: 'Chaos' },
  { id: 'ULTRA', label: 'Ultra' },
]

const posseFilterTabs: Array<{ id: PosseFilter; label: string }> = [
  { id: 'ALL', label: 'All' },
  { id: 'FADED_LEGACY', label: 'Faded Legacy' },
  { id: 'AEQUOR', label: 'Aequor' },
  { id: 'CARO', label: 'Caro' },
  { id: 'CHAOS', label: 'Chaos' },
  { id: 'ULTRA', label: 'Ultra' },
]

export function BuilderPage() {
  const [teamSlots, setTeamSlots] = useState<TeamSlot[]>(initialTeamSlots)
  const [pickerTab, setPickerTab] = useState<PickerTab>('awakeners')
  const [awakenerFilter, setAwakenerFilter] = useState<AwakenerFilter>('ALL')
  const [posseFilter, setPosseFilter] = useState<PosseFilter>('ALL')
  const [pickerSearchByTab, setPickerSearchByTab] = useState<Record<PickerTab, string>>({
    awakeners: '',
    wheels: '',
    posses: '',
    covenants: '',
  })
  const [activePosseId, setActivePosseId] = useState<string | undefined>(undefined)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const toastTimeoutRef = useRef<number | null>(null)

  const pickerAwakeners = useMemo(
    () =>
      [...allAwakeners].sort((left, right) =>
        formatAwakenerNameForUi(left.name).localeCompare(formatAwakenerNameForUi(right.name)),
      ),
    [],
  )
  const pickerPosses = useMemo(
    () =>
      [...getPosses()].sort((left, right) =>
        left.name.localeCompare(right.name),
      ),
    [],
  )
  const activePosse = useMemo(
    () => pickerPosses.find((posse) => posse.id === activePosseId),
    [activePosseId, pickerPosses],
  )
  const activePosseAsset = activePosse ? getPosseAssetBySlug(activePosse.assetSlug) : undefined
  const activeSearchQuery = pickerSearchByTab[pickerTab]

  const searchedAwakeners = useMemo(
    () => searchAwakeners(pickerAwakeners, pickerSearchByTab.awakeners),
    [pickerAwakeners, pickerSearchByTab.awakeners],
  )

  const filteredAwakeners = useMemo(() => {
    if (awakenerFilter === 'ALL') {
      return searchedAwakeners
    }
    return searchedAwakeners.filter((awakener) => awakener.faction.trim().toUpperCase() === awakenerFilter)
  }, [awakenerFilter, searchedAwakeners])

  const searchedPosses = useMemo(
    () => searchPosses(pickerPosses, pickerSearchByTab.posses),
    [pickerPosses, pickerSearchByTab.posses],
  )

  const filteredPosses = useMemo(() => {
    if (posseFilter === 'ALL') {
      return searchedPosses
    }
    if (posseFilter === 'FADED_LEGACY') {
      return searchedPosses.filter((posse) => posse.isFadedLegacy)
    }
    return searchedPosses.filter(
      (posse) => !posse.isFadedLegacy && posse.faction.trim().toUpperCase() === posseFilter,
    )
  }, [posseFilter, searchedPosses])

  const teamFactionSet = useMemo(() => getTeamFactionSet(teamSlots), [teamSlots])
  const usedAwakenerNames = useMemo(
    () =>
      new Set(
        teamSlots
          .map((slot) => slot.awakenerName)
          .filter((name): name is string => Boolean(name))
          .map((name) => normalizeAwakenerNameKey(name)),
      ),
    [teamSlots],
  )

  function notifyViolation(violation: TeamStateViolationCode | undefined) {
    if (violation !== 'TOO_MANY_FACTIONS_IN_TEAM') {
      return
    }

    if (toastTimeoutRef.current) {
      window.clearTimeout(toastTimeoutRef.current)
    }

    setToastMessage('Invalid move: a team can only contain up to 2 factions.')
    toastTimeoutRef.current = window.setTimeout(() => {
      setToastMessage(null)
      toastTimeoutRef.current = null
    }, 2200)
  }

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        window.clearTimeout(toastTimeoutRef.current)
      }
    }
  }, [])

  const slotById = useMemo(() => new Map(teamSlots.map((slot) => [slot.slotId, slot])), [teamSlots])
  const { activeDrag, isRemoveIntent, sensors, handleDragCancel, handleDragEnd, handleDragOver, handleDragStart } = useBuilderDnd({
    onDropPickerAwakener: (awakenerName, targetSlotId) => {
      const result = assignAwakenerToSlot(teamSlots, awakenerName, targetSlotId, awakenerByName)
      setTeamSlots(result.nextSlots)
      notifyViolation(result.violation)
    },
    onDropTeamSlot: (sourceSlotId, targetSlotId) => {
      const result = swapSlotAssignments(teamSlots, sourceSlotId, targetSlotId)
      setTeamSlots(result.nextSlots)
    },
    onDropTeamSlotToPicker: (sourceSlotId) => {
      const result = clearSlotAssignment(teamSlots, sourceSlotId)
      setTeamSlots(result.nextSlots)
    },
  })

  return (
    <DndContext
      onDragCancel={handleDragCancel}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragStart={handleDragStart}
      sensors={sensors}
    >
      <section className="space-y-4">
        <header className="flex items-center justify-between">
          <h2 className="ui-title text-2xl text-amber-100">Builder</h2>
          <p className="text-sm text-slate-300">In-game inspired slot layout</p>
        </header>

        <div className="grid items-start gap-4 lg:grid-cols-[2fr_1fr]">
          <div className="border border-amber-200/35 bg-slate-900/45 p-4">
            <ActiveTeamHeader
              activePosseAsset={activePosseAsset}
              activePosseName={activePosse?.name}
              onOpenPossePicker={() => setPickerTab('posses')}
              teamFactions={Array.from(teamFactionSet)}
            />

            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {teamSlots.map((slot) => (
                <AwakenerCard
                  key={`${slot.slotId}:${slot.awakenerName ?? 'empty'}`}
                  onCardClick={() => setPickerTab('awakeners')}
                  onWheelSlotClick={() => setPickerTab('wheels')}
                  slot={slot}
                />
              ))}
            </div>
          </div>

          <aside className="border border-slate-500/50 bg-slate-900/45 p-4">
            <h3 className="ui-title text-lg text-amber-100">Selection Queue</h3>
            <p className="mt-2 text-sm text-slate-200">Click adds to first empty slot. Drag to deploy or replace.</p>
            <input
              className="mt-3 w-full border border-slate-800/95 bg-slate-950/90 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] focus:border-amber-300/65 focus:bg-slate-950"
              onChange={(event) =>
                setPickerSearchByTab((prev) => ({
                  ...prev,
                  [pickerTab]: event.target.value,
                }))
              }
              placeholder={
                pickerTab === 'awakeners'
                  ? 'Search awakeners (name, faction, aliases)'
                  : pickerTab === 'posses'
                    ? 'Search posses (name, realm, awakener)'
                    : pickerTab === 'wheels'
                      ? 'Wheel search will be wired with wheel data'
                      : 'Covenant search will be wired with covenant data'
              }
              type="search"
              value={activeSearchQuery}
            />
            <div className="mt-3 grid grid-cols-4 gap-1">
              {pickerTabs.map((tab) => (
                <button
                  className={`border px-2 py-1.5 text-[11px] tracking-wide transition-colors ${
                    pickerTab === tab.id
                      ? 'border-amber-200/60 bg-slate-800/80 text-amber-100'
                      : 'border-slate-500/45 bg-slate-900/55 text-slate-300 hover:border-amber-200/45'
                  }`}
                  key={tab.id}
                  onClick={() => setPickerTab(tab.id)}
                  type="button"
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {pickerTab === 'awakeners' ? (
              <div className="mt-2 grid grid-cols-5 gap-1">
                {awakenerFilterTabs.map((filterTab) => (
                  <button
                    className={`border px-1 py-1 text-[10px] uppercase tracking-wide transition-colors ${
                      awakenerFilter === filterTab.id
                        ? 'border-amber-200/60 bg-slate-800/80 text-amber-100'
                        : 'border-slate-500/45 bg-slate-900/55 text-slate-300 hover:border-amber-200/45'
                    }`}
                    key={filterTab.id}
                    onClick={() => setAwakenerFilter(filterTab.id)}
                    type="button"
                  >
                    {filterTab.label}
                  </button>
                ))}
              </div>
            ) : null}

            {pickerTab === 'posses' ? (
              <div className="mt-2 grid grid-cols-3 gap-1">
                {posseFilterTabs.map((filterTab) => (
                  <button
                    className={`border px-1 py-1 text-[10px] uppercase tracking-wide transition-colors ${
                      posseFilter === filterTab.id
                        ? 'border-amber-200/60 bg-slate-800/80 text-amber-100'
                        : 'border-slate-500/45 bg-slate-900/55 text-slate-300 hover:border-amber-200/45'
                    }`}
                    key={filterTab.id}
                    onClick={() => setPosseFilter(filterTab.id)}
                    type="button"
                  >
                    {filterTab.label}
                  </button>
                ))}
              </div>
            ) : null}

            <PickerDropZone className="mt-3 max-h-[34rem] overflow-auto pr-1" id={PICKER_DROP_ZONE_ID}>
              {pickerTab === 'awakeners' ? (
                <div className="grid grid-cols-4 gap-1.5">
                  {filteredAwakeners.map((awakener) => (
                    <PickerAwakenerTile
                      awakenerName={awakener.name}
                      faction={awakener.faction}
                      isFactionBlocked={teamFactionSet.size >= 2 && !teamFactionSet.has(awakener.faction.trim().toUpperCase())}
                      isInUse={usedAwakenerNames.has(normalizeAwakenerNameKey(awakener.name))}
                      key={awakener.name}
                      onClick={() => {
                        const result = assignAwakenerToFirstEmptySlot(teamSlots, awakener.name, awakenerByName)
                        setTeamSlots(result.nextSlots)
                        notifyViolation(result.violation)
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="border border-slate-500/45 bg-slate-900/55 p-3 text-sm text-slate-300">
                  {pickerTab === 'wheels' ? (
                    <p>Wheel picker scaffold is ready. Data + filtering wiring comes next.</p>
                  ) : null}
                  {pickerTab === 'posses' ? (
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        className={`border p-1 text-left transition-colors ${
                          !activePosseId
                            ? 'border-amber-200/60 bg-slate-800/80 text-amber-100'
                            : 'border-slate-500/45 bg-slate-900/55 text-slate-300 hover:border-amber-200/45'
                        }`}
                        onClick={() => setActivePosseId(undefined)}
                        type="button"
                      >
                        <div className="aspect-square overflow-hidden border border-slate-400/35 bg-slate-900/70">
                          <span className="builder-disabled-icon">
                            <span className="builder-disabled-icon__glyph" />
                          </span>
                        </div>
                        <p className="mt-1 truncate text-[11px] text-slate-200">Not Set</p>
                      </button>

                      {filteredPosses.map((posse) => {
                        const posseAsset = getPosseAssetBySlug(posse.assetSlug)
                        const isActive = activePosseId === posse.id

                        return (
                          <button
                            className={`border p-1 text-left transition-colors ${
                              isActive
                                ? 'border-amber-200/60 bg-slate-800/80'
                                : 'border-slate-500/45 bg-slate-900/55 hover:border-amber-200/45'
                            }`}
                            key={posse.id}
                            onClick={() => setActivePosseId(posse.id)}
                            type="button"
                          >
                            <div className="aspect-square overflow-hidden border border-slate-400/35 bg-slate-900/70">
                              {posseAsset ? (
                                <img
                                  alt={`${posse.name} posse`}
                                  className="h-full w-full object-cover"
                                  draggable={false}
                                  src={posseAsset}
                                />
                              ) : (
                                <span className="relative block h-full w-full">
                                  <span className="sigil-placeholder" />
                                </span>
                              )}
                            </div>
                            <p className={`mt-1 truncate text-[11px] ${isActive ? 'text-amber-100' : 'text-slate-200'}`}>
                              {posse.name}
                            </p>
                          </button>
                        )
                      })}
                    </div>
                  ) : null}
                  {pickerTab === 'covenants' ? (
                    <p>Covenant picker scaffold is ready. Data wiring + filters comes next.</p>
                  ) : null}
                </div>
              )}
            </PickerDropZone>
          </aside>
        </div>
      </section>

      <DragOverlay dropAnimation={null}>
        {activeDrag?.kind === 'picker-awakener' ? <PickerAwakenerGhost awakenerName={activeDrag.awakenerName} /> : null}
        {activeDrag?.kind === 'team-slot' ? (
          <TeamCardGhost removeIntent={isRemoveIntent} slot={slotById.get(activeDrag.slotId)} />
        ) : null}
      </DragOverlay>
      <BuilderToast message={toastMessage} />
    </DndContext>
  )
}
