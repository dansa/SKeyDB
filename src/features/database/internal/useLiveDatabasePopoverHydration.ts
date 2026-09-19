import {useEffect, useMemo, useRef, type Dispatch, type SetStateAction} from 'react'

import type {AwakenerEnlightenRecord, FullStats} from '@/domain/awakener-source-schema'
import type {ResolvedDatabaseReferenceLayer} from '@/domain/database-reference-layer'
import {hydrateGlobalDatabaseReferenceInfo} from '@/domain/global-database-reference-layer'
import type {PublicFormulaContext} from '@/domain/public-formula-context'

import {
  buildTrailEntry,
  needsLazyReferenceHydration,
  withDescriptionRankContext,
} from './database-popover-controller-model'
import type {TrailEntry} from './popover-trail'

interface LiveContext {
  referenceLayer: ResolvedDatabaseReferenceLayer | null
  formulaContext?: PublicFormulaContext
  stats: FullStats | null
  selectedEnlightenSlot: AwakenerEnlightenRecord['slot'] | null
}

// Opening a reference already hydrates it. Subsequent context changes must also
// hydrate catalog placeholders, which the synchronous live resolver cannot use.
export function useLiveDatabasePopoverHydration({
  trail,
  setTrail,
  referenceLayer,
  formulaContext,
  stats,
  selectedEnlightenSlot,
}: LiveContext & {trail: TrailEntry[]; setTrail: Dispatch<SetStateAction<TrailEntry[]>>}) {
  const contexts = useRef(new WeakMap<TrailEntry, LiveContext>())
  const context = useMemo(
    () => ({referenceLayer, formulaContext, stats, selectedEnlightenSlot}),
    [referenceLayer, formulaContext, stats, selectedEnlightenSlot],
  )

  useEffect(() => {
    let cancelled = false
    const updates = trail.map(async (entry) => {
      const previousContext = contexts.current.get(entry)
      if (!previousContext) {
        contexts.current.set(entry, context)
        return entry
      }
      if (previousContext === context) return entry
      const layer = entry.referenceLayerOverride ?? context.referenceLayer
      const familyReference = entry.referenceId && layer?.referenceInfoById.get(entry.referenceId)
      const reference =
        familyReference && entry.referenceVariantId
          ? {...familyReference, variantId: entry.referenceVariantId}
          : familyReference
      if (!reference || !needsLazyReferenceHydration(reference)) return entry

      try {
        const hydrated = await hydrateGlobalDatabaseReferenceInfo(
          reference,
          context.formulaContext,
          context.stats,
          context.selectedEnlightenSlot,
        )
        if (!hydrated.description) return entry
        const refreshed = buildTrailEntry(
          hydrated,
          context.selectedEnlightenSlot,
          entry.referenceLayerOverride ?? null,
        )
        return hydrated.kind === 'overlay'
          ? withDescriptionRankContext(refreshed, entry)
          : refreshed
      } catch {
        // Keep the last usable description if loading fails; a later change retries.
        return entry
      }
    })
    void Promise.all(updates).then((refreshed) => {
      if (cancelled || refreshed.every((entry, index) => entry === trail[index])) return
      setTrail((current) => (current === trail ? refreshed : current))
    })
    return () => {
      cancelled = true
    }
  }, [context, setTrail, trail])
}
