import {lazy, Suspense, useState, type ReactNode} from 'react'

import {createPortal} from 'react-dom'

import type {AwakenerEnlightenRecord} from '@/domain/awakener-source-schema'
import type {ResolvedAwakenerDatabaseShellView} from '@/domain/awakeners-database-view'
import type {ResolvedDatabaseReferenceLayer} from '@/domain/database-reference-layer'
import type {PublicFormulaContext} from '@/domain/public-formula-context'

import type {DatabasePopoverPortalEntry} from './DatabasePopoverPortal'
import type {FontScale} from './font-scale'

const DatabasePopoverPortal = lazy(() =>
  import('./DatabasePopoverPortal').then((module) => ({default: module.DatabasePopoverPortal})),
)

function getPopoverPortalRoot(anchorElement?: HTMLElement | null): Element {
  return (
    anchorElement?.closest(
      '[data-detail-modal-shell], [data-detail-modal-overlay], [data-modal-frame-dialog]',
    ) ?? document.body
  )
}

export interface DatabasePopoverRootProps {
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
  showTagIcons?: boolean
  showVisibleScaling?: boolean
  fontScale?: FontScale
}

export function DatabasePopoverRoot({
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
  showTagIcons = true,
  showVisibleScaling = true,
  fontScale = 'small',
}: DatabasePopoverRootProps) {
  if (!anchorRect || entries.length === 0) {
    return null
  }

  return (
    <DatabasePopoverSessionPortal key={entries[0]?.key} anchorElement={anchorElement}>
      <Suspense fallback={null}>
        <DatabasePopoverPortal
          anchorElement={anchorElement}
          anchorRect={anchorRect}
          entries={entries}
          formulaContext={formulaContext}
          closeOnOutsideClick={closeOnOutsideClick}
          onCloseAll={onCloseAll}
          onToggleEnlightenSlot={onToggleEnlightenSlot}
          referenceLayer={referenceLayer}
          selectedEnlightenSlot={selectedEnlightenSlot}
          showTagIcons={showTagIcons}
          showVisibleScaling={showVisibleScaling}
          stats={stats}
          fontScale={fontScale}
        />
      </Suspense>
    </DatabasePopoverSessionPortal>
  )
}

function DatabasePopoverSessionPortal({
  anchorElement,
  children,
}: {
  anchorElement?: HTMLElement | null
  children: ReactNode
}) {
  const [portalRoot] = useState(() => getPopoverPortalRoot(anchorElement))
  return createPortal(children, portalRoot)
}
