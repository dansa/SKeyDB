import {createRef} from 'react'

import {fireEvent, render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import {AwakenerDetailModalTopbar} from './AwakenerDetailModalTopbar'

describe('AwakenerDetailModalTopbar', () => {
  it('hides the tags menu trigger when there are no tags', () => {
    render(
      <AwakenerDetailModalTopbar
        fontScale='small'
        isScalingMenuOpen={false}
        isTagsMenuOpen={false}
        onClose={vi.fn()}
        onCloseScalingMenu={vi.fn()}
        onCloseTagsMenu={vi.fn()}
        onFontScaleChange={vi.fn()}
        onToggleScalingMenu={vi.fn()}
        onToggleTagsMenu={vi.fn()}
        scalingMenuRef={createRef<HTMLDivElement>()}
        tags={[]}
        tagsMenuRef={createRef<HTMLDivElement>()}
      />,
    )

    expect(screen.queryByRole('button', {name: 'Tags menu'})).toBeNull()
  })

  it('renders tag actions and closes the tag menu when a tag is clicked', () => {
    const onCloseTagsMenu = vi.fn()

    render(
      <AwakenerDetailModalTopbar
        fontScale='medium'
        isScalingMenuOpen={false}
        isTagsMenuOpen
        onClose={vi.fn()}
        onCloseScalingMenu={vi.fn()}
        onCloseTagsMenu={onCloseTagsMenu}
        onFontScaleChange={vi.fn()}
        onToggleScalingMenu={vi.fn()}
        onToggleTagsMenu={vi.fn()}
        scalingMenuRef={createRef<HTMLDivElement>()}
        tags={['Bleed', 'Crit']}
        tagsMenuRef={createRef<HTMLDivElement>()}
      />,
    )

    fireEvent.click(screen.getByRole('button', {name: 'Bleed'}))

    expect(onCloseTagsMenu).toHaveBeenCalledTimes(1)
  })

  it('changes font scale, closes the settings menu, and closes the modal', () => {
    const onFontScaleChange = vi.fn()
    const onCloseScalingMenu = vi.fn()
    const onClose = vi.fn()

    render(
      <AwakenerDetailModalTopbar
        fontScale='small'
        isScalingMenuOpen
        isTagsMenuOpen={false}
        onClose={onClose}
        onCloseScalingMenu={onCloseScalingMenu}
        onCloseTagsMenu={vi.fn()}
        onFontScaleChange={onFontScaleChange}
        onToggleScalingMenu={vi.fn()}
        onToggleTagsMenu={vi.fn()}
        scalingMenuRef={createRef<HTMLDivElement>()}
        tags={['Bleed']}
        tagsMenuRef={createRef<HTMLDivElement>()}
      />,
    )

    fireEvent.click(screen.getByRole('button', {name: 'Large'}))
    fireEvent.click(screen.getByRole('button', {name: 'Close detail'}))

    expect(onFontScaleChange).toHaveBeenCalledWith('large')
    expect(onCloseScalingMenu).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
