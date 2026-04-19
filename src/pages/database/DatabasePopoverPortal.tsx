import type {AwakenerEnlightenRecord, AwakenerOverlayRecord} from '@/domain/awakener-source-schema'
import type {ResolvedAwakenerDatabaseShellView} from '@/domain/awakeners-database-view'
import type {ResolvedDatabaseReferenceLayer} from '@/domain/database-reference-layer'

import type {KeyedDatabaseReferenceEntry} from './database-reference-entry'
import {DatabaseReferencePopover} from './DatabaseReferencePopover'
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
  onNavigate?: () => void
  onSkillTokenClick: (name: string) => void
  referenceLayer?: ResolvedDatabaseReferenceLayer | null
}

interface DatabasePopoverPortalProps {
  anchorElement?: HTMLElement | null
  anchorRect: DOMRect
  referenceLayer: ResolvedDatabaseReferenceLayer | null
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
          onNavigate={entry.onNavigate}
          onSkillTokenClick={entry.onSkillTokenClick}
          onToggleEnlightenSlot={onToggleEnlightenSlot}
          referenceLayer={entry.referenceLayer ?? referenceLayer}
          selectedEnlightenSlot={selectedEnlightenSlot}
          showTagIcons={showTagIcons}
          showVisibleScaling={showVisibleScaling}
          stats={stats}
        />
      ))}
    </PopoverTrailPanel>
  )
}
