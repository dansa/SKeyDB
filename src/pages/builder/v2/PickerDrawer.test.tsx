import {useState} from 'react'

import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {describe, expect, it} from 'vitest'

import {PickerDrawer} from './PickerDrawer'

function DrawerHarness() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div>
      <button
        onClick={() => {
          setIsOpen(true)
        }}
        type='button'
      >
        Open Picker
      </button>
      <button type='button'>Outside Action</button>
      <PickerDrawer
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false)
        }}
      >
        <button type='button'>Inside Action</button>
      </PickerDrawer>
    </div>
  )
}

describe('PickerDrawer', () => {
  it('moves focus into the drawer, traps tab focus, and restores focus on close', async () => {
    const user = userEvent.setup()

    render(<DrawerHarness />)

    const openButton = screen.getByRole('button', {name: /Open Picker/i})
    openButton.focus()

    await user.click(openButton)

    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveFocus()

    await user.tab()
    expect(screen.getByRole('button', {name: /Inside Action/i})).toHaveFocus()

    await user.tab()
    expect(dialog).toHaveFocus()

    await user.keyboard('{Escape}')
    expect(openButton).toHaveFocus()
  })
})
