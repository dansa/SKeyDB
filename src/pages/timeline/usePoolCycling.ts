import {useEffect, useMemo, useRef, useState, useSyncExternalStore, type RefObject} from 'react'

import type {BannerFeaturedUnit, BannerPoolSlot} from '@/domain/timeline'

export const CYCLE_INTERVAL_MS = 2500
export const TRANSITION_DURATION_MS = 800

export interface PoolCycleFrame {
  activeIdx: number
  incomingIdx: number
  transitioning: boolean
}

interface UsePoolCyclingOptions {
  enabled?: boolean
}

interface PoolCycleState {
  frames: PoolCycleFrame[]
  signature: string
}

type PendingTransitionMap = Map<number, ReturnType<typeof setTimeout>>

function getPoolFingerprint(pool: BannerFeaturedUnit[]): string {
  return pool
    .map((u) => `${u.kind}:${u.name}:${u.detailLink === false ? 'no-detail' : 'detail'}`)
    .join('|')
}

function buildPoolSignature(poolSlots: BannerPoolSlot[]): string {
  return poolSlots
    .map((slot) => `${slot.linked ? 'linked' : 'slot'}:${getPoolFingerprint(slot.pool)}`)
    .join('||')
}

function buildSharedGroups(fingerprints: string[]): Map<string, number[]> {
  const groups = new Map<string, number[]>()
  fingerprints.forEach((fp, i) => {
    const existing = groups.get(fp)
    if (existing) {
      existing.push(i)
    } else {
      groups.set(fp, [i])
    }
  })
  return groups
}

function buildInitialFrames(
  poolSlots: BannerPoolSlot[],
  sharedGroups: Map<string, number[]>,
): PoolCycleFrame[] {
  const initial: PoolCycleFrame[] = poolSlots.map(() => ({
    activeIdx: 0,
    incomingIdx: -1,
    transitioning: false,
  }))

  for (const group of sharedGroups.values()) {
    if (group.length <= 1) continue
    const poolSize = poolSlots[group[0]].pool.length
    if (poolSize <= 0) continue

    group.forEach((slotIdx, i) => {
      initial[slotIdx].activeIdx = i % poolSize
    })
  }

  return initial
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false

  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function subscribeToReducedMotion(onStoreChange: () => void): () => void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return () => undefined
  }

  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  mediaQuery.addEventListener('change', onStoreChange)

  return () => {
    mediaQuery.removeEventListener('change', onStoreChange)
  }
}

function clearPendingTransition(pendingBySlot: PendingTransitionMap, slotIdx: number) {
  const pending = pendingBySlot.get(slotIdx)
  if (!pending) return

  clearTimeout(pending)
  pendingBySlot.delete(slotIdx)
}

function clearAllPendingTransitions(pendingBySlot: PendingTransitionMap) {
  pendingBySlot.forEach((pending) => {
    clearTimeout(pending)
  })
  pendingBySlot.clear()
}

function getPendingTransitionMap(ref: RefObject<PendingTransitionMap | null>) {
  ref.current ??= new Map()
  return ref.current
}

export function usePoolCycling(
  poolSlots: BannerPoolSlot[],
  {enabled = true}: UsePoolCyclingOptions = {},
): PoolCycleFrame[] {
  const poolSignature = useMemo(() => buildPoolSignature(poolSlots), [poolSlots])
  const fingerprints = useMemo(() => poolSlots.map((s) => getPoolFingerprint(s.pool)), [poolSlots])
  const sharedGroups = useMemo(() => buildSharedGroups(fingerprints), [fingerprints])
  const initialFrames = useMemo(
    () => buildInitialFrames(poolSlots, sharedGroups),
    [poolSlots, sharedGroups],
  )
  const reducedMotion = useSyncExternalStore(
    subscribeToReducedMotion,
    prefersReducedMotion,
    () => false,
  )

  const [cycleState, setCycleState] = useState<PoolCycleState>(() => ({
    frames: initialFrames,
    signature: poolSignature,
  }))

  const pendingBySlotRef = useRef<PendingTransitionMap | null>(null)

  const frames =
    reducedMotion || cycleState.signature !== poolSignature ? initialFrames : cycleState.frames

  useEffect(() => {
    if (!enabled || reducedMotion) return

    const pendingTransitions = getPendingTransitionMap(pendingBySlotRef)
    const cyclableSlots: number[] = []
    for (const [index, slot] of poolSlots.entries()) {
      if (slot.pool.length > 1) {
        cyclableSlots.push(index)
      }
    }
    if (cyclableSlots.length === 0) return

    let deck: number[] = []
    let lastSlot = -1

    function shuffleDeck() {
      deck = [...cyclableSlots]
      for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[deck[i], deck[j]] = [deck[j], deck[i]]
      }
      if (deck.length > 1 && deck[0] === lastSlot) {
        const swapIdx = 1 + Math.floor(Math.random() * (deck.length - 1))
        ;[deck[0], deck[swapIdx]] = [deck[swapIdx], deck[0]]
      }
    }

    const interval = setInterval(() => {
      if (deck.length === 0) shuffleDeck()
      const slotIdx = deck.shift()
      if (slotIdx === undefined) return
      lastSlot = slotIdx

      setCycleState((prev) => {
        const currentFrames = prev.signature === poolSignature ? prev.frames : initialFrames

        if (currentFrames[slotIdx].transitioning) return prev

        const poolSize = poolSlots[slotIdx].pool.length
        const fp = fingerprints[slotIdx]
        const group = sharedGroups.get(fp) ?? [slotIdx]

        const usedIndices = new Set<number>()
        for (const index of group) {
          if (index === slotIdx) {
            continue
          }

          usedIndices.add(
            currentFrames[index].transitioning
              ? currentFrames[index].incomingIdx
              : currentFrames[index].activeIdx,
          )
        }

        let nextIdx = (currentFrames[slotIdx].activeIdx + 1) % poolSize
        let safety = 0
        while (usedIndices.has(nextIdx) && safety < poolSize) {
          nextIdx = (nextIdx + 1) % poolSize
          safety++
        }

        const next = [...currentFrames]
        next[slotIdx] = {...currentFrames[slotIdx], incomingIdx: nextIdx, transitioning: true}
        return {frames: next, signature: poolSignature}
      })

      clearPendingTransition(pendingTransitions, slotIdx)
      const pending = setTimeout(() => {
        setCycleState((prev) => {
          if (prev.signature !== poolSignature) return prev

          return {
            frames: prev.frames.map((f, frameIdx) =>
              frameIdx === slotIdx && f.transitioning
                ? {activeIdx: f.incomingIdx, incomingIdx: -1, transitioning: false}
                : f,
            ),
            signature: prev.signature,
          }
        })
        pendingTransitions.delete(slotIdx)
      }, TRANSITION_DURATION_MS)
      pendingTransitions.set(slotIdx, pending)
    }, CYCLE_INTERVAL_MS)

    return () => {
      clearInterval(interval)
      clearAllPendingTransitions(pendingTransitions)
    }
  }, [enabled, fingerprints, initialFrames, poolSignature, poolSlots, reducedMotion, sharedGroups])

  return frames
}
