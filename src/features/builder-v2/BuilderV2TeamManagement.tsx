import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'

import {rectSortingStrategy, SortableContext, useSortable} from '@dnd-kit/sortable'
import {CSS as DndCss} from '@dnd-kit/utilities'
import {FaChevronDown, FaChevronUp} from 'react-icons/fa6'
import {FiEdit2, FiRotateCcw, FiTrash2, FiUpload} from 'react-icons/fi'

import {getRealmAccent, getRealmLabel} from '@/domain/realms'

import type {TeamTemplateId} from '../builder/team-collection'
import type {TeamPreviewMode, WheelSlotIndex} from '../builder/types'
import {
  createBuilderV2TeamSortDragPayload,
  type BuilderV2TeamDragPreviewDescriptor,
} from './builder-v2-dnd'
import {useBuilderV2DndEnabled} from './BuilderV2DndCapability'
import {formatBuilderV2EnlightenLabel} from './BuilderV2EnlightenLabel'
import type {
  BuilderV2TeamSummary,
  BuilderV2TeamSummaryCovenant,
  BuilderV2TeamSummarySlot,
  BuilderV2TeamSummaryWheel,
} from './BuilderV2ModelTypes'

interface BuilderV2TeamManagementProps {
  canAddTeam: boolean
  editingTeamId: string | null
  editingTeamName: string
  maxTeams: number
  teamPreviewMode: TeamPreviewMode
  teams: BuilderV2TeamSummary[]
  utilityActions?: ReactNode
  variant?: 'desktop' | 'adaptive' | 'mobile'
  onTeamActivated?: () => void
  onAddTeam: () => void
  onBeginTeamRename: (teamId: string) => void
  onCancelTeamRename: () => void
  onCommitTeamRename: (teamId: string) => void
  onMoveTeamDown: (teamId: string) => void
  onMoveTeamUp: (teamId: string) => void
  onRequestApplyTeamTemplate: (templateId: TeamTemplateId) => void
  onRequestDeleteTeam: (teamId: string) => void
  onRequestExportTeam: (teamId: string) => void
  onRequestResetTeam: (teamId: string) => void
  onRequestEditTeamPosse?: (team: BuilderV2TeamSummary, restoreTarget: HTMLElement | null) => void
  onRequestEditTeamSlot?: (
    team: BuilderV2TeamSummary,
    slot: BuilderV2TeamSummarySlot,
    restoreTarget: HTMLElement | null,
    target?: BuilderV2TeamSlotEditTarget,
  ) => void
  onSetActiveTeam: (teamId: string) => void
  onSetEditingTeamName: (nextName: string) => void
  onTeamPreviewModeChange: (nextMode: TeamPreviewMode) => void
}

const teamPreviewModeOptions = [
  {value: 'compact', label: 'Compact'},
  {value: 'expanded', label: 'Expanded'},
] as const

export type BuilderV2TeamSlotEditTarget =
  | {kind: 'awakener'}
  | {kind: 'wheel'; wheelIndex: WheelSlotIndex}
  | {kind: 'covenant'}

const teamSortTransition = {
  duration: 180,
  easing: 'cubic-bezier(0.2, 0, 0, 1)',
} as const
const TEAM_MANAGEMENT_WIDE_BREAKPOINT_REM = 42.25

