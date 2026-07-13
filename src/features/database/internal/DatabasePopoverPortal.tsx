import {useCallback, useEffect, useEffectEvent, useRef, useState, type MouseEvent} from 'react'

import {DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent} from '@dnd-kit/core'

import type {
  AwakenerEnlightenRecord,
  AwakenerOverlayRecord,
  FullStats,
} from '@/domain/awakener-source-schema'
import type {ResolvedAwakenerDatabaseShellView} from '@/domain/awakeners-database-view'
import type {ResolvedDatabaseReferenceLayer} from '@/domain/database-reference-layer'
import type {PublicFormulaContext} from '@/domain/public-formula-context'

import type {KeyedDatabaseReferenceEntry} from './database-reference-entry'
import {DatabaseReferencePopover} from './DatabaseReferencePopover'
import {clampOffset} from './popover-layout-math'
import {decideTrailDirection, isTrailMobileLayout} from './popover-trail'
import {PopoverErrorBoundary} from './PopoverErrorBoundary'
import {DesktopPopoverTrailPanel, MobilePopoverTrailPanel} from './PopoverTrailPanelLayouts'
import {
  usePopoverActions,
  usePopoverOffsets,
  type DatabasePopoverDescriptionRankContext,
} from './usePopoverStore'
import {useResolvedPopoverVisualData} from './useResolvedPopoverVisualData'

export interface DatabasePopoverPortalEntry {
  activeEntry: KeyedDatabaseReferenceEntry
  key: string
  layerIndex: number
  onClose: () => void
  onInfoEntryClick?: (entry: KeyedDatabaseReferenceEntry, event?: MouseEvent) => void
  onMechanicTokenClick: (
    overlay: AwakenerOverlayRecord,
    rankContext?: DatabasePopoverDescriptionRankContext,
    event?: MouseEvent,
  ) => void
  onNavigate?: () => void
  onSkillTokenClick: (name: string, event?: MouseEvent) => void
  referenceLayer?: ResolvedDatabaseReferenceLayer | null
}

interface DatabasePopoverPortalProps {
  anchorElement?: HTMLElement | null
  anchorRect: DOMRect | null
  referenceLayer: ResolvedDatabaseReferenceLayer | null
  formulaContext?: PublicFormulaContext
  stats: ResolvedAwakenerDatabaseShellView['stats']
  entries: DatabasePopoverPortalEntry[]
  onCloseAll: () => void
  closeOnOutsideClick?: boolean
  onToggleEnlightenSlot?: (slot: AwakenerEnlightenRecord['slot']) => void
  selectedEnlightenSlot?: AwakenerEnlightenRecord['slot'] | null
}

function PopoverItemRenderer({
  entry,
  formulaContext,
  totalDepth,
  onToggleEnlightenSlot,
  referenceLayer,
  selectedEnlightenSlot,
  stats,
}: {
  entry: DatabasePopoverPortalEntry
  formulaContext: PublicFormulaContext | null
  totalDepth: number
  onToggleEnlightenSlot?: (slot: AwakenerEnlightenRecord['slot']) => void
  referenceLayer: ResolvedDatabaseReferenceLayer | null
  selectedEnlightenSlot: AwakenerEnlightenRecord['slot'] | null
  stats: FullStats | null
}) {
  const visualData = useResolvedPopoverVisualData({
    entry: entry.activeEntry,
    referenceLayer: entry.referenceLayer ?? referenceLayer,
    formulaContext,
    stats,
    selectedEnlightenSlot,
    depth: entry.layerIndex + 1,
    totalDepth,
    onNavigate: entry.onNavigate,
    onClose: entry.onClose,
    onSkillTokenClick: entry.onSkillTokenClick,
    onToggleEnlightenSlot,
  })

  return (
    <DatabaseReferencePopover
      visualData={visualData}
      onClose={entry.onClose}
      onInfoEntryClick={entry.onInfoEntryClick}
      onSkillTokenClick={entry.onSkillTokenClick}
      onMechanicTokenClick={entry.onMechanicTokenClick}
      onNavigate={entry.onNavigate}
    />
  )
}

