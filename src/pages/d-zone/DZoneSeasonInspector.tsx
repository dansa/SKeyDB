import {useState, type MouseEvent} from 'react'

import {FaCalendarDays} from 'react-icons/fa6'

import type {DzoneRealm, DzoneResolvedMonster, DzoneSeason} from '@/domain/dzone'

import {buildDZoneWaveCardViewModels, type DZoneRelicPreview} from './d-zone-view-model'
import {DZoneWaveCard} from './DZoneWaveCard'

export const D_ZONE_DESCRIPTION =
  'Defeat waves of monsters to earn relics. Each season features unique stage effects and realm-specific rewards.'

interface DZoneSeasonInspectorProps {
  countdownDisplay?: string
  dateRange: string
  getMonsterAsset: (monster: DzoneResolvedMonster) => string | undefined
  onMonsterOpen: (monster: DzoneResolvedMonster, event: MouseEvent<HTMLButtonElement>) => void
  onRelicOpen: (relic: DZoneRelicPreview, event: MouseEvent<HTMLButtonElement>) => void
  realm?: DzoneRealm | null
  realmBadgeSrc?: string
  realmName?: string | null
  season: DzoneSeason
  showHeader?: boolean
  title: string
  waveHeadingLevel?: 2 | 3
}

interface WaveDisclosureState {
  openWaveIds: Set<string>
  seasonId: string
}

function buildDefaultOpenWaveIds(defaultOpenWaveId: string | undefined): Set<string> {
  return new Set(defaultOpenWaveId ? [defaultOpenWaveId] : [])
}

function getRealmThemeClass(realm: DzoneRealm | null | undefined): string {
  return `d-zone-season-inspector--realm-${realm ? realm.toLowerCase() : 'legacy'}`
}

export function DZoneSeasonInspector({
  countdownDisplay,
  dateRange,
  getMonsterAsset,
  onMonsterOpen,
  onRelicOpen,
  realm,
  realmBadgeSrc,
  realmName,
  season,
  showHeader = false,
  title,
  waveHeadingLevel = 2,
}: DZoneSeasonInspectorProps) {
  const defaultOpenWaveId = season.waves[0]?.id
  const waveCardViewModels = buildDZoneWaveCardViewModels(season)
  const [waveDisclosureState, setWaveDisclosureState] = useState<WaveDisclosureState>(() => ({
    openWaveIds: buildDefaultOpenWaveIds(defaultOpenWaveId),
    seasonId: season.id,
  }))
  const openWaveIds =
    waveDisclosureState.seasonId === season.id
      ? waveDisclosureState.openWaveIds
      : buildDefaultOpenWaveIds(defaultOpenWaveId)

  function toggleWave(waveId: string) {
    setWaveDisclosureState((currentDisclosureState) => {
      const currentOpenWaveIds =
        currentDisclosureState.seasonId === season.id
          ? currentDisclosureState.openWaveIds
          : buildDefaultOpenWaveIds(defaultOpenWaveId)
      const nextOpenWaveIds = new Set(currentOpenWaveIds)
      if (nextOpenWaveIds.has(waveId)) {
        nextOpenWaveIds.delete(waveId)
      } else {
        nextOpenWaveIds.add(waveId)
      }
      return {openWaveIds: nextOpenWaveIds, seasonId: season.id}
    })
  }

  return (
    <section
      aria-label={`Season ${season.period.toString()} inspector`}
      className={`d-zone-season-inspector ${getRealmThemeClass(realm)} ${
        showHeader ? 'd-zone-season-inspector--with-header' : ''
      }`}
    >
      {showHeader ? (
        <header className='d-zone-season-inspector-header'>
          <div className='d-zone-season-inspector-copy'>
            <h2 className='d-zone-season-title ui-title'>{title}</h2>
            <div className='d-zone-stage-chips'>
              <span className='d-zone-stage-chip-label'>{season.stageEffect}</span>
              {realmName ? <span className='d-zone-stage-chip-label'>{realmName}</span> : null}
            </div>

            <div className='d-zone-season-meta-row'>
              <span className='d-zone-season-date'>
                <FaCalendarDays aria-hidden className='d-zone-season-date-icon' />
                {dateRange}
              </span>
              {countdownDisplay ? (
                <span className='d-zone-season-countdown'>{countdownDisplay}</span>
              ) : null}
            </div>
          </div>
          {realmBadgeSrc ? (
            <div aria-hidden className='d-zone-season-realm-emblem'>
              <img
                alt=''
                className='d-zone-season-realm-emblem-image'
                decoding='async'
                draggable={false}
                src={realmBadgeSrc}
              />
            </div>
          ) : null}
        </header>
      ) : null}

      <div className='d-zone-season-wave-list'>
        {waveCardViewModels.map(({wave, relics}) => (
          <DZoneWaveCard
            expanded={openWaveIds.has(wave.id)}
            getMonsterAsset={getMonsterAsset}
            headingLevel={waveHeadingLevel}
            key={wave.id}
            onExpandedChange={() => {
              toggleWave(wave.id)
            }}
            onMonsterOpen={onMonsterOpen}
            onRelicOpen={onRelicOpen}
            relics={relics}
            wave={wave}
          />
        ))}
      </div>
    </section>
  )
}