export const BuilderV2TeamManagement = memo(function BuilderV2TeamManagement({
  canAddTeam,
  editingTeamId,
  editingTeamName,
  maxTeams,
  teamPreviewMode,
  teams,
  utilityActions,
  variant = 'desktop',
  onTeamActivated,
  onAddTeam,
  onBeginTeamRename,
  onCancelTeamRename,
  onCommitTeamRename,
  onMoveTeamDown,
  onMoveTeamUp,
  onRequestApplyTeamTemplate,
  onRequestDeleteTeam,
  onRequestEditTeamPosse,
  onRequestEditTeamSlot,
  onRequestExportTeam,
  onRequestResetTeam,
  onSetActiveTeam,
  onSetEditingTeamName,
  onTeamPreviewModeChange,
}: BuilderV2TeamManagementProps) {
  const [setSectionNode, isWideLayout] = useTeamManagementWideLayout()
  const isDndEnabled = useBuilderV2DndEnabled()
  const isTeamSortingEnabled = variant !== 'mobile' && isDndEnabled && teams.length > 1
  const sortableTeamIds = useMemo(() => teams.map((team) => team.id), [teams])
  const teamRows = teams.map((team, index) => {
    const rowProps: TeamManagementRowProps = {
      editingTeamId,
      editingTeamName,
      index,
      isLast: index === teams.length - 1,
      onTeamActivated,
      onBeginTeamRename,
      onCancelTeamRename,
      onCommitTeamRename,
      onMoveTeamDown,
      onMoveTeamUp,
      onRequestDeleteTeam,
      onRequestEditTeamPosse,
      onRequestEditTeamSlot,
      onRequestExportTeam,
      onRequestResetTeam,
      onSetActiveTeam,
      onSetEditingTeamName,
      previewMode: teamPreviewMode,
      teamsCount: teams.length,
      team,
      variant,
    }

    return isTeamSortingEnabled ? (
      <SortableTeamManagementRow key={team.id} {...rowProps} />
    ) : (
      <TeamManagementRow key={team.id} {...rowProps} />
    )
  })

  return (
    <section
      aria-label='Builder V2 team management'
      className={`builder-v2-panel builder-v2-team-management builder-v2-team-management--${variant} builder-v2-team-management--preview-${teamPreviewMode} ${
        isTeamSortingEnabled ? 'builder-v2-team-management--sortable' : ''
      } ${isWideLayout ? 'builder-v2-team-management--wide' : ''}`}
      ref={setSectionNode}
    >
      <div className='builder-v2-team-management-header'>
        <div className='builder-v2-team-management-identity'>
          <div className='builder-v2-team-management-title-row'>
            <h2 className='ui-title'>Teams</h2>{' '}
            <span className='builder-v2-team-management-count'>
              {teams.length} / {maxTeams}
            </span>
          </div>
        </div>

        <div className='builder-v2-team-management-toolbar'>
          <fieldset className='builder-v2-team-management-mode'>
            <legend className='sr-only'>Team preview mode</legend>
            {teamPreviewModeOptions.map((option) => (
              <button
                aria-pressed={teamPreviewMode === option.value}
                className={`builder-v2-team-management-mode-button ${
                  teamPreviewMode === option.value
                    ? 'builder-v2-team-management-mode-button--active'
                    : ''
                }`}
                key={option.value}
                onClick={() => {
                  onTeamPreviewModeChange(option.value)
                }}
                type='button'
              >
                {option.label}
              </button>
            ))}
          </fieldset>

          <fieldset className='builder-v2-team-management-actions'>
            <legend className='sr-only'>Team template actions</legend>
            <button
              className='builder-v2-team-management-button builder-v2-team-management-button--primary'
              disabled={!canAddTeam}
              onClick={() => {
                onAddTeam()
                onTeamActivated?.()
              }}
              type='button'
            >
              + Add Team
            </button>
            <button
              aria-label='Apply D-Tide 5'
              className='builder-v2-team-management-button'
              onClick={() => {
                onRequestApplyTeamTemplate('DTIDE_5')
              }}
              type='button'
            >
              D-Tide 5
            </button>
            <button
              aria-label='Apply D-Tide 10'
              className='builder-v2-team-management-button'
              onClick={() => {
                onRequestApplyTeamTemplate('DTIDE_10')
              }}
              type='button'
            >
              D-Tide 10
            </button>
          </fieldset>
        </div>
      </div>

      {utilityActions ? (
        <div className='builder-v2-team-management-utility'>
          <span className='builder-v2-team-management-utility-label'>Import / Export</span>
          {utilityActions}
        </div>
      ) : null}

      <div className='builder-v2-team-management-list'>
        {isTeamSortingEnabled ? (
          <SortableContext items={sortableTeamIds} strategy={rectSortingStrategy}>
            {teamRows}
          </SortableContext>
        ) : (
          teamRows
        )}
      </div>
    </section>
  )
})

function useTeamManagementWideLayout() {
  const observerRef = useRef<ResizeObserver | null>(null)
  const [isWideLayout, setIsWideLayout] = useState(false)
  const setSectionNode = useCallback((element: HTMLElement | null) => {
    observerRef.current?.disconnect()
    observerRef.current = null

    if (!element || typeof ResizeObserver === 'undefined') {
      return
    }

    const wideBreakpointPixels = getTeamManagementWideBreakpointPixels()
    const observer = new ResizeObserver((entries) => {
      const observedWidth = entries.length === 0 ? 0 : entries[0].contentRect.width
      const nextIsWide = observedWidth >= wideBreakpointPixels
      setIsWideLayout((current) => (current === nextIsWide ? current : nextIsWide))
    })

    observer.observe(element)
    observerRef.current = observer
  }, [])

  useEffect(
    () => () => {
      observerRef.current?.disconnect()
    },
    [],
  )

  return [setSectionNode, isWideLayout] as const
}

