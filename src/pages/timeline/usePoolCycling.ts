import {useEffect, useMemo, useReducer, useRef, useSyncExternalStore, type RefObject} from 'react'

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
  cycleKey: string
}

type PoolCycleAction =
  | {
      type: 'startTransition'
      slotIdx: number
      poolSize: number
      group: number[]
      initialFrames: PoolCycleFrame[]
      cycleKey: string
    }
  | {
      type: 'completeTransition'
      slotIdx: number
      cycleKey: string
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

function poolCycleReducer(state: PoolCycleState, action: PoolCycleAction): PoolCycleState {
  switch (action.type) {
    case 'startTransition': {
      const currentFrames = state.cycleKey === action.cycleKey ? state.frames : action.initialFrames

      if (currentFrames[action.slotIdx].transitioning) return state

      const usedIndices = new Set<number>()
      for (const index of action.group) {
        if (index === action.slotIdx) {
          continue
        }

        usedIndices.add(
          currentFrames[index].transitioning
            ? currentFrames[index].incomingIdx
            : currentFrames[index].activeIdx,
        )
      }

      let nextIdx = (currentFrames[action.slotIdx].activeIdx + 1) % action.poolSize
      let safety = 0
      while (usedIndices.has(nextIdx) && safety < action.poolSize) {
        nextIdx = (nextIdx + 1) % action.poolSize
        safety++
      }

      const frames = [...currentFrames]
      frames[action.slotIdx] = {
        ...currentFrames[action.slotIdx],
        incomingIdx: nextIdx,
        transitioning: true,
      }
      return {frames, cycleKey: action.cycleKey}
    }

    case 'completeTransition': {
      if (state.cycleKey !== action.cycleKey) return state

      return {
        frames: state.frames.map((frame, frameIdx) =>
          frameIdx === action.slotIdx && frame.transitioning
            ? {activeIdx: frame.incomingIdx, incomingIdx: -1, transitioning: false}
            : frame,
        ),
        cycleKey: state.cycleKey,
      }
    }
  }
}

export function usePoolCycling(
  poolSlots: BannerPoolSlot[],
  {enabled = true}: UsePoolCyclingOptions = {},
): PoolCycleFrame[] {
  const poolCycleKey = useMemo(() => buildPoolSignature(poolSlots), [poolSlots])
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

  const [cycleState, dispatch] = useReducer(poolCycleReducer, {
    frames: initialFrames,
    cycleKey: poolCycleKey,
  })

  const pendingBySlotRef = useRef<PendingTransitionMap | null>(null)

  const frames =
    reducedMotion || cycleState.cycleKey !== poolCycleKey ? initialFrames : cycleState.frames

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

      dispatch({
        type: 'startTransition',
        slotIdx,
        poolSize: poolSlots[slotIdx].pool.length,
        group: sharedGroups.get(fingerprints[slotIdx]) ?? [slotIdx],
        initialFrames,
        cycleKey: poolCycleKey,
      })

      clearPendingTransition(pendingTransitions, slotIdx)
      const pending = setTimeout(() => {
        dispatch({type: 'completeTransition', slotIdx, cycleKey: poolCycleKey})
        pendingTransitions.delete(slotIdx)
      }, TRANSITION_DURATION_MS)
      pendingTransitions.set(slotIdx, pending)
    }, CYCLE_INTERVAL_MS)

    return () => {
      clearInterval(interval)
      clearAllPendingTransitions(pendingTransitions)
    }
  }, [enabled, fingerprints, initialFrames, poolCycleKey, poolSlots, reducedMotion, sharedGroups])

  return frames
}
