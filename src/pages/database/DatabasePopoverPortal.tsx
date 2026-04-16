import type {AwakenerEnlightenRecord, AwakenerOverlayRecord} from '@/domain/awakener-source-schema'
import type {
  ResolvedAwakenerDatabaseReferenceLayer,
  ResolvedAwakenerDatabaseShellView,
} from '@/domain/awakeners-database-view'

import {DatabaseReferencePopover} from './DatabaseReferencePopover'
import type {KeyedDatabaseReferenceEntry} from './database-reference-entry'
import type {FontScale} from './font-scale'
import type {TrailEntry} from './popover-trail'
import {PopoverTrailPanel} from './PopoverTrailPanel'

export interface DatabasePopoverPortalEntry {
  activeEntry: TrailEntry
  key: string
  layerIndex: number
  onClose: () => void
  onInfoEntryClick?: (entry: KeyedDatabaseReferenceEntry) => void
  onMechanicTokenClick: (overlay: AwakenerOverlayRecord) => void
  onNavigateToCards?: () => void
  onSkillTokenClick: (name: string) => void
}

interface DatabasePopoverPortalProps {
  anchorElement?: HTMLElement | null
  anchorRect: DOMRect
  referenceLayer: ResolvedAwakenerDatabaseReferenceLayer | null
  stats: ResolvedAwakenerDatabaseShellView['stats']
  entries: DatabasePopoverPortalEntry[]
  onCloseAll: () => void
  onToggleEnlightenSlot?: (slot: AwakenerEnlightenRecord['slot']) => void
  selectedEnlightenSlot?: AwakenerEnlightenRecord['slot'] | null
  showTagIcons?: boolean
  showVisibleScaling?: boolean
  fontScale?: FontScale
}

export function DatabasePopoverPortal({
  anchorElement,
  anchorRect,
  referenceLayer,
  stats,
  entries,
  onCloseAll,
  onToggleEnlightenSlot,
  selectedEnlightenSlot = null,
  showTagIcons = true,
  showVisibleScaling = true,
  fontScale = 'small',
}: DatabasePopoverPortalProps) {
  return (
    <PopoverTrailPanel
      anchorElement={anchorElement}
      anchorRect={anchorRect}
      fontScale={fontScale}
      itemCount={entries.length}
      onCloseAll={onCloseAll}
    >
      {entries.map((entry) => (
        <DatabaseReferencePopover
          entry={entry.activeEntry}
          key={entry.key}
          layerCount={entries.length}
          layerIndex={entry.layerIndex}
          onClose={entry.onClose}
          onInfoEntryClick={entry.onInfoEntryClick}
          onMechanicTokenClick={entry.onMechanicTokenClick}
          onNavigateToCards={entry.onNavigateToCards}
          onSkillTokenClick={entry.onSkillTokenClick}
          onToggleEnlightenSlot={onToggleEnlightenSlot}
          referenceLayer={referenceLayer}
          selectedEnlightenSlot={selectedEnlightenSlot}
          showTagIcons={showTagIcons}
          showVisibleScaling={showVisibleScaling}
          stats={stats}
        />
      ))}
    </PopoverTrailPanel>
  )
}