function getTeamManagementWideBreakpointPixels(): number {
  const rootFontSize = Number.parseFloat(window.getComputedStyle(document.documentElement).fontSize)
  return TEAM_MANAGEMENT_WIDE_BREAKPOINT_REM * (Number.isFinite(rootFontSize) ? rootFontSize : 16)
}

interface TeamManagementRowSortableProps {
  dragListeners?: ReturnType<typeof useSortable>['listeners']
  isDragging?: boolean
  setDragHandleNode?: ReturnType<typeof useSortable>['setActivatorNodeRef']
  setRowNode?: ReturnType<typeof useSortable>['setNodeRef']
  sortableStyle?: CSSProperties
}

interface TeamManagementRowProps {
  editingTeamId: string | null
  editingTeamName: string
  index: number
  isLast: boolean
  onTeamActivated?: () => void
  onBeginTeamRename: (teamId: string) => void
  onCancelTeamRename: () => void
  onCommitTeamRename: (teamId: string) => void
  onMoveTeamDown: (teamId: string) => void
  onMoveTeamUp: (teamId: string) => void
  onRequestDeleteTeam: (teamId: string) => void
  onRequestEditTeamPosse?: (team: BuilderV2TeamSummary, restoreTarget: HTMLElement | null) => void
  onRequestEditTeamSlot?: (
    team: BuilderV2TeamSummary,
    slot: BuilderV2TeamSummarySlot,
    restoreTarget: HTMLElement | null,
  ) => void
  onRequestExportTeam: (teamId: string) => void
  onRequestResetTeam: (teamId: string) => void
  onSetActiveTeam: (teamId: string) => void
  onSetEditingTeamName: (nextName: string) => void
  previewMode: TeamPreviewMode
  teamsCount: number
  team: BuilderV2TeamSummary
  variant: 'desktop' | 'adaptive' | 'mobile'
}

function SortableTeamManagementRow(props: TeamManagementRowProps) {
  const data = useMemo(() => createBuilderV2TeamSortDragPayload(props.team.id), [props.team.id])
  const {isDragging, listeners, setActivatorNodeRef, setNodeRef, transform, transition} =
    useSortable({
      id: props.team.id,
      data,
      transition: teamSortTransition,
    })
  const style = useMemo<CSSProperties>(
    () => ({
      transform: DndCss.Transform.toString(transform),
      transition,
    }),
    [transform, transition],
  )
  return (
    <TeamManagementRow
      {...props}
      dragListeners={listeners}
      isDragging={isDragging}
      setDragHandleNode={setActivatorNodeRef}
      setRowNode={setNodeRef}
      sortableStyle={style}
    />
  )
}

