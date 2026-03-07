import {useCallback, useEffect, useId, useState} from 'react'

import {createPortal} from 'react-dom'

import type {AwakenerCard, AwakenerFull, AwakenerFullStats} from '@/domain/awakeners-full'
import {parseRichDescription} from '@/domain/rich-text'
import {type Tag} from '@/domain/tags'

import {
  closeTrailFromIndex,
  closeTrailTop as closeTrailTopEntry,
  isSameTrailRoot,
  openTrailRoot,
  pushTrailEntry,
  type SkillTrailEntry,
  type TagTrailEntry,
  type TrailEntry,
} from './popover-trail'
import {PopoverTrailPanel} from './PopoverTrailPanel'
import {RichSegmentRenderer} from './RichSegmentRenderer'
import {SkillPopover} from './SkillPopover'
import {TagPopover} from './TagPopover'

interface RichDescriptionProps {
  text: string
  cardNames: Set<string>
  fullData: AwakenerFull | null
  stats: AwakenerFullStats | null
  skillLevel: number
  onNavigateToCards?: () => void
}

interface CardInfo {
  card: AwakenerCard
  label: string
}

const TRAIL_OPENED_EVENT = 'database:trail-opened'

export function RichDescription({
  text,
  cardNames,
  fullData,
  stats,
  skillLevel,
  onNavigateToCards,
}: RichDescriptionProps) {
  const rouseAwareCards =
    fullData && hasRouseCard(fullData) && !cardNames.has('Rouse')
      ? new Set([...cardNames, 'Rouse'])
      : cardNames
  const segments = parseRichDescription(text, rouseAwareCards)
  const [trail, setTrail] = useState<TrailEntry[]>([])
  const [trailAnchorRect, setTrailAnchorRect] = useState<DOMRect | null>(null)
  const [trailAnchorElement, setTrailAnchorElement] = useState<HTMLElement | null>(null)
  const ownerId = useId()

  const clearTrail = useCallback(() => {
    setTrail([])
    setTrailAnchorRect(null)
    setTrailAnchorElement(null)
  }, [])

  useEffect(() => {
    function handleTrailOpened(event: Event) {
      const detail = (event as CustomEvent<{ownerId?: string}>).detail
      if (detail.ownerId === ownerId) {
        return
      }
      clearTrail()
    }

    window.addEventListener(TRAIL_OPENED_EVENT, handleTrailOpened as EventListener)
    return () => {
      window.removeEventListener(TRAIL_OPENED_EVENT, handleTrailOpened as EventListener)
    }
  }, [clearTrail, ownerId])

  const announceTrailOpened = useCallback(() => {
    window.dispatchEvent(new CustomEvent(TRAIL_OPENED_EVENT, {detail: {ownerId}}))
  }, [ownerId])

  const handleSkillClick = useCallback(
    (name: string, e: React.MouseEvent) => {
      if (!fullData) return
      const result = resolveCardInfo(fullData, name)
      if (!result) return
      const entry = buildSkillTrailEntry(result.card, result.label)
      if (isSameTrailRoot(trail, entry.key)) return
      const anchorElement = e.currentTarget as HTMLElement
      const rect = anchorElement.getBoundingClientRect()
      announceTrailOpened()
      setTrailAnchorElement(anchorElement)
      setTrailAnchorRect(rect)
      setTrail((prev) => openTrailRoot(prev, entry))
    },
    [announceTrailOpened, fullData, trail],
  )

  const handleMechanicClick = useCallback(
    (tag: Tag, e: React.MouseEvent) => {
      const entry = buildTagTrailEntry(tag)
      if (isSameTrailRoot(trail, entry.key)) return
      const anchorElement = e.currentTarget as HTMLElement
      const rect = anchorElement.getBoundingClientRect()
      announceTrailOpened()
      setTrailAnchorElement(anchorElement)
      setTrailAnchorRect(rect)
      setTrail((prev) => openTrailRoot(prev, entry))
    },
    [announceTrailOpened, trail],
  )

  const openNestedSkill = useCallback(
    (name: string) => {
      if (!fullData) return
      const result = resolveCardInfo(fullData, name)
      if (!result) return
      const entry = buildSkillTrailEntry(result.card, result.label)
      setTrail((prev) => pushTrailEntry(prev, entry))
    },
    [fullData],
  )

  const openNestedTag = useCallback((tag: Tag) => {
    const entry = buildTagTrailEntry(tag)
    setTrail((prev) => pushTrailEntry(prev, entry))
  }, [])

  const closeTrailTop = useCallback(() => {
    setTrail((prev) => {
      const next = closeTrailTopEntry(prev)
      if (next.length === 0) {
        setTrailAnchorRect(null)
      }
      return next
    })
  }, [])

  const closeTrailFrom = useCallback((index: number) => {
    setTrail((prev) => {
      const next = closeTrailFromIndex(prev, index)
      if (next.length === 0) {
        setTrailAnchorRect(null)
      }
      return next
    })
  }, [])

  const handleNavigateToCards = useCallback(() => {
    clearTrail()
    onNavigateToCards?.()
  }, [clearTrail, onNavigateToCards])

  return (
    <>
      <span>
        {segments.map((seg, i) => (
          <RichSegmentRenderer
            key={i}
            onMechanicClick={handleMechanicClick}
            onSkillClick={handleSkillClick}
            segment={seg}
            skillLevel={skillLevel}
            stats={stats}
            variant='inline'
          />
        ))}
      </span>
      {trailAnchorRect && trail.length > 0
        ? createPortal(
            <PopoverTrailPanel
              anchorElement={trailAnchorElement}
              anchorRect={trailAnchorRect}
              itemCount={trail.length}
              onCloseTop={closeTrailTop}
            >
              {trail.map((entry, index) =>
                entry.kind === 'skill' ? (
                  <SkillPopover
                    cardNames={rouseAwareCards}
                    description={entry.description}
                    key={entry.key}
                    label={entry.label}
                    name={entry.name}
                    onClose={() => {
                      closeTrailFrom(index)
                    }}
                    onMechanicTokenClick={openNestedTag}
                    onNavigateToCards={onNavigateToCards ? handleNavigateToCards : undefined}
                    onSkillTokenClick={openNestedSkill}
                    stats={stats}
                  />
                ) : (
                  <TagPopover
                    cardNames={rouseAwareCards}
                    key={entry.key}
                    onClose={() => {
                      closeTrailFrom(index)
                    }}
                    onMechanicTokenClick={openNestedTag}
                    onSkillTokenClick={openNestedSkill}
                    tag={entry.tag}
                  />
                ),
              )}
            </PopoverTrailPanel>,
            document.body,
          )
        : null}
    </>
  )
}

