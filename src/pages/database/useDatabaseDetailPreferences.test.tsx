import {fireEvent, render, screen} from '@testing-library/react'
import {beforeEach, describe, expect, it} from 'vitest'

import {useDatabaseDetailPreferences} from './useDatabaseDetailPreferences'

function PreferenceHarness() {
  const {updateSharedPreferences} = useDatabaseDetailPreferences()

  return (
    <button
      onClick={() => {
        updateSharedPreferences({fontScale: 'large'})
      }}
      type='button'
    >
      Set font scale
    </button>
  )
}

describe('useDatabaseDetailPreferences', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('does not overwrite newer storage branches when writing a partial preference update', () => {
    window.localStorage.setItem(
      'database-detail-preferences',
      JSON.stringify({
        shared: {
          showTagIcons: true,
          clickOutsideClosesPopovers: true,
          fontScale: 'small',
        },
        awakener: {
          showVisibleScaling: true,
          defaultSelection: {},
        },
        wheel: {
          defaultEnhanceLevel: 0,
          expandLoreByDefault: false,
        },
      }),
    )

    render(<PreferenceHarness />)

    window.localStorage.setItem(
      'database-detail-preferences',
      JSON.stringify({
        shared: {
          showTagIcons: true,
          clickOutsideClosesPopovers: true,
          fontScale: 'small',
        },
        awakener: {
          showVisibleScaling: true,
          defaultSelection: {},
        },
        wheel: {
          defaultEnhanceLevel: 0,
          expandLoreByDefault: true,
        },
      }),
    )

    fireEvent.click(screen.getByRole('button', {name: 'Set font scale'}))

    expect(
      JSON.parse(window.localStorage.getItem('database-detail-preferences') ?? 'null'),
    ).toEqual({
      shared: {
        showTagIcons: true,
        clickOutsideClosesPopovers: true,
        fontScale: 'large',
      },
      awakener: {
        showVisibleScaling: true,
        defaultSelection: {
          awakenerLevel: 60,
          psycheSurgeOffset: 0,
          selectedEnlightenSlot: null,
          skillLevel: 1,
          soulforgeLevel: 0,
        },
      },
      wheel: {
        defaultEnhanceLevel: 0,
        expandLoreByDefault: true,
      },
    })
  })
})
