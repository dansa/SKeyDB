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
  it('commits a valid account level on blur', () => {
    const onAccountLevelChange = renderPanel()
    const input = screen.getByRole('spinbutton', {name: 'Account level'})

    fireEvent.change(input, {target: {value: '72'}})
    expect(onAccountLevelChange).not.toHaveBeenCalled()
    fireEvent.blur(input)

    expect(onAccountLevelChange).toHaveBeenCalledWith(72)
  })

  it('allows an empty account level draft and restores the committed value with Escape', () => {
    const onAccountLevelChange = renderPanel()
    const input = screen.getByRole('spinbutton', {name: 'Account level'})

    fireEvent.change(input, {target: {value: ''}})

    expect(input).toHaveValue(null)
    expect(onAccountLevelChange).not.toHaveBeenCalled()

    fireEvent.keyDown(input, {key: 'Escape'})

    expect(input).toHaveValue(50)
    expect(onAccountLevelChange).not.toHaveBeenCalled()
  })
})
