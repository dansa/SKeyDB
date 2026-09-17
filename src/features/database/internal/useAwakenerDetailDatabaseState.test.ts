import {act, renderHook} from '@testing-library/react'
import {beforeEach, describe, expect, it} from 'vitest'

import {getAwakeners} from '@/domain/awakeners'
import {normalizeDatabaseDetailPreferences} from '@/domain/database-detail-preferences'
import {loadPublicAwakenerDetailById} from '@/domain/public-detail-record-adapters'
import {preferencesStore} from '@/stores/preferencesStore'

import {useAwakenerDetailDatabaseState} from './useAwakenerDetailDatabaseState'

describe('useAwakenerDetailDatabaseState default progression', () => {
  beforeEach(() => {
    preferencesStore.getState().flushDatabaseDetailPreferences()
    localStorage.clear()
    preferencesStore.getState().hydrateDatabaseDetailPreferences()
  })

  it.each([
    {soulforgeLevel: 9},
    {awakenerLevel: 70},
    {skillLevel: 5},
    {selectedEnlightenSlot: 'E1' as const},
  ])('preserves shared Gnostic Potential when editing %j on 24', async (patch) => {
    const aigisId = getAwakeners().find((awakener) => awakener.name === 'aigis')?.id
    if (!aigisId) throw new Error('Missing Aigis')
    const aigis = await loadPublicAwakenerDetailById(aigisId)
    const twentyFour = await loadPublicAwakenerDetailById(1)
    if (!aigis || !twentyFour) throw new Error('Missing awakener records')

    const initialDefaults = normalizeDatabaseDetailPreferences({
      awakener: {
        defaultSelection: {soulforgeLevel: 10, skillLevel: 6, gnosticPotentialLevel: 0},
      },
    }).awakener.defaultSelection
    preferencesStore.getState().updateDatabaseDetailPreferences({
      awakener: {defaultSelection: initialDefaults},
    })
    const {result, rerender} = renderHook(
      (fullData) => useAwakenerDetailDatabaseState({fullData}),
      {initialProps: aigis},
    )
    expect(result.current.runtime.resolvedSelection.gnosticPotentialLevel).toBe(0)

    rerender(twentyFour)
    expect(result.current.runtime.resolvedControls.canAdjustGnosticPotential).toBe(false)
    expect(result.current.runtime.resolvedSelection.gnosticPotentialLevel).toBe(5)
    act(() => {
      result.current.actions.patchDefaultSelection(patch)
    })
    expect(result.current.preferences.awakener.defaultSelection).toEqual({
      ...initialDefaults,
      ...patch,
    })
    expect(result.current.runtime.resolvedSelection.gnosticPotentialLevel).toBe(5)

    // Persist and reopen so this also checks what the next detail session receives.
    act(() => {
      preferencesStore.getState().flushDatabaseDetailPreferences()
      preferencesStore.getState().hydrateDatabaseDetailPreferences()
    })
    rerender(aigis)
    expect(result.current.runtime.resolvedSelection.gnosticPotentialLevel).toBe(0)
    const reopened = renderHook(() => useAwakenerDetailDatabaseState({fullData: aigis}))
    expect(reopened.result.current.runtime.resolvedSelection).toEqual({
      ...initialDefaults,
      ...patch,
    })
  })
})
