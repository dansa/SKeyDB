import {useRef, type MouseEvent} from 'react'

import {FaChevronDown} from 'react-icons/fa6'

import type {DzoneResolvedMonster, DzoneResolvedWave} from '@/domain/dzone'
import {GameLoreMarkupText} from '@/ui/game-content/GameLoreMarkupText'

import {toDZoneAccessibleText} from './d-zone-display-text'
import type {DZoneRelicPreview} from './d-zone-view-model'
import {useDZoneWaveCardMotion} from './useDZoneWaveCardMotion'

interface DZoneWaveCardProps {
  relics: DZoneRelicPreview[]
  wave: DzoneResolvedWave
  expanded: boolean
  getMonsterAsset: (monster: DzoneResolvedMonster) => string | undefined
  headingLevel?: 2 | 3
  onExpandedChange: () => void
  onMonsterOpen: (monster: DzoneResolvedMonster, event: MouseEvent<HTMLButtonElement>) => void
  onRelicOpen: (relic: DZoneRelicPreview, event: MouseEvent<HTMLButtonElement>) => void
  selectedAlertId?: string | null
}

const COLLAPSED_MONSTER_LIMIT = 10
const COLLAPSED_MONSTER_ACCESSIBLE_LIMIT = 6
const COLLAPSED_RELIC_ACCESSIBLE_LIMIT = 2

export function DZoneWaveCard({
  relics,
  wave,
  expanded,
  getMonsterAsset,
  headingLevel = 2,
  onExpandedChange,
  onMonsterOpen,
  onRelicOpen,
  selectedAlertId = null,
}: DZoneWaveCardProps) {
  const cardRef = useRef<HTMLElement | null>(null)
  const detailsId = `${wave.id}-details`
  const HeadingTag = headingLevel === 3 ? 'h3' : 'h2'
  const waveNumber = /\d+/.exec(wave.name)?.[0] ?? wave.name
  const toggleLabel = expanded ? `Collapse ${wave.name}` : `Expand ${wave.name}`
  const selectedAlert = wave.alerts.find((alert) => alert.id === selectedAlertId) ?? wave.alerts[0]
  const alertMonsters = selectedAlert.monsters
  const visibleMonsters = alertMonsters.slice(
    0,
    expanded ? alertMonsters.length : COLLAPSED_MONSTER_LIMIT,
  )
  const monsterGridClassName = `d-zone-monster-grid ${
    !expanded && alertMonsters.length > visibleMonsters.length
      ? 'd-zone-monster-grid--overflowing'
      : ''
  }`

  useDZoneWaveCardMotion(cardRef, expanded)

  return (
    <article
      aria-label={wave.name}
      className={`d-zone-wave-card ${
        expanded ? 'd-zone-wave-card--expanded' : 'd-zone-wave-card--collapsed'
      }`}
      ref={cardRef}
    >
      <div className='d-zone-wave-index' aria-hidden='true'>
        <span className='d-zone-wave-index-number'>{waveNumber}</span>
      </div>

      <div className='d-zone-wave-content'>
        <div className='d-zone-section-heading d-zone-section-heading--relics'>
          <h3 id={`${wave.id}-relics`}>Initial Relics</h3>
        </div>

        <div className='d-zone-section-heading d-zone-section-heading--monsters'>
          <h3 id={`${wave.id}-monsters`}>Monsters</h3>
        </div>

        <HeadingTag className='d-zone-wave-heading'>
          <button
            aria-controls={detailsId}
            aria-expanded={expanded}
            aria-label={toggleLabel}
            className='d-zone-wave-toggle'
            onClick={onExpandedChange}
            type='button'
          >
            <span className='d-zone-wave-toggle-title'>{wave.name}</span>
            <FaChevronDown aria-hidden className='d-zone-wave-toggle-icon' />
          </button>
        </HeadingTag>

        <div className='d-zone-wave-body' id={detailsId}>
          <section aria-labelledby={`${wave.id}-relics`} className='d-zone-wave-section'>
            <div className='d-zone-relic-list'>
              {relics.map((relic, relicIndex) => {
                const collapsedOverflow =
                  !expanded && relicIndex >= COLLAPSED_RELIC_ACCESSIBLE_LIMIT

                return (
                  <RelicButton
                    compact={!expanded}
                    hiddenFromAccessibility={collapsedOverflow}
                    key={relic.id}
                    onRelicOpen={onRelicOpen}
                    relic={relic}
                    waveName={wave.name}
                  />
                )
              })}
            </div>
          </section>

          <section aria-labelledby={`${wave.id}-monsters`} className='d-zone-wave-section'>
            <div className={monsterGridClassName}>
              {visibleMonsters.map((monster, monsterIndex) => {
                const collapsedOverflow =
                  !expanded && monsterIndex >= COLLAPSED_MONSTER_ACCESSIBLE_LIMIT

                return (
                  <MonsterButton
                    assetSrc={getMonsterAsset(monster)}
                    compact={!expanded}
                    hiddenFromAccessibility={collapsedOverflow}
                    key={monster.id}
                    monster={monster}
                    onMonsterOpen={onMonsterOpen}
                    waveName={wave.name}
                  />
                )
              })}
            </div>
          </section>
        </div>
      </div>
    </article>
  )
}

