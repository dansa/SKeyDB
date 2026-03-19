import {fireEvent, render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import {LayoutModeSwitcher} from './LayoutModeSwitcher'

describe('LayoutModeSwitcher', () => {
  it('drops focus from the clicked mode button before changing layout override', () => {
    const onOverrideChange = vi.fn()

    render(
      <LayoutModeSwitcher
        detectedMode='desktop'
        layoutOverride='auto'
        onOverrideChange={onOverrideChange}
      />,
    )

    const mobileButton = screen.getByRole('button', {name: /^Mobile$/i})
    const blurSpy = vi.spyOn(mobileButton, 'blur')

    mobileButton.focus()
    expect(mobileButton).toHaveFocus()

    fireEvent.click(mobileButton)

    expect(blurSpy).toHaveBeenCalledTimes(1)
    expect(onOverrideChange).toHaveBeenCalledWith('mobile')
    expect(mobileButton).not.toHaveFocus()
  })
})