const TeamManagementRow = memo(function TeamManagementRow({
  dragListeners,
  editingTeamId,
  editingTeamName,
  index,
  isDragging = false,
  isLast,
  onTeamActivated,
  onBeginTeamRename,
  onCancelTeamRename,
  onCommitTeamRename,
  onMoveTeamDown,
  onMoveTeamUp,
  onRequestDeleteTeam,
  onRequestEditTeamPosse,
  onRequestEditTeamSlot,
  onRequestExportTeam,
  onRequestResetTeam,
  onSetActiveTeam,
  onSetEditingTeamName,
  previewMode,
  setDragHandleNode,
  setRowNode,
  sortableStyle,
  teamsCount,
  team,
  variant,
}: TeamManagementRowProps & TeamManagementRowSortableProps) {
  const isEditing = editingTeamId === team.id
  const teamIndex = String(index + 1).padStart(2, '0')
  const nameInputRef = useRef<HTMLInputElement | null>(null)
  const [slotsRef, hasSlotsOverflow] = useHorizontalOverflow()

  useEffect(() => {
    if (!isEditing) {
      return
    }

    nameInputRef.current?.focus()
    nameInputRef.current?.select()
  }, [isEditing])

  return (
    <article
      className={`builder-v2-team-management-row ${
        team.isActive ? 'builder-v2-team-management-row--active' : ''
      } ${isDragging ? 'builder-v2-team-management-row--dragging' : ''}`}
      data-team-name={team.name}
      ref={setRowNode}
      style={sortableStyle}
    >
      <div className='builder-v2-team-management-main'>
        <div className='builder-v2-team-management-row-header'>
          {isEditing ? (
            <div className='builder-v2-team-management-select builder-v2-team-management-editing'>
              <span className='builder-v2-team-index'>{teamIndex}</span>
              <span className='builder-v2-team-management-copy'>
                <input
                  aria-label='Team name'
                  className='builder-v2-team-name-input'
                  ref={nameInputRef}
                  onBlur={() => {
                    onCommitTeamRename(team.id)
                  }}
                  onChange={(event) => {
                    onSetEditingTeamName(event.target.value)
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      onCommitTeamRename(team.id)
                    }
                    if (event.key === 'Escape') {
                      event.preventDefault()
                      onCancelTeamRename()
                    }
                  }}
                  value={editingTeamName}
                />
              </span>
            </div>
          ) : (
            <div className='builder-v2-team-management-titlebar'>
              <button
                aria-label={`Select ${team.name}`}
                aria-pressed={team.isActive}
                className='builder-v2-team-management-select'
                onClick={() => {
                  onSetActiveTeam(team.id)
                  onTeamActivated?.()
                }}
                type='button'
              >
                <span className='builder-v2-team-index'>{teamIndex}</span>
                <span className='builder-v2-team-management-copy'>
                  <span className='builder-v2-team-management-name ui-title'>{team.name}</span>
                </span>
              </button>
              <button
                aria-label={`Rename ${team.name}`}
                className='builder-v2-team-management-rename-button'
                onClick={(event) => {
                  event.stopPropagation()
                  onBeginTeamRename(team.id)
                }}
                type='button'
              >
                <FiEdit2 aria-hidden />
              </button>
            </div>
          )}

          <TeamPosseSummary onSelect={onRequestEditTeamPosse} team={team} />
        </div>

        <div className='builder-v2-team-management-row-body'>
          <ul
            aria-label={`${team.name} slots`}
            className='builder-v2-team-management-slots'
            data-overflow-x={hasSlotsOverflow ? 'true' : undefined}
            ref={slotsRef}
          >
            {team.slots.map((slot) => (
              <TeamSlotSummary
                enableLoadoutSelect={variant !== 'mobile'}
                key={slot.slotId}
                onSelect={onRequestEditTeamSlot}
                previewMode={previewMode}
                slot={slot}
                team={team}
              />
            ))}
          </ul>

          <fieldset className='builder-v2-team-management-controls'>
            <legend className='sr-only'>{team.name} actions</legend>
            <span className='builder-v2-team-management-control-cluster builder-v2-team-management-control-cluster--move'>
              {setDragHandleNode ? (
                <button
                  aria-label={`Drag ${team.name} to reorder`}
                  className='builder-v2-team-management-drag-handle'
                  ref={setDragHandleNode}
                  title={`Drag ${team.name} to reorder`}
                  type='button'
                  {...(dragListeners ?? {})}
                >
                  <span aria-hidden className='builder-v2-team-management-drag-grip' />
                </button>
              ) : null}
              <TeamMoveButtons
                index={index}
                isLast={isLast}
                onMoveTeamDown={onMoveTeamDown}
                onMoveTeamUp={onMoveTeamUp}
                team={team}
              />
            </span>
            <span className='builder-v2-team-management-control-cluster builder-v2-team-management-control-cluster--actions'>
              <button
                aria-label={`Export ${team.name}`}
                className='builder-v2-team-management-button builder-v2-team-management-button--export'
                onClick={() => {
                  onRequestExportTeam(team.id)
                }}
                title={`Export ${team.name}`}
                type='button'
              >
                <FiUpload aria-hidden />
                <span>Export</span>
              </button>
              <button
                aria-label={`Reset ${team.name}`}
                className='builder-v2-team-management-button builder-v2-team-management-button--reset'
                onClick={() => {
                  onRequestResetTeam(team.id)
                }}
                title={`Reset ${team.name}`}
                type='button'
              >
                <FiRotateCcw aria-hidden />
                <span>Reset</span>
              </button>
              <button
                aria-label={`Delete ${team.name}`}
                className='builder-v2-team-management-button builder-v2-team-management-button--danger builder-v2-team-management-button--delete'
                disabled={teamsCount <= 1}
                onClick={() => {
                  onRequestDeleteTeam(team.id)
                }}
                title={`Delete ${team.name}`}
                type='button'
              >
                <FiTrash2 aria-hidden />
                <span>Delete</span>
              </button>
            </span>
          </fieldset>
        </div>
      </div>
    </article>
  )
})

