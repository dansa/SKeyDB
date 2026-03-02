import { DEFAULT_REALM_TINT, getRealmIcon, getRealmLabel, getRealmTint, normalizeRealmId } from '../../domain/factions'
import tempPosseIcon from '../../assets/posse/00-temposse.png'
import type { CSSProperties } from 'react'
import { TeamNameInlineEditor } from './TeamNameInlineEditor'

type ActiveTeamHeaderProps = {
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

type RealmMeta = {
  label: string
  icon: string
  tint: string
}

const realmMetaById: Record<string, RealmMeta> = {
  AEQUOR: { label: getRealmLabel('AEQUOR'), icon: getRealmIcon('AEQUOR')!, tint: getRealmTint('AEQUOR') },
  CARO: { label: getRealmLabel('CARO'), icon: getRealmIcon('CARO')!, tint: getRealmTint('CARO') },
  CHAOS: { label: getRealmLabel('CHAOS'), icon: getRealmIcon('CHAOS')!, tint: getRealmTint('CHAOS') },
  ULTRA: { label: getRealmLabel('ULTRA'), icon: getRealmIcon('ULTRA')!, tint: getRealmTint('ULTRA') },
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
    .map((realmId) => realmMetaById[realmId])
    .filter((meta): meta is RealmMeta => Boolean(meta))
  const hasSingleRealm = activeRealms.length === 1
  const tintA = activeRealms[0]?.tint ?? DEFAULT_REALM_TINT
  const tintB = activeRealms[1]?.tint ?? tintA
  const badgeStateClass =
    activeRealms.length === 1
      ? 'builder-team-faction-badge-single'
      : activeRealms.length === 2
        ? 'builder-team-faction-badge-split'
        : 'builder-team-faction-badge-empty'
  const badgeStyle = {
    '--team-faction-tint-a': tintA,
    '--team-faction-tint-b': tintB,
  } as CSSProperties
  const displayedPosseAsset = activePosseAsset ?? tempPosseIcon
  return (
    <div className="builder-team-header border-b border-slate-500/50 pb-3">
      <div className={`builder-team-faction-badge ${badgeStateClass}`} style={badgeStyle}>
        {activeRealms.length === 0 ? (
          <span className="sigil-placeholder" />
        ) : (
          <div className={`builder-team-faction-stack ${hasSingleRealm ? 'builder-team-faction-stack-single' : ''}`}>
            <div className={`builder-team-faction-icons ${hasSingleRealm ? 'builder-team-faction-icons-single' : ''}`}>
              {activeRealms.map((realm) => (
                <span className="builder-team-faction-icon-wrap" key={realm.label}>
                  <img
                    alt={`${realm.label} realm`}
                    className="builder-team-faction-icon"
                    draggable={false}
                    src={realm.icon}
                  />
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="builder-team-faction-copy">
        <TeamNameInlineEditor
          draftName={editingTeamName}
          isEditing={isEditingTeamName}
          onBeginEdit={() => onBeginTeamRename(activeTeamId, activeTeamName, 'header')}
          onCancel={onCancelTeamRename}
          onCommit={() => onCommitTeamRename(activeTeamId)}
          onDraftChange={onEditingTeamNameChange}
          teamName={activeTeamName}
          variant="header"
        />
        <p className="text-xs tracking-wide text-slate-300">
          {activeRealms.length > 0 ? (
            <>
              {activeRealms.map((realm, index) => (
                <span key={realm.label}>
                  <span className="builder-team-faction-label-segment" style={{ color: realm.tint }}>
                    {realm.label}
                  </span>
                  {index < activeRealms.length - 1 ? <span className="text-slate-400"> / </span> : null}
                </span>
              ))}
            </>
          ) : (
            'No Realm'
          )}
        </p>
      </div>

      <button className="builder-team-posse-button" onClick={onOpenPossePicker} type="button">
        <span className="builder-team-posse-copy">
          <span className="ui-title text-xl text-amber-100">Posse</span>
          <span className="text-xs tracking-wide text-slate-300/90">
            {activePosseName ?? 'Not Set'}
            {activePosseName && !isActivePosseOwned ? ' (Unowned)' : ''}
          </span>
        </span>
        <span className="builder-team-posse-icon-wrap">
          <img
            alt={activePosseName ? `${activePosseName} posse` : 'Posse placeholder'}
            className="builder-team-posse-icon"
            draggable={false}
            src={displayedPosseAsset}
          />
        </span>
      </button>
    </div>
  )
}
