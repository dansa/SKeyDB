import {useMemo, useState, type MouseEvent} from 'react'

import {FaCalendarDays} from 'react-icons/fa6'
import {useStore} from 'zustand'

import {
  getDzoneSeasonAlertOptions,
  type DzoneAlertOption,
  type DzoneRealm,
  type DzoneResolvedMonster,
  type DzoneSeason,
} from '@/domain/dzone'
import {dzonePreferencesStore, hydrateDZoneSelectedAlertId} from '@/stores/dzonePreferencesStore'

import {getDzoneAlertShortName} from './d-zone-display-text'
import {
  buildDefaultOpenWaveIds,
  getResolvedOpenWaveIds,
  getSelectedAlertId,
  toggleResolvedOpenWaveId,
  type AlertSelectionState,
  type WaveDisclosureState,
} from './d-zone-season-inspector-state'
import {buildDZoneWaveCardViewModels, type DZoneRelicPreview} from './d-zone-view-model'
import {DZoneWaveCard} from './DZoneWaveCard'

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
  useState(() => {
    hydrateDZoneSelectedAlertId()
    return true
  })

  const defaultOpenWaveId = season.waves[0]?.id
  const waveCardViewModels = useMemo(() => buildDZoneWaveCardViewModels(season), [season])
  const alertOptions = useMemo(() => getDzoneSeasonAlertOptions(season), [season])
  const persistedSelectedAlertId = useStore(dzonePreferencesStore, (state) => state.selectedAlertId)
  const setPersistedSelectedAlertId = useStore(
    dzonePreferencesStore,
    (state) => state.setSelectedAlertId,
  )
  const [waveDisclosureState, setWaveDisclosureState] = useState<WaveDisclosureState>(() => ({
    openWaveIds: buildDefaultOpenWaveIds(defaultOpenWaveId),
    seasonId: season.id,
  }))
  const [alertSelectionState, setAlertSelectionState] = useState<AlertSelectionState>(() => ({
    alertId: persistedSelectedAlertId ?? alertOptions.at(0)?.id ?? null,
  }))
  const selectedAlertId = getSelectedAlertId({
    alertOptions,
    alertSelectionState: {
      alertId: persistedSelectedAlertId ?? alertSelectionState.alertId,
    },
  })
  const openWaveIds = getResolvedOpenWaveIds({
    defaultOpenWaveId,
    seasonId: season.id,
    waveDisclosureState,
  })

  function selectAlert(alertId: string) {
    setPersistedSelectedAlertId(alertId)
    setAlertSelectionState({alertId})
  }

  function toggleWave(waveId: string) {
    setWaveDisclosureState((currentDisclosureState) => {
      return toggleResolvedOpenWaveId({
        defaultOpenWaveId,
        seasonId: season.id,
        waveDisclosureState: currentDisclosureState,
        waveId,
      })
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
            <DZoneAlertSwitcher
              alertOptions={alertOptions}
              selectedAlertId={selectedAlertId}
              variant='header'
              onAlertChange={selectAlert}
            />

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

      {!showHeader ? (
        <DZoneAlertSwitcher
          alertOptions={alertOptions}
          selectedAlertId={selectedAlertId}
          variant='toolbar'
          onAlertChange={selectAlert}
        />
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
            selectedAlertId={selectedAlertId}
            wave={wave}
          />
        ))}
      </div>
    </section>
  )
}

function DZoneAlertSwitcher({
  alertOptions,
  selectedAlertId,
  variant,
  onAlertChange,
}: {
  alertOptions: DzoneAlertOption[]
  selectedAlertId: string | null
  variant: 'header' | 'toolbar'
  onAlertChange: (alertId: string) => void
}) {
  if (alertOptions.length <= 1) {
    return null
  }

  return (
    <fieldset
      aria-label='Alert'
      className={`d-zone-alert-switcher d-zone-alert-switcher--${variant}`}
    >
      <span className='d-zone-alert-switcher-label'>Alert</span>
      <div className='d-zone-alert-switcher-options'>
        {alertOptions.map((alert) => (
          <button
            aria-label={`Select ${alert.name}`}
            aria-pressed={alert.id === selectedAlertId}
            className='ui-compact-control ui-compact-control--pressed ui-compact-control--dense d-zone-alert-switcher-button'
            key={alert.id}
            onClick={() => {
              onAlertChange(alert.id)
            }}
            type='button'
          >
            {getDzoneAlertShortName(alert.name)}
          </button>
        ))}
      </div>
    </fieldset>
  )
}