function TeamMoveButtons({
  index,
  isLast,
  onMoveTeamDown,
  onMoveTeamUp,
  team,
}: {
  index: number
  isLast: boolean
  onMoveTeamDown: (teamId: string) => void
  onMoveTeamUp: (teamId: string) => void
  team: BuilderV2TeamSummary
}) {
  return (
    <>
      <button
        aria-label={`Move ${team.name} up`}
        className='builder-v2-team-management-order-button'
        disabled={index === 0}
        onClick={() => {
          onMoveTeamUp(team.id)
        }}
        type='button'
      >
        <FaChevronUp aria-hidden />
      </button>
      <button
        aria-label={`Move ${team.name} down`}
        className='builder-v2-team-management-order-button'
        disabled={isLast}
        onClick={() => {
          onMoveTeamDown(team.id)
        }}
        type='button'
      >
        <FaChevronDown aria-hidden />
      </button>
    </>
  )
}

function useHorizontalOverflow() {
  const ref = useRef<HTMLElement | null>(null)
  const scheduledOverflowUpdateRef = useRef<{id: number; type: 'animation' | 'timeout'} | null>(
    null,
  )
  const [hasOverflow, setHasOverflow] = useState(false)

  const updateOverflow = useCallback((element: HTMLElement | null = ref.current) => {
    const nextHasOverflow = element ? element.scrollWidth > element.clientWidth + 1 : false
    setHasOverflow((current) => (current === nextHasOverflow ? current : nextHasOverflow))
  }, [])

  const cancelScheduledOverflowUpdate = useCallback(() => {
    const scheduledUpdate = scheduledOverflowUpdateRef.current
    if (!scheduledUpdate) {
      return
    }

    if (scheduledUpdate.type === 'animation') {
      window.cancelAnimationFrame(scheduledUpdate.id)
    } else {
      window.clearTimeout(scheduledUpdate.id)
    }
    scheduledOverflowUpdateRef.current = null
  }, [])

  const scheduleOverflowUpdate = useCallback(
    (element: HTMLElement | null = ref.current) => {
      if (scheduledOverflowUpdateRef.current) {
        return
      }

      const runUpdate = () => {
        scheduledOverflowUpdateRef.current = null
        updateOverflow(element)
      }

      if (typeof window.requestAnimationFrame === 'function') {
        scheduledOverflowUpdateRef.current = {
          id: window.requestAnimationFrame(runUpdate),
          type: 'animation',
        }
        return
      }

      scheduledOverflowUpdateRef.current = {
        id: window.setTimeout(runUpdate, 16),
        type: 'timeout',
      }
    },
    [updateOverflow],
  )

  const setRef = useCallback(
    (element: HTMLElement | null) => {
      ref.current = element
      cancelScheduledOverflowUpdate()
      updateOverflow(element)
    },
    [cancelScheduledOverflowUpdate, updateOverflow],
  )

  useEffect(() => {
    const element = ref.current
    if (!element) {
      return undefined
    }

    const updateCurrentOverflow = () => {
      scheduleOverflowUpdate(element)
    }

    window.addEventListener('resize', updateCurrentOverflow)

    if (typeof ResizeObserver === 'undefined') {
      return () => {
        window.removeEventListener('resize', updateCurrentOverflow)
        cancelScheduledOverflowUpdate()
      }
    }

    const resizeObserver = new ResizeObserver(updateCurrentOverflow)
    resizeObserver.observe(element)
    for (const child of Array.from(element.children)) {
      resizeObserver.observe(child)
    }

    return () => {
      window.removeEventListener('resize', updateCurrentOverflow)
      resizeObserver.disconnect()
      cancelScheduledOverflowUpdate()
    }
  }, [cancelScheduledOverflowUpdate, scheduleOverflowUpdate])

  return [setRef, hasOverflow] as const
}