export function DatabasePopoverPortal({
  anchorElement,
  anchorRect,
  referenceLayer,
  formulaContext,
  stats,
  entries,
  onCloseAll,
  closeOnOutsideClick = false,
  onToggleEnlightenSlot,
  selectedEnlightenSlot = null,
}: DatabasePopoverPortalProps) {
  const {updateOffset} = usePopoverActions()
  const offsets = usePopoverOffsets()
  const [viewportWidth, setViewportWidth] = useState(globalThis.innerWidth)

  useEffect(() => {
    let timeoutId: number | undefined
    const handleResize = () => {
      if (timeoutId !== undefined) {
        cancelAnimationFrame(timeoutId)
      }
      timeoutId = requestAnimationFrame(() => {
        setViewportWidth(globalThis.innerWidth)
      })
    }
    globalThis.addEventListener('resize', handleResize)
    return () => {
      globalThis.removeEventListener('resize', handleResize)
      if (timeoutId !== undefined) {
        cancelAnimationFrame(timeoutId)
      }
    }
  }, [])

  const isMobile = isTrailMobileLayout(viewportWidth)
  const containerRef = useRef<HTMLDivElement>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 4,
      },
    }),
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const {active, delta} = event
      const id = active.id as string
      const currentOffset = offsets[id] ?? {x: 0, y: 0}
      const element = containerRef.current?.querySelector<HTMLElement>(`[data-popover-id="${id}"]`)

      if (element) {
        const rect = element.getBoundingClientRect()
        const layoutLeft = parseFloat(element.style.left) || 0
        const layoutTop = parseFloat(element.style.top) || 0
        const targetLeft = layoutLeft + currentOffset.x + delta.x
        const targetTop = layoutTop + currentOffset.y + delta.y
        const nextOffset = clampOffset({
          targetLeft,
          targetTop,
          popoverWidth: rect.width,
          popoverHeight: rect.height,
          viewport: {width: globalThis.innerWidth, height: globalThis.innerHeight},
          margin: 12,
          layoutLeft,
          layoutTop,
        })
        updateOffset(id, nextOffset.x, nextOffset.y)
      } else {
        updateOffset(id, currentOffset.x + delta.x, currentOffset.y + delta.y)
      }
    },
    [offsets, updateOffset],
  )

  const currentAnchorRect = anchorElement?.isConnected
    ? anchorElement.getBoundingClientRect()
    : anchorRect

  const direction = isMobile
    ? 'down'
    : currentAnchorRect
      ? decideTrailDirection(currentAnchorRect, globalThis.innerHeight)
      : 'down'

  const renderEntry = useCallback(
    (entry: DatabasePopoverPortalEntry) => {
      return (
        <PopoverErrorBoundary key={entry.key}>
          <PopoverItemRenderer
            entry={entry}
            formulaContext={formulaContext ?? null}
            totalDepth={entries.length}
            onToggleEnlightenSlot={onToggleEnlightenSlot}
            referenceLayer={referenceLayer}
            selectedEnlightenSlot={selectedEnlightenSlot}
            stats={stats}
          />
        </PopoverErrorBoundary>
      )
    },
    [
      formulaContext,
      entries.length,
      onToggleEnlightenSlot,
      referenceLayer,
      selectedEnlightenSlot,
      stats,
    ],
  )

  const onCloseAllEvent = useEffectEvent(onCloseAll)

  useEffect(() => {
    if (!closeOnOutsideClick) {
      return
    }
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target
      if (!(target instanceof Node)) {
        return
      }
      if (containerRef.current?.contains(target)) {
        return
      }
      if (anchorElement?.isConnected && anchorElement.contains(target)) {
        return
      }
      onCloseAllEvent()
    }
    globalThis.addEventListener('pointerdown', handlePointerDown)
    return () => {
      globalThis.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [anchorElement, closeOnOutsideClick])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (entries.length > 0) {
          event.preventDefault()
          entries[entries.length - 1].onClose()
        }
      }
    }
    globalThis.addEventListener('keydown', handleKeyDown)
    return () => {
      globalThis.removeEventListener('keydown', handleKeyDown)
    }
  }, [entries])

  if (isMobile) {
    return (
      <div ref={containerRef} className='contents'>
        <MobilePopoverTrailPanel
          containerRef={containerRef}
          entries={entries}
          itemCount={entries.length}
          onCloseTop={() => {
            if (entries.length > 0) {
              entries[entries.length - 1].onClose()
            }
          }}
          onCloseAll={onCloseAll}
          renderEntry={renderEntry}
        />
      </div>
    )
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <DesktopPopoverTrailPanel
        containerRef={containerRef}
        currentAnchorRect={currentAnchorRect}
        direction={direction}
        entries={entries}
        renderEntry={renderEntry}
      />
    </DndContext>
  )
}
