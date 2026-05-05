import type {CollectionOwnershipState} from './collection-ownership'
import {clampAccountLevel} from './gameplay-math-metadata'
import {getPosses} from './posses'
import {resolveWheelDescriptionFormulaLevel} from './wheel-enhance'

export interface PublicFormulaContext {
  accountLevel?: number
  ownedPosseCount?: number
  wheelRefinementLevel?: number
}

export interface PublicFormulaContextInput {
  collectionOwnership?: CollectionOwnershipState | null
  wheelEnhanceLevel?: number | null
  accountLevel?: number | null
  ownedPosseCount?: number | null
  wheelRefinementLevel?: number | null
}

const CURRENT_PUBLIC_POSSE_IDS = new Set(getPosses().map((posse) => posse.id))
const DEFAULT_PUBLIC_ACCOUNT_LEVEL = 50
const MIN_OWNED_POSSE_COUNT = 0
const MIN_WHEEL_REFINEMENT_LEVEL = 0
const MAX_WHEEL_REFINEMENT_LEVEL = 3

function countOwnedCurrentPublicPosses(collectionOwnership: CollectionOwnershipState): number {
  let count = 0
  for (const id of Object.keys(collectionOwnership.ownedPosses)) {
    if (CURRENT_PUBLIC_POSSE_IDS.has(id)) {
      count += 1
    }
  }
  return count
}

function normalizeOwnedPosseCount(value: number | null | undefined): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return CURRENT_PUBLIC_POSSE_IDS.size
  }
  return Math.min(CURRENT_PUBLIC_POSSE_IDS.size, Math.max(MIN_OWNED_POSSE_COUNT, Math.floor(value)))
}

function normalizeWheelRefinementLevel(value: number | null | undefined): number | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return undefined
  }
  return Math.min(
    MAX_WHEEL_REFINEMENT_LEVEL,
    Math.max(MIN_WHEEL_REFINEMENT_LEVEL, Math.floor(value)),
  )
}

export function buildPublicFormulaContext(
  input: PublicFormulaContextInput = {},
): PublicFormulaContext {
  const context: PublicFormulaContext = {
    accountLevel: clampAccountLevel(input.accountLevel ?? DEFAULT_PUBLIC_ACCOUNT_LEVEL),
    ownedPosseCount: input.collectionOwnership
      ? countOwnedCurrentPublicPosses(input.collectionOwnership)
      : normalizeOwnedPosseCount(input.ownedPosseCount),
  }

  if (typeof input.wheelEnhanceLevel === 'number') {
    context.wheelRefinementLevel = resolveWheelDescriptionFormulaLevel(input.wheelEnhanceLevel)
  } else {
    const normalizedWheelRefinementLevel = normalizeWheelRefinementLevel(input.wheelRefinementLevel)
    if (normalizedWheelRefinementLevel !== undefined) {
      context.wheelRefinementLevel = normalizedWheelRefinementLevel
    }
  }

  return context
}
