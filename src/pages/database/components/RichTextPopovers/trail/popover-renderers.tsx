import type {AwakenerFullStats} from '@/domain/awakeners-full'
import type {Tag} from '@/domain/tags'
import type {
  ScalingTrailEntry,
  SkillTrailEntry,
  TagTrailEntry,
  TrailEntry,
} from '@/pages/database/utils/popover-trail'

import type {PopoverAnchorElement} from '../core/popover-anchor'
import {type TokenNavigationRequest} from '../core/popover-navigation'
import {ScalingPopover} from '../entries/ScalingPopover'
import {SkillPopover} from '../entries/SkillPopover'
import {TagPopover} from '../entries/TagPopover'

type NestedOpeners = Readonly<{
  openNestedSkillTrail: (
    name: string,
    sourceIndex: number,
    anchorElement: PopoverAnchorElement,
    sourceIsFloating?: boolean,
  ) => void
  openNestedTagTrail: (
    tag: Tag,
    sourceIndex: number,
    anchorElement: PopoverAnchorElement,
    sourceIsFloating?: boolean,
  ) => void
  openNestedScalingTrail: (
    values: number[],
    suffix: string,
    stat: string | null,
    sourceIndex: number,
    anchorElement: PopoverAnchorElement,
    sourceIsFloating?: boolean,
  ) => void
}>

export type TrailEntryRenderContext = Readonly<{
  depth: number
  totalDepth: number
  sourceIndex: number
  sourceIsFloating?: boolean
  cardNames: Set<string>
  skillLevel: number
  stats: AwakenerFullStats | null
  onBack?: () => void
  onClose: () => void
  onNavigateToCards?: () => void
}> &
  NestedOpeners

type TrailEntryRenderer<K extends TrailEntry['kind']> = (
  entry: Extract<TrailEntry, {kind: K}>,
  context: TrailEntryRenderContext,
) => React.JSX.Element

type PopoverRenderers = {
  [K in TrailEntry['kind']]: TrailEntryRenderer<K>
}

export const POPOVER_RENDERERS: PopoverRenderers = {
  skill: renderSkillTrailEntry,
  tag: renderTagTrailEntry,
  scaling: renderScalingTrailEntry,
}

export function renderTrailEntry(entry: TrailEntry, context: TrailEntryRenderContext) {
  const renderer = POPOVER_RENDERERS[entry.kind] as (
    entry: TrailEntry,
    context: TrailEntryRenderContext,
  ) => React.JSX.Element
  return renderer(entry, context)
}

function createNestedTokenNavigator(context: TrailEntryRenderContext) {
  return (request: TokenNavigationRequest) => {
    switch (request.kind) {
      case 'skill':
        context.openNestedSkillTrail(
          request.name,
          context.sourceIndex,
          request.anchorElement,
          context.sourceIsFloating,
        )
        return
      case 'tag':
        context.openNestedTagTrail(
          request.tag,
          context.sourceIndex,
          request.anchorElement,
          context.sourceIsFloating,
        )
        return
      case 'scaling':
        context.openNestedScalingTrail(
          request.values,
          request.suffix,
          request.stat,
          context.sourceIndex,
          request.anchorElement,
          context.sourceIsFloating,
        )
    }
  }
}

function renderSkillTrailEntry(entry: SkillTrailEntry, context: TrailEntryRenderContext) {
  const onTokenNavigate = createNestedTokenNavigator(context)

  return (
    <SkillPopover
      cardNames={context.cardNames}
      cost={entry.cost}
      depth={context.depth}
      description={entry.description}
      key={entry.key}
      label={entry.label}
      name={entry.name}
      onBack={context.onBack}
      onClose={context.onClose}
      onNavigateToCards={context.onNavigateToCards}
      onTokenNavigate={onTokenNavigate}
      skillLevel={context.skillLevel}
      skillType={entry.skillType}
      stats={context.stats}
      totalDepth={context.totalDepth}
    />
  )
}

function renderTagTrailEntry(entry: TagTrailEntry, context: TrailEntryRenderContext) {
  const onTokenNavigate = createNestedTokenNavigator(context)

  return (
    <TagPopover
      cardNames={context.cardNames}
      depth={context.depth}
      key={entry.key}
      onBack={context.onBack}
      onClose={context.onClose}
      onTokenNavigate={onTokenNavigate}
      skillLevel={context.skillLevel}
      stats={context.stats}
      tag={entry.tag}
      totalDepth={context.totalDepth}
    />
  )
}

function renderScalingTrailEntry(entry: ScalingTrailEntry, context: TrailEntryRenderContext) {
  const isPsycheSurgeScaling = entry.key.startsWith('scaling-preview-')

  return (
    <ScalingPopover
      currentLevel={
        isPsycheSurgeScaling
          ? entry.currentLevel
          : context.sourceIndex === 0
            ? context.skillLevel
            : 0
      }
      depth={context.depth}
      key={entry.key}
      levelLabelPrefix={isPsycheSurgeScaling ? 'E3+' : 'Lv.'}
      levelStart={isPsycheSurgeScaling ? 0 : 1}
      onBack={context.onBack}
      onClose={context.onClose}
      stat={entry.stat}
      stats={context.stats}
      suffix={entry.suffix}
      totalDepth={context.totalDepth}
      values={entry.values}
    />
  )
}
