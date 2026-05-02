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
}

const CURRENT_PUBLIC_POSSE_IDS = new Set(getPosses().map((posse) => posse.id))

function countOwnedCurrentPublicPosses(collectionOwnership: CollectionOwnershipState): number {
  let count = 0
  for (const id of Object.keys(collectionOwnership.ownedPosses)) {
    if (CURRENT_PUBLIC_POSSE_IDS.has(id)) {
      count += 1
    }
  }
  return count
}

export function buildPublicFormulaContext(
  input: PublicFormulaContextInput = {},
): PublicFormulaContext {
  const context: PublicFormulaContext = {
    accountLevel: clampAccountLevel(input.accountLevel),
    ownedPosseCount: input.collectionOwnership
      ? countOwnedCurrentPublicPosses(input.collectionOwnership)
      : CURRENT_PUBLIC_POSSE_IDS.size,
  }

  if (typeof input.wheelEnhanceLevel === 'number') {
    context.wheelRefinementLevel = resolveWheelDescriptionFormulaLevel(input.wheelEnhanceLevel)
  }

  return context
}
