import {fireEvent, render, screen} from '@testing-library/react'
import {expect, vi} from 'vitest'

import {DetailSettingsPanel} from './DetailSettingsPanel'

function renderPanel(
  onAccountLevelChange = vi.fn(),
  onPrimordiaAllChaosTeamChange = vi.fn(),
  onRealmMasteryFinalChange = vi.fn(),
) {
  render(
    <DetailSettingsPanel
      accountLevel={50}
      clickOutsideClosesPopovers
      fontScale='medium'
      onAccountLevelChange={onAccountLevelChange}
      onClickOutsideClosesPopoversChange={vi.fn()}
      onFontScaleChange={vi.fn()}
      onPrimordiaAllChaosTeamChange={onPrimordiaAllChaosTeamChange}
      onRealmMasteryFinalChange={onRealmMasteryFinalChange}
      onShowTagIconsChange={vi.fn()}
      primordiaAllChaosTeam={false}
      realmMasteryFinal={0}
      showTagIcons
    />,
  )
  return {onAccountLevelChange, onPrimordiaAllChaosTeamChange, onRealmMasteryFinalChange}
}

describe('DetailSettingsPanel', () => {
  it('updates the account level for a valid numeric value', () => {
    const {onAccountLevelChange} = renderPanel()

    fireEvent.change(screen.getByRole('spinbutton', {name: 'Account level'}), {
      target: {value: '72'},
    })

    expect(onAccountLevelChange).toHaveBeenCalledWith(72)
  })

  it('ignores an empty account level instead of emitting zero or NaN', () => {
    const {onAccountLevelChange} = renderPanel()

    fireEvent.change(screen.getByRole('spinbutton', {name: 'Account level'}), {
      target: {value: ''},
    })

    expect(onAccountLevelChange).not.toHaveBeenCalled()
  })

  it('updates the all-Chaos Primordia formula state', () => {
    const {onPrimordiaAllChaosTeamChange} = renderPanel()

    fireEvent.click(screen.getByRole('checkbox', {name: /All-Chaos Primordia team/i}))

    expect(onPrimordiaAllChaosTeamChange).toHaveBeenCalledWith(true)
  })

  it('updates Final Realm Mastery for standalone formula previews', () => {
    const {onRealmMasteryFinalChange} = renderPanel()

    fireEvent.change(screen.getByRole('spinbutton', {name: 'Final Realm Mastery'}), {
      target: {value: '42'},
    })

    expect(onRealmMasteryFinalChange).toHaveBeenCalledWith(42)
  })
})
