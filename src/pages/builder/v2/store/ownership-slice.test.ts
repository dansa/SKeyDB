import {beforeEach, describe, expect, it} from 'vitest'

import '../../../builder-page.integration-mocks'

import {
  COLLECTION_OWNERSHIP_KEY,
  createEmptyCollectionOwnershipState,
  saveCollectionOwnership,
} from '@/domain/collection-ownership'
import {getBrowserLocalStorage} from '@/domain/storage'

import {useBuilderStore} from './builder-store'

function resetStore() {
  useBuilderStore.setState(useBuilderStore.getInitialState(), true)
}

describe('ownership slice', () => {
  beforeEach(() => {
    window.localStorage.removeItem(COLLECTION_OWNERSHIP_KEY)
    resetStore()
  })

  it('refreshes the shared ownership maps from storage', () => {
    const nextOwnership = createEmptyCollectionOwnershipState()
    nextOwnership.ownedAwakeners['4'] = 5
    nextOwnership.awakenerLevels['4'] = 90
    nextOwnership.ownedWheels.O01 = 0
    nextOwnership.ownedPosses['01'] = 0

    saveCollectionOwnership(getBrowserLocalStorage(), nextOwnership)
    useBuilderStore.getState().refreshCollectionOwnership()

    const state = useBuilderStore.getState()
    expect(state.ownedAwakenerLevelByName.get('agrippa')).toBe(5)
    expect(state.awakenerLevelByName.get('agrippa')).toBe(90)
    expect(state.ownedWheelLevelById.get('O01')).toBe(0)
    expect(state.ownedPosseLevelById.get('01')).toBe(0)
  })
})
