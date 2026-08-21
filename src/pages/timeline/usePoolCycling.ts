import {useEffect, useMemo, useReducer, useSyncExternalStore} from 'react'

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
      pools: BannerFeaturedUnit[][]
      initialFrames: PoolCycleFrame[]
      cycleKey: string
    }
  | {
      type: 'completeTransition'
      slotIdx: number
      cycleKey: string
    }

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

function buildInitialFrames(poolSlots: BannerPoolSlot[]): PoolCycleFrame[] {
  const initial: PoolCycleFrame[] = poolSlots.map(() => ({
    activeIdx: 0,
    incomingIdx: -1,
    transitioning: false,
  }))

  const usedNames = new Set<string>()
  for (const [slotIdx, slot] of poolSlots.entries()) {
    const availableIdx = slot.pool.findIndex((unit) => !usedNames.has(unit.name.toLowerCase()))
    initial[slotIdx].activeIdx = Math.max(0, availableIdx)
    if (slot.pool.length > 0) {
      usedNames.add(slot.pool[initial[slotIdx].activeIdx].name.toLowerCase())
    }
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

export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribeToReducedMotion, prefersReducedMotion, () => false)
}

function poolCycleReducer(state: PoolCycleState, action: PoolCycleAction): PoolCycleState {
  switch (action.type) {
    case 'startTransition': {
      const currentFrames = state.cycleKey === action.cycleKey ? state.frames : action.initialFrames

      if (currentFrames[action.slotIdx].transitioning) return state

      const usedNames = new Set<string>()
      for (const [index, pool] of action.pools.entries()) {
        if (index === action.slotIdx || pool.length === 0) {
          continue
        }

        const selectedIdx = currentFrames[index].transitioning
          ? currentFrames[index].incomingIdx
          : currentFrames[index].activeIdx
        usedNames.add(pool[selectedIdx].name.toLowerCase())
      }

      const pool = action.pools[action.slotIdx]
      const poolSize = pool.length
      let nextIdx = (currentFrames[action.slotIdx].activeIdx + 1) % poolSize
      let safety = 0
      while (usedNames.has(pool[nextIdx].name.toLowerCase()) && safety < poolSize) {
        nextIdx = (nextIdx + 1) % poolSize
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
  const initialFrames = useMemo(() => buildInitialFrames(poolSlots), [poolSlots])
  const reducedMotion = usePrefersReducedMotion()

  const [cycleState, dispatch] = useReducer(poolCycleReducer, {
    frames: initialFrames,
    cycleKey: poolCycleKey,
  })

  const frames =
    reducedMotion || cycleState.cycleKey !== poolCycleKey ? initialFrames : cycleState.frames

  // react-doctor-disable-next-line react-doctor/effect-needs-cleanup -- The timer is created by this effect-owned interval and cleared by the teardown below.
  useEffect(() => {
    if (!enabled || reducedMotion) return

    // The cycle interval is longer than the transition duration, so only one
    // completion timer can be pending at a time.
    let pendingTransition: ReturnType<typeof setTimeout> | undefined
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
        pools: poolSlots.map((slot) => slot.pool),
        initialFrames,
        cycleKey: poolCycleKey,
      })

      pendingTransition = setTimeout(() => {
        dispatch({type: 'completeTransition', slotIdx, cycleKey: poolCycleKey})
        pendingTransition = undefined
      }, TRANSITION_DURATION_MS)
    }, CYCLE_INTERVAL_MS)

    return () => {
      clearInterval(interval)
      if (pendingTransition !== undefined) {
        clearTimeout(pendingTransition)
      }
    }
  }, [enabled, fingerprints, initialFrames, poolCycleKey, poolSlots, reducedMotion])

  return frames
}
