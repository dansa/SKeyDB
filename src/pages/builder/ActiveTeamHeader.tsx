import { DEFAULT_FACTION_TINT, getFactionIcon, getFactionLabel, getFactionTint, normalizeFactionId } from '../../domain/factions'
import type { CSSProperties } from 'react'

type ActiveTeamHeaderProps = {
  activePosseAsset?: string
  activePosseName?: string
  teamFactions: string[]
  onOpenPossePicker: () => void
}

type FactionMeta = {
  label: string
  icon: string
  tint: string
}

const factionMetaById: Record<string, FactionMeta> = {
  AEQUOR: { label: getFactionLabel('AEQUOR'), icon: getFactionIcon('AEQUOR')!, tint: getFactionTint('AEQUOR') },
  CARO: { label: getFactionLabel('CARO'), icon: getFactionIcon('CARO')!, tint: getFactionTint('CARO') },
  CHAOS: { label: getFactionLabel('CHAOS'), icon: getFactionIcon('CHAOS')!, tint: getFactionTint('CHAOS') },
  ULTRA: { label: getFactionLabel('ULTRA'), icon: getFactionIcon('ULTRA')!, tint: getFactionTint('ULTRA') },
}

export function ActiveTeamHeader({ activePosseAsset, activePosseName, teamFactions, onOpenPossePicker }: ActiveTeamHeaderProps) {
  const normalizedFactions = Array.from(new Set(teamFactions.map(normalizeFactionId))).slice(0, 2)
  const activeFactions = normalizedFactions
    .map((factionId) => factionMetaById[factionId])
    .filter((meta): meta is FactionMeta => Boolean(meta))
  const hasSingleFaction = activeFactions.length === 1
  const tintA = activeFactions[0]?.tint ?? DEFAULT_FACTION_TINT
  const tintB = activeFactions[1]?.tint ?? tintA
  const badgeStateClass =
    activeFactions.length === 1
      ? 'builder-team-faction-badge-single'
      : activeFactions.length === 2
        ? 'builder-team-faction-badge-split'
        : 'builder-team-faction-badge-empty'
  const badgeStyle = {
    '--team-faction-tint-a': tintA,
    '--team-faction-tint-b': tintB,
  } as CSSProperties

  return (
    <div className="builder-team-header border-b border-slate-500/50 pb-3">
      <div className={`builder-team-faction-badge ${badgeStateClass}`} style={badgeStyle}>
        {activeFactions.length === 0 ? (
          <span className="sigil-placeholder" />
        ) : (
          <div className={`builder-team-faction-stack ${hasSingleFaction ? 'builder-team-faction-stack-single' : ''}`}>
            <div className={`builder-team-faction-icons ${hasSingleFaction ? 'builder-team-faction-icons-single' : ''}`}>
              {activeFactions.map((faction) => (
                <span className="builder-team-faction-icon-wrap" key={faction.label}>
                  <img
                    alt={`${faction.label} faction`}
                    className="builder-team-faction-icon"
                    draggable={false}
                    src={faction.icon}
                  />
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="builder-team-faction-copy">
        <h3 className="ui-title text-xl text-amber-100">Active Team</h3>
        <p className="text-xs tracking-wide text-slate-300">
          {activeFactions.length > 0 ? (
            <>
              {activeFactions.map((faction, index) => (
                <span key={faction.label}>
                  <span className="builder-team-faction-label-segment" style={{ color: faction.tint }}>
                    {faction.label}
                  </span>
                  {index < activeFactions.length - 1 ? <span className="text-slate-400"> / </span> : null}
                </span>
              ))}
            </>
          ) : (
            'No Faction'
          )}
        </p>
      </div>

      <button className="builder-team-posse-button" onClick={onOpenPossePicker} type="button">
        <span className="builder-team-posse-copy">
          <span className="ui-title text-xl text-amber-100">Posse</span>
          <span className="text-xs tracking-wide text-slate-300/90">{activePosseName ?? 'Not Set'}</span>
        </span>
        <span className="builder-team-posse-icon-wrap">
          {activePosseAsset ? (
            <img
              alt={activePosseName ? `${activePosseName} posse` : 'Posse placeholder'}
              className="builder-team-posse-icon"
              draggable={false}
              src={activePosseAsset}
            />
          ) : (
            <span className="builder-posse-unset-icon">
              <span className="builder-posse-unset-icon__plus" />
            </span>
          )}
        </span>
      </button>
    </div>
  )
}