function TeamPosseSummary({
  onSelect,
  team,
}: {
  onSelect?: (team: BuilderV2TeamSummary, restoreTarget: HTMLElement | null) => void
  team: BuilderV2TeamSummary
}) {
  const hasPosse = Boolean(team.posseName)
  const className = `builder-v2-team-management-posse ${
    hasPosse ? 'builder-v2-team-management-posse--equipped' : ''
  } ${!team.isPosseOwned ? 'builder-v2-team-management-posse--unowned' : ''} ${
    onSelect ? 'builder-v2-team-management-posse-button' : ''
  }`
  const content = (
    <>
      <span className='builder-v2-team-management-posse-icon' aria-hidden>
        {team.posseAssetSrc ? <img alt='' draggable={false} src={team.posseAssetSrc} /> : null}
      </span>
      <span className='builder-v2-team-management-posse-copy'>
        <span className='builder-v2-label'>Posse</span>
        <span className='builder-v2-team-management-posse-name'>
          {team.posseName ?? 'Not selected'}
        </span>
      </span>
    </>
  )

  if (!onSelect) {
    return <div className={className}>{content}</div>
  }

  return (
    <button
      aria-label={`Edit ${team.name} posse`}
      className={className}
      onClick={(event) => {
        onSelect(team, event.currentTarget)
      }}
      type='button'
    >
      {content}
    </button>
  )
}

export function TeamSlotSummary({
  enableLoadoutSelect,
  onSelect,
  previewMode,
  slot,
  team,
}: {
  onSelect?: (
    team: BuilderV2TeamSummary,
    slot: BuilderV2TeamSummarySlot,
    restoreTarget: HTMLElement | null,
    target?: BuilderV2TeamSlotEditTarget,
  ) => void
  enableLoadoutSelect?: boolean
  previewMode: TeamPreviewMode
  slot: BuilderV2TeamSummarySlot
  team: BuilderV2TeamSummary
}) {
  const compactEnlightenLabel = formatBuilderV2EnlightenLabel(slot.awakener?.enlightenLevel ?? null)
  const hasEnlightenOverflow = Boolean(
    slot.awakener?.enlightenLevel && slot.awakener.enlightenLevel > 3,
  )
  const realmAccent = slot.awakener?.realm ? getRealmAccent(slot.awakener.realm) : undefined
  const style =
    realmAccent && !slot.isEmpty
      ? ({'--team-summary-realm': realmAccent} as CSSProperties)
      : undefined

  return (
    <li
      aria-label={getTeamSlotSummaryLabel(slot)}
      className={`builder-v2-team-management-slot ${
        slot.isEmpty ? 'builder-v2-team-management-slot--empty' : ''
      } ${hasEnlightenOverflow ? 'builder-v2-team-management-slot--enlighten-overflow' : ''}`}
      style={style}
    >
      {onSelect && previewMode === 'expanded' && enableLoadoutSelect ? (
        <>
          <button
            aria-label={`Edit ${team.name} ${slot.label} awakener`}
            className='builder-v2-team-management-slot-button builder-v2-team-management-slot-art-button'
            onClick={(event) => {
              onSelect(team, slot, event.currentTarget, {kind: 'awakener'})
            }}
            type='button'
          >
            <TeamSlotArtSummary
              compactEnlightenLabel={compactEnlightenLabel}
              previewMode={previewMode}
              showCovenant={false}
              slot={slot}
            />
          </button>
          {slot.awakener ? (
            <button
              aria-label={`Edit ${team.name} ${slot.label} covenant`}
              className='builder-v2-team-management-slot-covenant builder-v2-team-management-slot-covenant-button'
              onClick={(event) => {
                onSelect(team, slot, event.currentTarget, {kind: 'covenant'})
              }}
              type='button'
            >
              <TeamSlotCovenantClasp covenant={slot.covenant} />
            </button>
          ) : null}
          <TeamSlotBuildSummary
            onSelectWheel={(wheelIndex, restoreTarget) => {
              onSelect(team, slot, restoreTarget, {kind: 'wheel', wheelIndex})
            }}
            slot={slot}
          />
        </>
      ) : onSelect ? (
        <button
          aria-label={`Edit ${team.name} ${slot.label}`}
          className='builder-v2-team-management-slot-frame builder-v2-team-management-slot-button'
          onClick={(event) => {
            onSelect(team, slot, event.currentTarget)
          }}
          type='button'
        >
          <TeamSlotSummaryContent
            compactEnlightenLabel={compactEnlightenLabel}
            previewMode={previewMode}
            slot={slot}
          />
        </button>
      ) : (
        <span className='builder-v2-team-management-slot-frame'>
          <TeamSlotSummaryContent
            compactEnlightenLabel={compactEnlightenLabel}
            previewMode={previewMode}
            slot={slot}
          />
        </span>
      )}
    </li>
  )
}