function buildSkillTrailEntry(card: AwakenerCard, label: string): SkillTrailEntry {
  return {
    kind: 'skill',
    key: `skill:${card.name.toLowerCase()}`,
    name: card.name,
    label,
    description: card.description,
  }
}

function buildTagTrailEntry(tag: Tag): TagTrailEntry {
  return {
    kind: 'tag',
    key: `tag:${tag.key.toLowerCase()}`,
    tag,
  }
}

function createDescriptionCardInfo(name: string, description: string, label: string): CardInfo {
  return {
    card: {name, cost: '—', description},
    label,
  }
}

function hasRouseCard(fullData: AwakenerFull): boolean {
  return Object.hasOwn(fullData.cards, 'C1')
}

function findRouseCardInfo(fullData: AwakenerFull, name: string): CardInfo | null {
  if (name !== 'Rouse' || !hasRouseCard(fullData)) {
    return null
  }
  const rouseCard = fullData.cards.C1

  return {card: rouseCard, label: `Rouse · Cost ${rouseCard.cost}`}
}

function findStandardCardInfo(fullData: AwakenerFull, name: string): CardInfo | null {
  for (const [key, card] of Object.entries(fullData.cards)) {
    if (card.name !== name) {
      continue
    }

    const slotLabel = key === 'C1' ? 'Rouse' : key
    return {card, label: `${slotLabel} · Cost ${card.cost}`}
  }

  return null
}

function findExaltCardInfo(fullData: AwakenerFull, name: string): CardInfo | null {
  if (fullData.exalts.exalt.name === name) {
    return createDescriptionCardInfo(name, fullData.exalts.exalt.description, 'Exalt')
  }

  if (fullData.exalts.over_exalt.name === name) {
    return createDescriptionCardInfo(name, fullData.exalts.over_exalt.description, 'Over Exalt')
  }

  return null
}

function findTalentCardInfo(fullData: AwakenerFull, name: string): CardInfo | null {
  for (const [key, talent] of Object.entries(fullData.talents)) {
    if (talent.name === name) {
      return createDescriptionCardInfo(name, talent.description, `Talent · ${key}`)
    }
  }

  return null
}

function findEnlightenCardInfo(fullData: AwakenerFull, name: string): CardInfo | null {
  for (const [key, enlighten] of Object.entries(fullData.enlightens)) {
    if (enlighten.name === name) {
      return createDescriptionCardInfo(name, enlighten.description, `Enlighten · ${key}`)
    }
  }

  return null
}

function resolveCardInfo(fullData: AwakenerFull, name: string): CardInfo | null {
  return (
    findRouseCardInfo(fullData, name) ??
    findStandardCardInfo(fullData, name) ??
    findExaltCardInfo(fullData, name) ??
    findTalentCardInfo(fullData, name) ??
    findEnlightenCardInfo(fullData, name)
  )
}
