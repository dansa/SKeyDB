import type {CSSProperties} from 'react'

import tempPosseIcon from '@/assets/posse/00-temposse.webp'
import {
  DEFAULT_REALM_TINT,
  getRealmIcon,
  getRealmLabel,
  getRealmTint,
  normalizeRealmId,
} from '@/domain/factions'

import {TeamNameInlineEditor} from './TeamNameInlineEditor'

interface ActiveTeamHeaderProps {
  activeTeamId: string
  activeTeamName: string
  isEditingTeamName: boolean
  editingTeamName: string
  activePosseAsset?: string
  activePosseName?: string
  isActivePosseOwned: boolean
  teamRealms: string[]
  onBeginTeamRename: (teamId: string, currentName: string, surface?: 'header' | 'list') => void
  onCommitTeamRename: (teamId: string) => void
  onCancelTeamRename: () => void
  onEditingTeamNameChange: (nextName: string) => void
  onOpenPossePicker: () => void
}

interface RealmMeta {
  label: string
  icon: string
  tint: string
}

function createRealmMeta(realmId: 'AEQUOR' | 'CARO' | 'CHAOS' | 'ULTRA'): RealmMeta | null {
  const icon = getRealmIcon(realmId)
  if (!icon) {
    return null
  }

  return {
    label: getRealmLabel(realmId),
    icon,
    tint: getRealmTint(realmId),
  }
}

const realmMetaById = new Map<string, RealmMeta>(
  (['AEQUOR', 'CARO', 'CHAOS', 'ULTRA'] as const).flatMap((realmId) => {
    const realmMeta = createRealmMeta(realmId)
    return realmMeta ? [[realmId, realmMeta] as const] : []
  }),
)

function getBadgeStateClass(activeRealmCount: number): string {
  if (activeRealmCount === 1) {
    return 'builder-team-realm-badge-single'
  }
  if (activeRealmCount === 2) {
    return 'builder-team-realm-badge-split'
  }
  return 'builder-team-realm-badge-empty'
}

export function ActiveTeamHeader({
  activeTeamId,
  activeTeamName,
  isEditingTeamName,
  editingTeamName,
  activePosseAsset,
  activePosseName,
  isActivePosseOwned,
  teamRealms,
  onBeginTeamRename,
  onCommitTeamRename,
  onCancelTeamRename,
  onEditingTeamNameChange,
  onOpenPossePicker,
}: ActiveTeamHeaderProps) {
  const normalizedRealms = Array.from(new Set(teamRealms.map(normalizeRealmId))).slice(0, 2)
  const activeRealms = normalizedRealms
    .map((realmId) => realmMetaById.get(realmId))
    .filter((meta): meta is RealmMeta => Boolean(meta))
  const hasSingleRealm = activeRealms.length === 1
  const tintA = activeRealms[0]?.tint ?? DEFAULT_REALM_TINT
  const tintB = activeRealms[1]?.tint ?? tintA
  const badgeStateClass = getBadgeStateClass(activeRealms.length)
  const badgeStyle = {
    '--team-realm-tint-a': tintA,
    '--team-realm-tint-b': tintB,
  } as CSSProperties
  const displayedPosseAsset = activePosseAsset ?? tempPosseIcon
  return (
    <div className='builder-team-header border-b border-slate-500/50 pb-3'>
      <div className={`builder-team-realm-badge ${badgeStateClass}`} style={badgeStyle}>
        {activeRealms.length === 0 ? (
          <span className='sigil-placeholder' />
        ) : (
          <div
            className={`builder-team-realm-stack ${hasSingleRealm ? 'builder-team-realm-stack-single' : ''}`}
          >
            <div
              className={`builder-team-realm-icons ${hasSingleRealm ? 'builder-team-realm-icons-single' : ''}`}
            >
              {activeRealms.map((realm) => (
                <span className='builder-team-realm-icon-wrap' key={realm.label}>
                  <img
                    alt={`${realm.label} realm`}
                    className='builder-team-realm-icon'
                    draggable={false}
                    src={realm.icon}
                  />
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className='builder-team-realm-copy'>
        <TeamNameInlineEditor
          draftName={editingTeamName}
          isEditing={isEditingTeamName}
          onBeginEdit={() => {
            onBeginTeamRename(activeTeamId, activeTeamName, 'header')
          }}
          onCancel={onCancelTeamRename}
          onCommit={() => {
            onCommitTeamRename(activeTeamId)
          }}
          onDraftChange={onEditingTeamNameChange}
          teamName={activeTeamName}
          variant='header'
        />
        <p className='text-xs tracking-wide text-slate-300'>
          {activeRealms.length > 0 ? (
            <>
              {activeRealms.map((realm, index) => (
                <span key={realm.label}>
                  <span className='builder-team-realm-label-segment' style={{color: realm.tint}}>
                    {realm.label}
                  </span>
                  {index < activeRealms.length - 1 ? (
                    <span className='text-slate-400'> / </span>
                  ) : null}
                </span>
              ))}
            </>
          ) : (
            'No Realm'
          )}
        </p>
      </div>

      <button className='builder-team-posse-button' onClick={onOpenPossePicker} type='button'>
        <span className='builder-team-posse-copy'>
          <span className='ui-title text-xl text-amber-100'>Posse</span>
          <span className='text-xs tracking-wide text-slate-300/90'>
            {activePosseName ?? 'Not Set'}
            {activePosseName && !isActivePosseOwned ? ' (Unowned)' : ''}
          </span>
        </span>
        <span className='builder-team-posse-icon-wrap'>
          <img
            alt={activePosseName ? `${activePosseName} posse` : 'Posse placeholder'}
            className='builder-team-posse-icon'
            draggable={false}
            src={displayedPosseAsset}
          />
        </span>
      </button>
    </div>
  )
}
