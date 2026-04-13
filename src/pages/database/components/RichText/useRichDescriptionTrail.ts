import {useCallback, useEffect, useId, useState} from 'react'

import type {AwakenerFull} from '@/domain/awakeners-full'
import {type Tag} from '@/domain/tags'

import {
  closeTrailFromIndex,
  closeTrailTop as closeTrailTopEntry,
  isSameTrailRoot,
  openTrailRoot,
  pushTrailEntry,
  type TrailEntry,
} from '../../utils/popover-trail'
import {
  buildRichDescriptionScalingTrailEntry,
  buildRichDescriptionSkillTrailEntry,
  buildRichDescriptionTagTrailEntry,
  resolveRichDescriptionCardInfo,
} from './rich-description-entries'

const TRAIL_OPENED_EVENT = 'database:trail-opened'

export function useRichDescriptionTrail(fullData: AwakenerFull | null) {
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

    globalThis.addEventListener(TRAIL_OPENED_EVENT, handleTrailOpened as EventListener)
    return () => {
      globalThis.removeEventListener(TRAIL_OPENED_EVENT, handleTrailOpened as EventListener)
    }
  }, [clearTrail, ownerId])

  const announceTrailOpened = useCallback(() => {
    globalThis.dispatchEvent(new CustomEvent(TRAIL_OPENED_EVENT, {detail: {ownerId}}))
  }, [ownerId])

  const openSkillTrail = useCallback(
    (name: string, event: React.MouseEvent) => {
      if (!fullData) return
      const result = resolveRichDescriptionCardInfo(fullData, name)
      if (!result) return
      const entry = buildRichDescriptionSkillTrailEntry(result.card, result.label)
      if (isSameTrailRoot(trail, entry.key)) return
      const anchorElement = event.currentTarget as HTMLElement
      const rect = anchorElement.getBoundingClientRect()
      announceTrailOpened()
      setTrailAnchorElement(anchorElement)
      setTrailAnchorRect(rect)
      setTrail((prev) => openTrailRoot(prev, entry))
    },
    [announceTrailOpened, fullData, trail],
  )

  const openTagTrail = useCallback(
    (tag: Tag, event: React.MouseEvent) => {
      const entry = buildRichDescriptionTagTrailEntry(tag)
      if (isSameTrailRoot(trail, entry.key)) return
      const anchorElement = event.currentTarget as HTMLElement
      const rect = anchorElement.getBoundingClientRect()
      announceTrailOpened()
      setTrailAnchorElement(anchorElement)
      setTrailAnchorRect(rect)
      setTrail((prev) => openTrailRoot(prev, entry))
    },
    [announceTrailOpened, trail],
  )

  const openScalingTrail = useCallback(
    (values: number[], suffix: string, stat: string | null, event: React.MouseEvent) => {
      const entry = buildRichDescriptionScalingTrailEntry(values, suffix, stat)
      if (isSameTrailRoot(trail, entry.key)) return
      const anchorElement = event.currentTarget as HTMLElement
      const rect = anchorElement.getBoundingClientRect()
      announceTrailOpened()
      setTrailAnchorElement(anchorElement)
      setTrailAnchorRect(rect)
      setTrail((prev) => openTrailRoot(prev, entry))
    },
    [announceTrailOpened, trail],
  )

  const openNestedSkillTrail = useCallback(
    (name: string, sourceIndex: number, event: React.MouseEvent) => {
      if (!fullData) return
      const result = resolveRichDescriptionCardInfo(fullData, name)
      if (!result) return
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
      const entry = buildRichDescriptionSkillTrailEntry(result.card, result.label, rect)
      setTrail((prev) => pushTrailEntry(prev.slice(0, sourceIndex + 1), entry))
    },
    [fullData],
  )

  const openNestedTagTrail = useCallback(
    (tag: Tag, sourceIndex: number, event: React.MouseEvent) => {
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
      const entry = buildRichDescriptionTagTrailEntry(tag, rect)
      setTrail((prev) => pushTrailEntry(prev.slice(0, sourceIndex + 1), entry))
    },
    [],
  )

  const openNestedScalingTrail = useCallback(
    (
      values: number[],
      suffix: string,
      stat: string | null,
      sourceIndex: number,
      event: React.MouseEvent,
    ) => {
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
      const entry = buildRichDescriptionScalingTrailEntry(values, suffix, stat, rect)
      setTrail((prev) => pushTrailEntry(prev.slice(0, sourceIndex + 1), entry))
    },
    [],
  )

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

  return {
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
  }
}
