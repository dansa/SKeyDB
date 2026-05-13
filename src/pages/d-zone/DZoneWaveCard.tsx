import {useLayoutEffect, useRef, type MouseEvent} from 'react'

import {FaChevronDown} from 'react-icons/fa6'

import type {DzoneResolvedMonster, DzoneResolvedWave} from '@/domain/dzone'
import {DatabaseLoreMarkupText} from '@/features/database/internal/DatabaseLoreMarkupText'

import type {DZoneRelicPreview} from './d-zone-view-model'

interface DZoneWaveCardProps {
  relics: DZoneRelicPreview[]
  wave: DzoneResolvedWave
  expanded: boolean
  getMonsterAsset: (monster: DzoneResolvedMonster) => string | undefined
  headingLevel?: 2 | 3
  onExpandedChange: () => void
  onMonsterOpen: (monster: DzoneResolvedMonster, event: MouseEvent<HTMLButtonElement>) => void
  onRelicOpen: (relic: DZoneRelicPreview, event: MouseEvent<HTMLButtonElement>) => void
}

const COLLAPSED_MONSTER_LIMIT = 10
const WAVE_MOTION_EASING = 'cubic-bezier(0.22, 1, 0.36, 1)'
const WAVE_OPEN_DURATION_MS = 260
const WAVE_CLOSE_DURATION_MS = 180

function toAccessibleLabel(text: string): string {
  return (
    text
      .replace(/@[1-4]\s*/g, '')
      .replace(/\s+/g, ' ')
      .trim() || text
  )
}

export function DZoneWaveCard({
  relics,
  wave,
  expanded,
  getMonsterAsset,
  headingLevel = 2,
  onExpandedChange,
  onMonsterOpen,
  onRelicOpen,
}: DZoneWaveCardProps) {
  const cardRef = useRef<HTMLElement | null>(null)
  const previousExpandedRef = useRef(expanded)
  const previousNaturalHeightRef = useRef<number | null>(null)
  const detailsId = `${wave.id}-details`
  const HeadingTag = headingLevel === 3 ? 'h3' : 'h2'
  const waveNumber = /\d+/.exec(wave.name)?.[0] ?? wave.name
  const toggleLabel = expanded ? `Collapse ${wave.name}` : `Expand ${wave.name}`
  const relicButtonClassName = `d-zone-relic-button ${
    expanded ? '' : 'd-zone-relic-button--compact'
  }`
  const visibleMonsters = wave.monsters.slice(
    0,
    expanded ? wave.monsters.length : COLLAPSED_MONSTER_LIMIT,
  )
  const monsterGridClassName = `d-zone-monster-grid ${
    !expanded && wave.monsters.length > visibleMonsters.length
      ? 'd-zone-monster-grid--overflowing'
      : ''
  }`

  useLayoutEffect(() => {
    const cardElement = cardRef.current
    if (!cardElement) return

    const expandedChanged = previousExpandedRef.current !== expanded
    const renderedHeight = cardElement.getBoundingClientRect().height
    const previousNaturalHeight = previousNaturalHeightRef.current

    previousExpandedRef.current = expanded

    if (!expandedChanged) {
      previousNaturalHeightRef.current = renderedHeight
      return
    }

    const startHeight = cardElement.style.height ? renderedHeight : previousNaturalHeight

    cardElement.style.transition = 'none'
    cardElement.style.height = ''
    cardElement.style.overflow = ''
    delete cardElement.dataset.waveMotion

    const targetHeight = cardElement.getBoundingClientRect().height
    previousNaturalHeightRef.current = targetHeight

    const clearMotionStyles = () => {
      cardElement.style.height = ''
      cardElement.style.overflow = ''
      cardElement.style.transition = ''
      delete cardElement.dataset.waveMotion
      previousNaturalHeightRef.current = cardElement.getBoundingClientRect().height
    }

    if (startHeight === null || Math.abs(startHeight - targetHeight) < 1) {
      clearMotionStyles()
      return
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) {
      clearMotionStyles()
      return
    }

    const duration = expanded ? WAVE_OPEN_DURATION_MS : WAVE_CLOSE_DURATION_MS
    let cleanupTimer = 0

    const handleTransitionEnd = (event: TransitionEvent) => {
      if (event.target === cardElement && event.propertyName === 'height') {
        window.clearTimeout(cleanupTimer)
        clearMotionStyles()
      }
    }

    cardElement.dataset.waveMotion = expanded ? 'opening' : 'closing'
    cardElement.style.overflow = 'hidden'
    cardElement.style.transition = 'none'
    cardElement.style.height = `${startHeight.toString()}px`
    void cardElement.offsetHeight
    cardElement.style.transition = `height ${duration.toString()}ms ${WAVE_MOTION_EASING}`
    cardElement.style.height = `${targetHeight.toString()}px`
    cardElement.addEventListener('transitionend', handleTransitionEnd)
    cleanupTimer = window.setTimeout(clearMotionStyles, duration + 90)

    return () => {
      window.clearTimeout(cleanupTimer)
      cardElement.removeEventListener('transitionend', handleTransitionEnd)
    }
  }, [expanded])

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
              {relics.map((relic) => (
                <button
                  aria-label={`View ${wave.name} relic details for ${toAccessibleLabel(
                    relic.name,
                  )}`}
                  className={relicButtonClassName}
                  key={relic.id}
                  onClick={(event) => {
                    onRelicOpen(relic, event)
                  }}
                  title={toAccessibleLabel(relic.name)}
                  type='button'
                >
                  <RelicIcon relic={relic} />
                  {expanded ? (
                    <span className='d-zone-relic-copy'>
                      <span className='d-zone-relic-name'>{relic.name}</span>
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          </section>

          <section aria-labelledby={`${wave.id}-monsters`} className='d-zone-wave-section'>
            <div className={monsterGridClassName}>
              {visibleMonsters.map((monster) => (
                <MonsterButton
                  assetSrc={getMonsterAsset(monster)}
                  compact={!expanded}
                  key={monster.id}
                  monster={monster}
                  onMonsterOpen={onMonsterOpen}
                  waveName={wave.name}
                />
              ))}
            </div>
          </section>
        </div>
      </div>
    </article>
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
  monster: DzoneResolvedMonster
  onMonsterOpen: (monster: DzoneResolvedMonster, event: MouseEvent<HTMLButtonElement>) => void
  waveName: string
}

function MonsterButton({
  assetSrc,
  compact = false,
  monster,
  onMonsterOpen,
  waveName,
}: MonsterButtonProps) {
  const badge = monster.badges?.[0]

  return (
    <button
      aria-label={`View ${waveName} monster details for ${toAccessibleLabel(monster.name)}`}
      className={`d-zone-monster-tile ${compact ? 'd-zone-monster-tile--compact' : ''}`}
      onClick={(event) => {
        onMonsterOpen(monster, event)
      }}
      title={toAccessibleLabel(monster.name)}
      type='button'
    >
      {badge ? <span className='d-zone-monster-badge'>{badge}</span> : null}
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
          <DatabaseLoreMarkupText keyPrefix={`d-zone-monster-${monster.id}`} text={monster.name} />
        </span>
      )}
    </button>
  )
}
