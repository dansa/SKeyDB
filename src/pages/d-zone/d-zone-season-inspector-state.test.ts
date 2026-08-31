import {describe, expect, it} from 'vitest'

import type {DzoneAlertOption} from '@/domain/dzone'

import {
  buildDefaultOpenWaveIds,
  getPersistedAlertPreferenceId,
  getResolvedOpenWaveIds,
  getSelectedAlertId,
  toggleResolvedOpenWaveId,
  type AlertSelectionState,
  type WaveDisclosureState,
} from './d-zone-season-inspector-state'

function option(id: string): DzoneAlertOption {
  return {id, name: id}
}

function ids(openWaveIds: Set<string>): string[] {
  return [...openWaveIds]
}

describe('d-zone season inspector state', () => {
  it('opens the first wave by default', () => {
    expect(ids(buildDefaultOpenWaveIds('wave-1'))).toEqual(['wave-1'])
  })

  it('resolves stale season open-wave state to the new season default', () => {
    const staleState: WaveDisclosureState = {
      openWaveIds: new Set(['old-wave']),
      seasonId: 'old-season',
    }

    expect(
      ids(
        getResolvedOpenWaveIds({
          defaultOpenWaveId: 'new-wave',
          seasonId: 'new-season',
          waveDisclosureState: staleState,
        }),
      ),
    ).toEqual(['new-wave'])
  })

  it('normalizes stale open-wave state before toggling', () => {
    const staleState: WaveDisclosureState = {
      openWaveIds: new Set(['old-wave']),
      seasonId: 'old-season',
    }

    const toggledState = toggleResolvedOpenWaveId({
      defaultOpenWaveId: 'new-wave',
      seasonId: 'new-season',
      waveDisclosureState: staleState,
      waveId: 'other-new-wave',
    })

    expect(toggledState.seasonId).toBe('new-season')
    expect(ids(toggledState.openWaveIds)).toEqual(['new-wave', 'other-new-wave'])
  })

  it('keeps the selected alert across seasons when that alert exists', () => {
    const alertSelectionState: AlertSelectionState = {
      alertId: 'alert-2',
    }

    expect(
      getSelectedAlertId({
        alertOptions: [option('alert-1'), option('alert-2')],
        alertSelectionState,
      }),
    ).toBe('alert-2')
  })

  it('persists the highest named difficulty as the legacy highest-tier preference', () => {
    expect(
      getPersistedAlertPreferenceId({
        alertOptions: [
          {id: 'alert-1', name: 'Normal'},
          {id: 'alert-2', name: 'Hard'},
          {id: 'alert-3', name: 'Nightmare'},
          {id: 'alert-4', name: 'Madness'},
        ],
        selectedAlertId: 'alert-4',
      }),
    ).toBe('alert-5')
  })

  it('does not promote the highest option in a legacy four-alert season', () => {
    expect(
      getPersistedAlertPreferenceId({
        alertOptions: [
          {id: 'alert-1', name: 'Alert I'},
          {id: 'alert-2', name: 'Alert II'},
          {id: 'alert-3', name: 'Alert III'},
          {id: 'alert-4', name: 'Alert IV'},
        ],
        selectedAlertId: 'alert-4',
      }),
    ).toBe('alert-4')
  })

  it('falls back to the highest available alert below the persisted level', () => {
    const alertOptions = [option('alert-1'), option('alert-2'), option('alert-3')]

    expect(
      getSelectedAlertId({
        alertOptions,
        alertSelectionState: {alertId: 'alert-5'},
      }),
    ).toBe('alert-3')
  })

  it('falls back to the first alert option for invalid non-level alert state', () => {
    const alertOptions = [option('alert-1'), option('alert-2')]

    expect(
      getSelectedAlertId({
        alertOptions,
        alertSelectionState: {alertId: 'missing-alert'},
      }),
    ).toBe('alert-1')
  })

  it('returns null for empty alert options', () => {
    expect(
      getSelectedAlertId({
        alertOptions: [],
        alertSelectionState: {alertId: 'alert-1'},
      }),
    ).toBeNull()
  })
})
