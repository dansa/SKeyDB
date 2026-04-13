import {useCallback, useMemo} from 'react'

import {createPortal} from 'react-dom'

import type {AwakenerFull, AwakenerFullStats} from '@/domain/awakeners-full'
import {parseRichDescription} from '@/domain/rich-text'
import {type Tag} from '@/domain/tags'

import {PopoverTrailPanel} from '../RichTextPopovers/PopoverTrailPanel'
import {ScalingPopover} from '../RichTextPopovers/ScalingPopover'
import {SkillPopover} from '../RichTextPopovers/SkillPopover'
import {TagPopover} from '../RichTextPopovers/TagPopover'
import {hasRouseRichDescriptionCard} from './rich-description-entries'
import {nextRichSegmentKey} from './rich-segment-keys'
import {RichSegmentRenderer} from './RichSegmentRenderer'
import {useRichDescriptionTrail} from './useRichDescriptionTrail'

type RichDescriptionProps = Readonly<{
  text: string
  cardNames: Set<string>
  fullData: AwakenerFull | null
  stats: AwakenerFullStats | null
  skillLevel: number
  onNavigateToCards?: () => void
}>

export function RichDescription({
  text,
  cardNames,
  fullData,
  stats,
  skillLevel,
  onNavigateToCards,
}: RichDescriptionProps) {
  const rouseAwareCards = useMemo(() => {
    const names = new Set(cardNames)
    if (fullData) {
      if (hasRouseRichDescriptionCard(fullData) && !names.has('Rouse')) {
        names.add('Rouse')
      }
      names.add('exalt')
      names.add('over_exalt')
    }
    return names
  }, [cardNames, fullData])

  const segments = parseRichDescription(text, rouseAwareCards)
  const {
    trail,
    trailAnchorRect,
    trailAnchorElement,
    clearTrail,
    openSkillTrail,
    openTagTrail,
    openScalingTrail,
    openNestedSkillTrail,
    openNestedTagTrail,
    openNestedScalingTrail,
    closeTrailTop,
    closeTrailFrom,
  } = useRichDescriptionTrail(fullData)

  const handleNavigateToCards = useCallback(() => {
    if (onNavigateToCards) {
      clearTrail()
      onNavigateToCards()
    }
  }, [clearTrail, onNavigateToCards])

  const renderedSegments = renderRichDescriptionSegments(
    segments,
    openTagTrail,
    openScalingTrail,
    openSkillTrail,
    skillLevel,
    stats,
  )

  return (
    <>
      {renderedSegments}
      {trail.length > 0 &&
        trailAnchorRect &&
        trailAnchorElement &&
        createPortal(
          <PopoverTrailPanel
            anchorElement={trailAnchorElement}
            anchorRect={trailAnchorRect}
            entryRects={trail.map((entry) => entry.rect)}
            itemCount={trail.length}
            onCloseTop={closeTrailTop}
          >
            {trail.map((entry, index) => {
              if (entry.kind === 'skill') {
                return (
                  <SkillPopover
                    cardNames={rouseAwareCards}
                    description={entry.description}
                    key={entry.key}
                    label={entry.label}
                    name={entry.name}
                    onClose={() => {
                      closeTrailFrom(index)
                    }}
                    onMechanicTokenClick={(tag, event) => {
                      openNestedTagTrail(tag, index, event)
                    }}
                    onNavigateToCards={onNavigateToCards ? handleNavigateToCards : undefined}
                    onScalingTokenClick={(values, nextSuffix, nextStat, event) => {
                      openNestedScalingTrail(values, nextSuffix, nextStat, index, event)
                    }}
                    onSkillTokenClick={(nextName, event) => {
                      openNestedSkillTrail(nextName, index, event)
                    }}
                    skillLevel={skillLevel}
                    stats={stats}
                  />
                )
              }

              if (entry.kind === 'tag') {
                return (
                  <TagPopover
                    cardNames={rouseAwareCards}
                    key={entry.key}
                    onClose={() => {
                      closeTrailFrom(index)
                    }}
                    onMechanicTokenClick={(tag, event) => {
                      openNestedTagTrail(tag, index, event)
                    }}
                    onScalingTokenClick={(values, nextSuffix, nextStat, event) => {
                      openNestedScalingTrail(values, nextSuffix, nextStat, index, event)
                    }}
                    onSkillTokenClick={(nextName, event) => {
                      openNestedSkillTrail(nextName, index, event)
                    }}
                    skillLevel={skillLevel}
                    stats={stats}
                    tag={entry.tag}
                  />
                )
              }

              return (
                <ScalingPopover
                  currentLevel={index === 0 ? skillLevel : 0}
                  key={entry.key}
                  onClose={() => {
                    closeTrailFrom(index)
                  }}
                  stat={entry.stat}
                  stats={stats}
                  suffix={entry.suffix}
                  values={entry.values}
                />
              )
            })}
          </PopoverTrailPanel>,
          document.body,
        )}
    </>
  )
}

function renderRichDescriptionSegments(
  segments: ReturnType<typeof parseRichDescription>,
  onMechanicClick: (tag: Tag, event: React.MouseEvent) => void,
  onScalingClick: (
    values: number[],
    suffix: string,
    stat: string | null,
    event: React.MouseEvent,
  ) => void,
  onSkillClick: (name: string, event: React.MouseEvent) => void,
  skillLevel: number,
  stats: AwakenerFullStats | null,
) {
  const keyCounts = new Map<string, number>()
  return segments.map((segment) => {
    const key = nextRichSegmentKey(keyCounts, segment)
    return (
      <RichSegmentRenderer
        key={key}
        onMechanicClick={onMechanicClick}
        onScalingClick={onScalingClick}
        onSkillClick={onSkillClick}
        segment={segment}
        skillLevel={skillLevel}
        stats={stats}
        variant='inline'
      />
    )
  })
}
