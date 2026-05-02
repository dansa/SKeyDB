import {describe, expect, it} from 'vitest'

import type {CollectionOwnershipState} from './collection-ownership'
import {getPosses} from './posses'
import {buildPublicFormulaContext, type PublicFormulaContext} from './public-formula-context'

function createOwnership(ownedPosses: Record<string, number>): CollectionOwnershipState {
  return {
    ownedAwakeners: {},
    awakenerLevels: {},
    ownedWheels: {},
    ownedPosses,
    displayUnowned: true,
  }
}

describe('public-formula-context', () => {
  it('exposes only website-controlled public formula inputs', () => {
    const context = buildPublicFormulaContext({
      collectionOwnership: createOwnership({[getPosses()[0].id]: 1}),
      wheelEnhanceLevel: 4,
      accountLevel: 33,
    })

    expect(Object.keys(context).sort()).toEqual([
      'accountLevel',
      'ownedPosseCount',
      'wheelRefinementLevel',
    ])
    expect(context).toEqual({
      accountLevel: 33,
      ownedPosseCount: 1,
      wheelRefinementLevel: 3,
    })
  })

  it('counts only current public owned posses when collection ownership is configured', () => {
    const currentPosses = getPosses()
    const context = buildPublicFormulaContext({
      collectionOwnership: createOwnership({
        [currentPosses[0].id]: 0,
        [currentPosses[1].id]: 0,
        [currentPosses[2].id]: 0,
        'legacy-posse-id': 1,
      }),
    })

    expect(context.ownedPosseCount).toBe(3)
  })

  it('defaults owned posse count to all current public posses without collection ownership', () => {
    expect(buildPublicFormulaContext().ownedPosseCount).toBe(getPosses().length)
    expect(buildPublicFormulaContext({collectionOwnership: null}).ownedPosseCount).toBe(
      getPosses().length,
    )
  })

  it('defaults account level to the public metadata max and clamps configured levels', () => {
    expect(buildPublicFormulaContext().accountLevel).toBe(100)
    expect(buildPublicFormulaContext({accountLevel: -10}).accountLevel).toBe(1)
    expect(buildPublicFormulaContext({accountLevel: 999}).accountLevel).toBe(100)
    expect(buildPublicFormulaContext({accountLevel: 33.9}).accountLevel).toBe(33)
  })

  it('uses the existing wheel enhancement clamp for wheel refinement level', () => {
    expect(buildPublicFormulaContext({wheelEnhanceLevel: 999}).wheelRefinementLevel).toBe(3)
    expect(buildPublicFormulaContext({wheelEnhanceLevel: -3}).wheelRefinementLevel).toBe(0)
    expect(buildPublicFormulaContext({wheelEnhanceLevel: 2.9}).wheelRefinementLevel).toBe(2)
    expect(buildPublicFormulaContext({wheelEnhanceLevel: 4}).wheelRefinementLevel).toBe(3)
  })

  it('keeps the public formula context type closed to reviewed keys', () => {
    const context = {
      accountLevel: 100,
      ownedPosseCount: 2,
      wheelRefinementLevel: 3,
    } satisfies PublicFormulaContext

    expect(context.ownedPosseCount).toBe(2)
  })
})