export function TeamManagementDragPreview({
  preview,
}: {
  preview: BuilderV2TeamDragPreviewDescriptor
}) {
  const {team} = preview
  const teamIndex = String(preview.index + 1).padStart(2, '0')
  const filledCount = team.slots.filter((slot) => !slot.isEmpty).length

  return (
    <div
      aria-label={`Reordering ${team.name}`}
      className={`builder-v2-drag-preview builder-v2-drag-preview--team builder-v2-drag-preview--team-${preview.previewMode} builder-v2-team-management builder-v2-team-management--preview-${preview.previewMode} ${
        team.isActive ? 'builder-v2-drag-preview--team-active' : ''
      }`}
    >
      <div className='builder-v2-team-drag-preview-header'>
        <span aria-hidden className='builder-v2-team-drag-preview-grip' />
        <span className='builder-v2-team-drag-preview-index'>{teamIndex}</span>
        <span className='builder-v2-team-drag-preview-name'>{team.name}</span>
        <span className='builder-v2-team-drag-preview-count'>{filledCount} / 4</span>
        <span
          className={`builder-v2-team-drag-preview-posse ${
            team.posseAssetSrc ? 'builder-v2-team-drag-preview-posse--filled' : ''
          }`}
          aria-hidden
        >
          {team.posseAssetSrc ? <img alt='' draggable={false} src={team.posseAssetSrc} /> : null}
        </span>
      </div>
      <ul
        className='builder-v2-team-management-slots builder-v2-team-drag-preview-slots'
        aria-hidden
      >
        {team.slots.map((slot) => (
          <TeamSlotSummary
            key={slot.slotId}
            previewMode={preview.previewMode}
            slot={slot}
            team={team}
          />
        ))}
      </ul>
    </div>
  )
}

function TeamSlotSummaryContent({
  compactEnlightenLabel,
  previewMode,
  slot,
}: {
  compactEnlightenLabel: string | null
  previewMode: TeamPreviewMode
  slot: BuilderV2TeamSummarySlot
}) {
  return (
    <>
      <TeamSlotArtSummary
        compactEnlightenLabel={compactEnlightenLabel}
        previewMode={previewMode}
        showCovenant
        slot={slot}
      />

      {previewMode === 'expanded' ? <TeamSlotBuildSummary slot={slot} /> : null}
    </>
  )
}

function TeamSlotArtSummary({
  compactEnlightenLabel,
  previewMode,
  showCovenant,
  slot,
}: {
  compactEnlightenLabel: string | null
  previewMode: TeamPreviewMode
  showCovenant: boolean
  slot: BuilderV2TeamSummarySlot
}) {
  return (
    <span aria-hidden className='builder-v2-team-management-slot-art'>
      {slot.awakener ? (
        <>
          <img
            alt=''
            draggable={false}
            src={
              previewMode === 'expanded'
                ? (slot.awakener.cardSrc ?? slot.awakener.portraitSrc)
                : slot.awakener.portraitSrc
            }
          />
          <span className='builder-v2-team-management-slot-shade' />
          {previewMode === 'expanded' ? (
            <span className='builder-v2-team-management-slot-art-meta'>
              <span className='builder-v2-team-management-slot-art-level'>
                Lv. {String(slot.awakener.level)}
              </span>
              {compactEnlightenLabel ? (
                <span className='builder-v2-team-management-slot-art-enlighten'>
                  {compactEnlightenLabel}
                </span>
              ) : null}
            </span>
          ) : null}
          {showCovenant && previewMode === 'expanded' ? (
            <span className='builder-v2-team-management-slot-covenant'>
              <TeamSlotCovenantClasp covenant={slot.covenant} />
            </span>
          ) : null}
          <span className='builder-v2-team-management-slot-state'>
            {slot.awakener.isSupport ? (
              <span className='builder-v2-team-management-state-chip'>Support</span>
            ) : null}
            {!slot.awakener.isOwned ? (
              <span className='builder-v2-team-management-state-chip builder-v2-team-management-state-chip--danger'>
                Unowned
              </span>
            ) : null}
          </span>
          {previewMode === 'compact' && compactEnlightenLabel ? (
            <span className='builder-v2-team-management-slot-compact-enlighten'>
              <span className='builder-v2-team-management-state-chip'>{compactEnlightenLabel}</span>
            </span>
          ) : null}
        </>
      ) : (
        <span className='builder-v2-team-management-empty-slot'>
          <span className='builder-v2-empty-mark'>+</span>
          <span>Empty</span>
        </span>
      )}
    </span>
  )
}