interface RelicButtonProps {
  compact: boolean
  hiddenFromAccessibility: boolean
  onRelicOpen: (relic: DZoneRelicPreview, event: MouseEvent<HTMLButtonElement>) => void
  relic: DZoneRelicPreview
  waveName: string
}

function RelicButton({
  compact,
  hiddenFromAccessibility,
  onRelicOpen,
  relic,
  waveName,
}: RelicButtonProps) {
  const accessibleRelicName = toDZoneAccessibleText(relic.name)

  return (
    <button
      aria-hidden={hiddenFromAccessibility ? true : undefined}
      aria-label={`View ${waveName} relic details for ${accessibleRelicName}`}
      className={`d-zone-relic-button ${compact ? 'd-zone-relic-button--compact' : ''}`}
      onClick={(event) => {
        onRelicOpen(relic, event)
      }}
      tabIndex={hiddenFromAccessibility ? -1 : undefined}
      title={accessibleRelicName}
      type='button'
    >
      <RelicIcon relic={relic} />
      {compact ? null : (
        <span className='d-zone-relic-copy'>
          <span className='d-zone-relic-name'>{relic.name}</span>
        </span>
      )}
    </button>
  )
}

function RelicIcon({relic}: {relic: DZoneRelicPreview}) {
  return (
    <span className='d-zone-relic-icon-frame'>
      {relic.iconSrc ? (
        <img
          alt=''
          aria-hidden
          className='d-zone-relic-icon'
          decoding='async'
          draggable={false}
          loading='lazy'
          src={relic.iconSrc}
        />
      ) : (
        <span aria-hidden className='d-zone-relic-icon-fallback'>
          ?
        </span>
      )}
    </span>
  )
}

interface MonsterButtonProps {
  assetSrc: string | undefined
  compact?: boolean
  hiddenFromAccessibility?: boolean
  monster: DzoneResolvedMonster
  onMonsterOpen: (monster: DzoneResolvedMonster, event: MouseEvent<HTMLButtonElement>) => void
  waveName: string
}

function getMonsterButtonLabel(
  waveName: string,
  monster: DzoneResolvedMonster,
  compact: boolean,
): string {
  const monsterName = toDZoneAccessibleText(monster.name)
  const levelSuffix =
    !compact && monster.alertStats ? `, level ${monster.alertStats.level.toString()}` : ''

  return `View ${waveName} monster details for ${monsterName}${levelSuffix}`
}

function MonsterButton({
  assetSrc,
  compact = false,
  hiddenFromAccessibility = false,
  monster,
  onMonsterOpen,
  waveName,
}: MonsterButtonProps) {
  const badge = monster.badges?.[0]

  return (
    <button
      aria-hidden={hiddenFromAccessibility ? true : undefined}
      aria-label={getMonsterButtonLabel(waveName, monster, compact)}
      className={`d-zone-monster-tile ${compact ? 'd-zone-monster-tile--compact' : ''}`}
      onClick={(event) => {
        onMonsterOpen(monster, event)
      }}
      tabIndex={hiddenFromAccessibility ? -1 : undefined}
      title={toDZoneAccessibleText(monster.name)}
      type='button'
    >
      {badge ? <span className='d-zone-monster-badge'>{badge}</span> : null}
      {!compact && monster.alertStats ? (
        <span className='d-zone-monster-badge d-zone-monster-level-chip'>
          Lv {monster.alertStats.level.toString()}
        </span>
      ) : null}
      <span className='d-zone-monster-art-frame'>
        {assetSrc ? (
          <img
            alt=''
            aria-hidden
            className='d-zone-monster-art'
            decoding='async'
            draggable={false}
            loading='lazy'
            src={assetSrc}
          />
        ) : (
          <span aria-hidden className='d-zone-monster-art-fallback'>
            ?
          </span>
        )}
      </span>
      {compact ? null : (
        <span className='d-zone-monster-name' title={monster.name}>
          <GameLoreMarkupText keyPrefix={`d-zone-monster-${monster.id}`} text={monster.name} />
        </span>
      )}
    </button>
  )
}
