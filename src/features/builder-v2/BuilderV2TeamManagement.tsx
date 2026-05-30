import {memo, useCallback, useEffect, useRef, useState, type CSSProperties} from 'react'

import {FaChevronDown, FaChevronUp} from 'react-icons/fa6'
import {FiEdit2, FiRotateCcw, FiTrash2, FiUpload} from 'react-icons/fi'

import {getRealmAccent, getRealmLabel} from '@/domain/realms'

import type {TeamTemplateId} from '../builder/team-collection'
import type {TeamPreviewMode} from '../builder/types'
import {formatBuilderV2EnlightenLabel} from './BuilderV2EnlightenLabel'
import {BuilderV2EnlightenMeter} from './BuilderV2EnlightenMeter'
import type {
  BuilderV2TeamSummary,
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
  onSetActiveTeam: (teamId: string) => void
  onSetEditingTeamName: (nextName: string) => void
  onTeamPreviewModeChange: (nextMode: TeamPreviewMode) => void
}

const teamPreviewModeOptions = [
  {value: 'compact', label: 'Compact'},
  {value: 'expanded', label: 'Expanded'},
] as const

export const BuilderV2TeamManagement = memo(function BuilderV2TeamManagement({
  canAddTeam,
  editingTeamId,
  editingTeamName,
  maxTeams,
  teamPreviewMode,
  teams,
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
  onRequestExportTeam,
  onRequestResetTeam,
  onSetActiveTeam,
  onSetEditingTeamName,
  onTeamPreviewModeChange,
}: BuilderV2TeamManagementProps) {
  return (
    <section
      aria-label='Builder V2 team management'
      className={`builder-v2-panel builder-v2-team-management builder-v2-team-management--${variant} builder-v2-team-management--preview-${teamPreviewMode}`}
    >
      <div className='builder-v2-team-management-header'>
        <div className='builder-v2-team-management-identity'>
          <p className='builder-v2-label'>{variant === 'mobile' ? 'Other Teams' : 'Your Teams'}</p>
          <h2 className='ui-title'>
            {teams.length} / {maxTeams}
          </h2>
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

      <div className='builder-v2-team-management-list'>
        {teams.map((team, index) => (
          <TeamManagementRow
            editingTeamId={editingTeamId}
            editingTeamName={editingTeamName}
            index={index}
            isLast={index === teams.length - 1}
            key={team.id}
            onTeamActivated={onTeamActivated}
            onBeginTeamRename={onBeginTeamRename}
            onCancelTeamRename={onCancelTeamRename}
            onCommitTeamRename={onCommitTeamRename}
            onMoveTeamDown={onMoveTeamDown}
            onMoveTeamUp={onMoveTeamUp}
            onRequestDeleteTeam={onRequestDeleteTeam}
            onRequestExportTeam={onRequestExportTeam}
            onRequestResetTeam={onRequestResetTeam}
            onSetActiveTeam={onSetActiveTeam}
            onSetEditingTeamName={onSetEditingTeamName}
            previewMode={teamPreviewMode}
            teamsCount={teams.length}
            team={team}
            variant={variant}
          />
        ))}
      </div>
    </section>
  )
})

