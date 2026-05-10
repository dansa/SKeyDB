import {memo, useCallback, useMemo} from 'react'

import {type Tag} from '@/domain/tags'
import {type TrailEntry} from '@/pages/database/utils/popover-trail'

import {
  buildRichDescriptionScalingTrailEntry,
  buildRichDescriptionSkillTrailEntry,
  buildRichDescriptionTagTrailEntry,
  resolveRichDescriptionCardInfo,
} from '../../RichText/rich-description-entries'
import {snapshotPopoverAnchor, type PopoverAnchorElement} from '../core/popover-anchor'
import {renderTrailEntry} from './popover-renderers'
import {PopoverTrailPanel} from './PopoverTrailPanel'
import {usePopoverStore, type PopoverRenderContext} from './usePopoverStore'

export function GlobalPopoverContainer() {
  const trail = usePopoverStore((state) => state.trail)
  const floating = usePopoverStore((state) => state.floating)
  const anchorRect = usePopoverStore((state) => state.anchorRect)
  const anchorElement = usePopoverStore((state) => state.anchorElement)
  const renderContext = usePopoverStore((state) => state.renderContext)

  const pop = usePopoverStore((state) => state.pop)
  const closeFrom = usePopoverStore((state) => state.closeFrom)
  const pushNested = usePopoverStore((state) => state.pushNested)
  const removeFloating = usePopoverStore((state) => state.removeFloating)

  const openNestedSkillTrail = useCallback(
    (
      name: string,
      sourceIndex: number,
      anchorEl: PopoverAnchorElement,
      sourceIsFloating?: boolean,
    ) => {
      if (!renderContext?.fullData) return
      const info = resolveRichDescriptionCardInfo(renderContext.fullData, name)
      if (!info) return

      const anchor = snapshotPopoverAnchor(anchorEl)
      if (!anchor) return

      const entry = buildRichDescriptionSkillTrailEntry(
        info.card,
        info.label,
        info.skillType,
        anchor.anchorRect,
        anchor.anchorElement,
      )
      pushNested(entry, sourceIndex, sourceIsFloating)
    },
    [renderContext, pushNested],
  )

  const openNestedTagTrail = useCallback(
    (tag: Tag, sourceIndex: number, anchorEl: PopoverAnchorElement, sourceIsFloating?: boolean) => {
      const anchor = snapshotPopoverAnchor(anchorEl)
      if (!anchor) return

      const entry = buildRichDescriptionTagTrailEntry(tag, anchor.anchorRect, anchor.anchorElement)
      pushNested(entry, sourceIndex, sourceIsFloating)
    },
    [pushNested],
  )

  const openNestedScalingTrail = useCallback(
    (
      values: number[],
      suffix: string,
      stat: string | null,
      sourceIndex: number,
      anchorEl: PopoverAnchorElement,
      sourceIsFloating?: boolean,
    ) => {
      const anchor = snapshotPopoverAnchor(anchorEl)
      if (!anchor) return

      const entry = buildRichDescriptionScalingTrailEntry(
        values,
        suffix,
        stat,
        anchor.anchorRect,
        anchor.anchorElement,
      )
      pushNested(entry, sourceIndex, sourceIsFloating)
    },
    [pushNested],
  )

  const navigationHandlers = useMemo(
    () => ({
      openNestedScalingTrail,
      openNestedSkillTrail,
      openNestedTagTrail,
    }),
    [openNestedScalingTrail, openNestedSkillTrail, openNestedTagTrail],
  )

  const hasItems = trail.length > 0 || floating.length > 0
  if (!hasItems || !renderContext) {
    return null
  }

  if (trail.length > 0 && !anchorRect) {
    return null
  }

  const trailRects = trail.map((e) => e.rect)

  return (
    <PopoverTrailPanel
      anchorElement={anchorElement}
      anchorRect={anchorRect ?? ({} as DOMRect)}
      floatingCount={floating.length}
      itemCount={trail.length}
      onCloseTop={pop}
      trailRects={trailRects}
    >
      {floating.map((entry) => (
        <FloatingEntryItem
          context={renderContext}
          entry={entry}
          handlers={navigationHandlers}
          key={entry.key}
          onRemove={removeFloating}
        />
      ))}
      {trail.map((entry, index) => (
        <TrailEntryItem
          context={renderContext}
          entry={entry}
          handlers={navigationHandlers}
          index={index}
          key={entry.key}
          onClose={closeFrom}
          totalDepth={trail.length}
        />
      ))}
    </PopoverTrailPanel>
  )
}

const FloatingEntryItem = memo(function FloatingEntryItem({
  entry,
  context,
  handlers,
  onRemove,
}: {
  entry: TrailEntry
  context: PopoverRenderContext
  handlers: TrailEntryWrapperProps['handlers']
  onRemove: (key: string) => void
}) {
  const onClose = useCallback(() => {
    onRemove(entry.key)
  }, [entry.key, onRemove])

  return (
    <TrailEntryWrapper
      context={context}
      entry={entry}
      handlers={handlers}
      index={0}
      isFloating
      onClose={onClose}
      totalDepth={1}
    />
  )
})

const TrailEntryItem = memo(function TrailEntryItem({
  entry,
  index,
  totalDepth,
  context,
  handlers,
  onClose,
}: {
  entry: TrailEntry
  index: number
  totalDepth: number
  context: PopoverRenderContext
  handlers: TrailEntryWrapperProps['handlers']
  onClose: (index: number) => void
}) {
  const handleClose = useCallback(() => {
    onClose(index)
  }, [index, onClose])

  return (
    <TrailEntryWrapper
      context={context}
      entry={entry}
      handlers={handlers}
      index={index}
      onClose={handleClose}
      totalDepth={totalDepth}
    />
  )
})

interface TrailEntryWrapperProps {
  entry: TrailEntry
  index: number
  totalDepth: number
  context: PopoverRenderContext
  onClose: () => void
  isFloating?: boolean
  handlers: {
    openNestedSkillTrail: (
      name: string,
      sourceIndex: number,
      anchorEl: PopoverAnchorElement,
      sourceIsFloating?: boolean,
    ) => void
    openNestedTagTrail: (
      tag: Tag,
      sourceIndex: number,
      anchorEl: PopoverAnchorElement,
      sourceIsFloating?: boolean,
    ) => void
    openNestedScalingTrail: (
      values: number[],
      suffix: string,
      stat: string | null,
      sourceIndex: number,
      anchorEl: PopoverAnchorElement,
      sourceIsFloating?: boolean,
    ) => void
  }
}

const TrailEntryWrapper = memo(function TrailEntryWrapper({
  entry,
  index,
  totalDepth,
  context,
  onClose,
  handlers,
  isFloating,
}: TrailEntryWrapperProps) {
  const depth = index + 1
  const onBack = index > 0 ? onClose : undefined

  return renderTrailEntry(entry, {
    ...context,
    ...handlers,
    depth,
    onBack,
    onClose,
    sourceIndex: index,
    sourceIsFloating: isFloating,
    totalDepth,
  })
})