function TeamSlotCovenantClasp({covenant}: {covenant: BuilderV2TeamSummaryCovenant | null}) {
  return covenant?.assetSrc ? (
    <img alt='' draggable={false} src={covenant.assetSrc} />
  ) : (
    <span aria-hidden className='builder-v2-team-management-slot-covenant-fallback'>
      +
    </span>
  )
}

function TeamSlotBuildSummary({
  onSelectWheel,
  slot,
}: {
  onSelectWheel?: (wheelIndex: WheelSlotIndex, restoreTarget: HTMLElement | null) => void
  slot: BuilderV2TeamSummarySlot
}) {
  return (
    <span className='builder-v2-team-management-slot-build' aria-hidden={!onSelectWheel}>
      <span className='builder-v2-team-management-loadout-row'>
        {slot.wheels.map((wheel, index) => (
          <WheelMiniSummary
            key={`${slot.slotId}-wheel-${String(index)}`}
            onSelect={
              onSelectWheel
                ? (restoreTarget) => {
                    onSelectWheel(index as WheelSlotIndex, restoreTarget)
                  }
                : undefined
            }
            wheel={wheel}
            wheelNumber={index + 1}
          />
        ))}
      </span>
    </span>
  )
}

function WheelMiniSummary({
  onSelect,
  wheel,
  wheelNumber,
}: {
  onSelect?: (restoreTarget: HTMLElement | null) => void
  wheel: BuilderV2TeamSummaryWheel | null
  wheelNumber: number
}) {
  const enlightenLabel = formatBuilderV2EnlightenLabel(wheel?.enlightenLevel ?? null)
  const className = `builder-v2-team-management-loadout-cell builder-v2-team-management-loadout-cell--wheel ${
    wheel && !wheel.isOwned ? 'builder-v2-team-management-loadout-cell--unowned' : ''
  }`
  const content = (
    <>
      {(wheel?.miniAssetSrc ?? wheel?.assetSrc) ? (
        <img alt='' draggable={false} src={wheel.miniAssetSrc ?? wheel.assetSrc} />
      ) : (
        <span>{wheel ? `W${String(wheelNumber)}` : '+'}</span>
      )}
      {enlightenLabel ? (
        <span className='builder-v2-team-management-wheel-enlighten'>{enlightenLabel}</span>
      ) : null}
    </>
  )

  if (!onSelect) {
    return <span className={className}>{content}</span>
  }

  return (
    <button
      aria-label={`Edit wheel ${String(wheelNumber)}`}
      className={`${className} builder-v2-team-management-loadout-button`}
      onClick={(event) => {
        onSelect(event.currentTarget)
      }}
      type='button'
    >
      {content}
    </button>
  )
}

function getTeamSlotSummaryLabel(slot: BuilderV2TeamSummarySlot): string {
  if (!slot.awakener) {
    return `${slot.label}, empty`
  }

  const wheelCount = slot.wheels.filter(Boolean).length
  const wheelNames = slot.wheels
    .filter((wheel): wheel is BuilderV2TeamSummaryWheel => Boolean(wheel))
    .map((wheel) => wheel.name)
    .join(', ')
  const parts = [
    slot.label,
    slot.awakener.displayName,
    getRealmLabel(slot.awakener.realm),
    `level ${String(slot.awakener.level)}`,
    formatBuilderV2EnlightenLabel(slot.awakener.enlightenLevel),
    slot.awakener.isSupport ? 'support' : null,
    !slot.awakener.isOwned ? 'unowned' : null,
    slot.covenant ? `covenant equipped: ${slot.covenant.name}` : null,
    wheelCount > 0
      ? `${String(wheelCount)} ${wheelCount === 1 ? 'wheel' : 'wheels'} equipped: ${wheelNames}`
      : null,
  ]

  return parts.filter(Boolean).join(', ')
}
