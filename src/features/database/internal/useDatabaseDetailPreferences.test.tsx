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

function SharedPreferenceHarness() {
  const first = useDatabaseDetailPreferences()
  const second = useDatabaseDetailPreferences()

  return (
    <>
      <div data-testid='first-font-scale'>{first.preferences.shared.fontScale}</div>
      <div data-testid='second-font-scale'>{second.preferences.shared.fontScale}</div>
      <button
        onClick={() => {
          first.updateSharedPreferences({fontScale: 'large'})
        }}
        type='button'
      >
        Update first consumer
      </button>
    </>
  )
}

function MountedPreferenceHarness() {
  const {preferences} = useDatabaseDetailPreferences()

  return (
    <>
      <div data-testid='mounted-font-scale'>{preferences.shared.fontScale}</div>
      <div data-testid='mounted-account-level'>{preferences.shared.accountLevel}</div>
    </>
  )
}

describe('useDatabaseDetailPreferences', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('reads preferences from storage when a consumer mounts after storage is seeded', () => {
    window.localStorage.setItem(
      'database-detail-preferences',
      JSON.stringify({
        shared: {
          showTagIcons: true,
          clickOutsideClosesPopovers: true,
          fontScale: 'large',
          accountLevel: 42,
        },
      }),
    )

    render(<MountedPreferenceHarness />)

    expect(screen.getByTestId('mounted-font-scale')).toHaveTextContent('large')
    expect(screen.getByTestId('mounted-account-level')).toHaveTextContent('42')
  })

  it('shares preference updates across concurrently mounted consumers', () => {
    render(<SharedPreferenceHarness />)

    expect(screen.getByTestId('first-font-scale')).toHaveTextContent('small')
    expect(screen.getByTestId('second-font-scale')).toHaveTextContent('small')

    fireEvent.click(screen.getByRole('button', {name: 'Update first consumer'}))

    expect(screen.getByTestId('first-font-scale')).toHaveTextContent('large')
    expect(screen.getByTestId('second-font-scale')).toHaveTextContent('large')
  })

  it('does not overwrite newer storage branches when writing a partial preference update', () => {
    window.localStorage.setItem(
      'database-detail-preferences',
      JSON.stringify({
        shared: {
          showTagIcons: true,
          clickOutsideClosesPopovers: true,
          fontScale: 'small',
          accountLevel: 50,
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
          accountLevel: 50,
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
        accountLevel: 50,
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
