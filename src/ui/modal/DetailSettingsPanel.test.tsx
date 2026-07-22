import {fireEvent, render, screen} from '@testing-library/react'
import {expect, vi} from 'vitest'

import {DetailSettingsPanel} from './DetailSettingsPanel'

function renderPanel(onAccountLevelChange = vi.fn()) {
  render(
    <DetailSettingsPanel
      accountLevel={50}
      clickOutsideClosesPopovers
      fontScale='medium'
      onAccountLevelChange={onAccountLevelChange}
      onClickOutsideClosesPopoversChange={vi.fn()}
      onFontScaleChange={vi.fn()}
      onShowTagIconsChange={vi.fn()}
      showTagIcons
    />,
  )
  return onAccountLevelChange
}

describe('DetailSettingsPanel', () => {
  it('updates the account level for a valid numeric value', () => {
    const onAccountLevelChange = renderPanel()

    fireEvent.change(screen.getByRole('spinbutton', {name: 'Account level'}), {
      target: {value: '72'},
    })

    expect(onAccountLevelChange).toHaveBeenCalledWith(72)
  })

  it('ignores an empty account level instead of emitting zero or NaN', () => {
    const onAccountLevelChange = renderPanel()

    fireEvent.change(screen.getByRole('spinbutton', {name: 'Account level'}), {
      target: {value: ''},
    })

    expect(onAccountLevelChange).not.toHaveBeenCalled()
  })
})