const TeamManagementRow = memo(function TeamManagementRow({
  editingTeamId,
  editingTeamName,
  index,
  isLast,
  onTeamActivated,
  onBeginTeamRename,
  onCancelTeamRename,
  onCommitTeamRename,
  onMoveTeamDown,
  onMoveTeamUp,
  onRequestDeleteTeam,
  onRequestExportTeam,
  onRequestResetTeam,
  onSetActiveTeam,
  onSetEditingTeamName,
  previewMode,
  teamsCount,
  team,
  variant,
}: {
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
  onRequestExportTeam: (teamId: string) => void
  onRequestResetTeam: (teamId: string) => void
  onSetActiveTeam: (teamId: string) => void
  onSetEditingTeamName: (nextName: string) => void
  previewMode: TeamPreviewMode
  teamsCount: number
  team: BuilderV2TeamSummary
  variant: 'desktop' | 'adaptive' | 'mobile'
}) {
  const isEditing = editingTeamId === team.id
  const isMobile = variant === 'mobile'
  const teamIndex = String(index + 1).padStart(2, '0')
  const [slotsRef, hasSlotsOverflow] = useHorizontalOverflow()

  return (
    <article
      className={`builder-v2-team-management-row ${
        team.isActive ? 'builder-v2-team-management-row--active' : ''
      }`}
      data-team-name={team.name}
    >
      <div className='builder-v2-team-management-reorder' aria-label={`${team.name} order`}>
        <span aria-hidden className='builder-v2-team-management-grip'>
          <span />
          <span />
          <span />
        </span>
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
      </div>

      <div className='builder-v2-team-management-main'>
        <div className='builder-v2-team-management-row-header'>
          {isEditing ? (
            <div className='builder-v2-team-management-select builder-v2-team-management-editing'>
              <span className='builder-v2-team-index'>{teamIndex}</span>
              <span className='builder-v2-team-management-copy'>
                <input
                  aria-label='Team name'
                  className='builder-v2-team-name-input'
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

          <TeamPosseSummary team={team} />
        </div>

        <div className='builder-v2-team-management-row-body'>
          <ul
            aria-label={`${team.name} slots`}
            className='builder-v2-team-management-slots'
            data-overflow-x={hasSlotsOverflow ? 'true' : undefined}
            ref={slotsRef}
          >
            {team.slots.map((slot) => (
              <TeamSlotSummary key={slot.slotId} previewMode={previewMode} slot={slot} />
            ))}
          </ul>

          <fieldset className='builder-v2-team-management-controls'>
            <legend className='sr-only'>{team.name} actions</legend>
            {isMobile ? (
              <span className='builder-v2-team-management-control-cluster builder-v2-team-management-control-cluster--move'>
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
              </span>
            ) : null}
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

function useHorizontalOverflow() {
  const ref = useRef<HTMLElement | null>(null)
  const [hasOverflow, setHasOverflow] = useState(false)

  const updateOverflow = useCallback((element: HTMLElement | null = ref.current) => {
    setHasOverflow(element ? element.scrollWidth > element.clientWidth + 1 : false)
  }, [])

  const setRef = useCallback(
    (element: HTMLElement | null) => {
      ref.current = element
      updateOverflow(element)
    },
    [updateOverflow],
  )

  useEffect(() => {
    const element = ref.current
    if (!element) {
      return undefined
    }

    const updateCurrentOverflow = () => {
      updateOverflow(element)
    }

    window.addEventListener('resize', updateCurrentOverflow)

    if (typeof ResizeObserver === 'undefined') {
      return () => {
        window.removeEventListener('resize', updateCurrentOverflow)
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
    }
  }, [updateOverflow])

  return [setRef, hasOverflow] as const
}

function TeamPosseSummary({team}: {team: BuilderV2TeamSummary}) {
  const hasPosse = Boolean(team.posseName)
  return (
    <div
      className={`builder-v2-team-management-posse ${
        hasPosse ? 'builder-v2-team-management-posse--equipped' : ''
      } ${!team.isPosseOwned ? 'builder-v2-team-management-posse--unowned' : ''}`}
    >
      <span className='builder-v2-team-management-posse-icon' aria-hidden>
        {team.posseAssetSrc ? <img alt='' draggable={false} src={team.posseAssetSrc} /> : null}
      </span>
      <span className='builder-v2-team-management-posse-copy'>
        <span className='builder-v2-label'>Posse</span>
        <span className='builder-v2-team-management-posse-name'>
          {team.posseName ?? 'Not selected'}
        </span>
      </span>
    </div>
  )
}

function TeamSlotSummary({
  previewMode,
  slot,
}: {
  previewMode: TeamPreviewMode
  slot: BuilderV2TeamSummarySlot
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
                <BuilderV2EnlightenMeter level={slot.awakener.enlightenLevel} variant='compact' />
              </span>
            ) : null}
            {previewMode === 'expanded' && slot.covenant?.assetSrc ? (
              <span className='builder-v2-team-management-slot-covenant'>
                <img alt='' draggable={false} src={slot.covenant.assetSrc} />
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
                <span className='builder-v2-team-management-state-chip'>
                  {compactEnlightenLabel}
                </span>
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

      {previewMode === 'expanded' ? (
        <span className='builder-v2-team-management-slot-build' aria-hidden>
          <span className='builder-v2-team-management-loadout-row'>
            {slot.wheels.map((wheel, index) => (
              <WheelMiniSummary
                key={`${slot.slotId}-wheel-${String(index)}`}
                wheel={wheel}
                wheelNumber={index + 1}
              />
            ))}
          </span>
        </span>
      ) : null}
    </li>
  )
}

function WheelMiniSummary({
  wheel,
  wheelNumber,
}: {
  wheel: BuilderV2TeamSummaryWheel | null
  wheelNumber: number
}) {
  const enlightenLabel = formatBuilderV2EnlightenLabel(wheel?.enlightenLevel ?? null)

  return (
    <span
      className={`builder-v2-team-management-loadout-cell builder-v2-team-management-loadout-cell--wheel ${
        wheel && !wheel.isOwned ? 'builder-v2-team-management-loadout-cell--unowned' : ''
      }`}
    >
      {(wheel?.miniAssetSrc ?? wheel?.assetSrc) ? (
        <img alt='' draggable={false} src={wheel.miniAssetSrc ?? wheel.assetSrc} />
      ) : (
        <span>{wheel ? `W${String(wheelNumber)}` : '+'}</span>
      )}
      {enlightenLabel ? (
        <span className='builder-v2-team-management-wheel-enlighten'>{enlightenLabel}</span>
      ) : null}
    </span>
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
