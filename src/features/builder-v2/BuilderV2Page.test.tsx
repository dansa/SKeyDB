import {fireEvent, render, screen, within} from '@testing-library/react'
import {MemoryRouter} from 'react-router-dom'
import {afterEach, describe, expect, it} from 'vitest'

import './builder-v2-test-mocks'

import App from '@/App'

import {BuilderV2Page} from './BuilderV2Page'

function resizeBuilderV2Viewport(width: number, dispatchResize = true) {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: width,
  })
  if (dispatchResize) {
    window.dispatchEvent(new Event('resize'))
  }
}

afterEach(() => {
  resizeBuilderV2Viewport(1024, false)
})

describe('BuilderV2Page', () => {
  it('renders a concept-informed shell with four slots and an awakener picker', () => {
    render(<BuilderV2Page />)

    expect(screen.getByRole('heading', {level: 1, name: /builder v2/i})).toBeInTheDocument()
    expect(screen.getByRole('complementary', {name: /my teams/i})).toBeInTheDocument()
    expect(screen.getByRole('complementary', {name: /builder v2 armory/i})).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getAllByText(/empty slot/i)).toHaveLength(4)
    expect(screen.getByRole('searchbox', {name: /search awakeners/i})).toBeInTheDocument()
  })

  it('renders the mobile overview and enters the focused slot builder', () => {
    resizeBuilderV2Viewport(390)
    render(<BuilderV2Page />)

    expect(screen.getByRole('region', {name: /mobile team overview/i})).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', {name: /open slot 2 builder/i}))

    expect(screen.getByRole('region', {name: /mobile focused builder/i})).toBeInTheDocument()
    expect(screen.getByRole('heading', {level: 2, name: /slot 2/i})).toBeInTheDocument()
    expect(screen.getByRole('button', {name: /pick awakener for slot 2/i})).toBeInTheDocument()
  })

  it('opens the mobile picker drawer from a focused slot and focuses search', () => {
    resizeBuilderV2Viewport(390)
    render(<BuilderV2Page />)

    fireEvent.click(screen.getByRole('button', {name: /open slot 2 builder/i}))
    fireEvent.click(screen.getByRole('button', {name: /pick awakener for slot 2/i}))

    const drawer = screen.getByRole('dialog', {name: /pick awakener for slot 2/i})
    expect(drawer).toBeInTheDocument()
    expect(within(drawer).getByRole('tab', {name: /^awakeners$/i})).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(within(drawer).getByRole('searchbox', {name: /search awakeners/i})).toHaveFocus()
    expect(screen.getByText(/editing slot 2 - awakener/i)).toBeInTheDocument()
  })

  it('opens the mobile picker drawer on a wheel target with the wheels tab active', () => {
    resizeBuilderV2Viewport(390)
    render(<BuilderV2Page />)

    fireEvent.click(screen.getByRole('button', {name: /open slot 1 builder/i}))
    fireEvent.click(screen.getByRole('button', {name: /pick awakener for slot 1/i}))
    fireEvent.click(screen.getByRole('button', {name: /goliath/i}))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', {level: 2, name: /goliath/i})).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', {name: /pick wheel 2 for goliath/i}))

    const drawer = screen.getByRole('dialog', {name: /pick wheel 2 for goliath/i})
    expect(within(drawer).getByRole('tab', {name: /^wheels$/i})).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(within(drawer).getByRole('searchbox', {name: /search wheels/i})).toHaveFocus()
    expect(screen.getByText(/editing slot 1 - wheel 2/i)).toBeInTheDocument()
  })

  it('closes the mobile picker drawer with Escape and returns focus to the invoking target', () => {
    resizeBuilderV2Viewport(390)
    render(<BuilderV2Page />)

    fireEvent.click(screen.getByRole('button', {name: /open slot 3 builder/i}))
    const pickerTrigger = screen.getByRole('button', {name: /pick awakener for slot 3/i})
    fireEvent.click(pickerTrigger)

    expect(screen.getByRole('dialog', {name: /pick awakener for slot 3/i})).toBeInTheDocument()

    fireEvent.keyDown(document, {key: 'Escape'})

    expect(
      screen.queryByRole('dialog', {name: /pick awakener for slot 3/i}),
    ).not.toBeInTheDocument()
    expect(pickerTrigger).toHaveFocus()
  })

  it('keeps the same mobile target when reopening a picker after closing it', () => {
    resizeBuilderV2Viewport(390)
    render(<BuilderV2Page />)

    fireEvent.click(screen.getByRole('button', {name: /open slot 2 builder/i}))
    fireEvent.click(screen.getByRole('button', {name: /pick awakener for slot 2/i}))
    fireEvent.keyDown(document, {key: 'Escape'})
    fireEvent.click(screen.getByRole('button', {name: /pick awakener for slot 2/i}))
    fireEvent.click(screen.getByRole('button', {name: /goliath/i}))

    expect(screen.getByRole('heading', {level: 2, name: /goliath/i})).toBeInTheDocument()
    expect(screen.getByRole('button', {name: /pick wheel 1 for goliath/i})).toBeInTheDocument()
  })

  it('syncs the mobile focused slot when quick lineup advances to the next slot', () => {
    resizeBuilderV2Viewport(390)
    render(<BuilderV2Page />)

    fireEvent.click(screen.getByRole('button', {name: /quick team lineup/i}))
    fireEvent.click(screen.getByRole('button', {name: /pick awakener for slot 1/i}))
    fireEvent.click(screen.getByRole('button', {name: /goliath/i}))
    fireEvent.click(screen.getByRole('button', {name: /pick wheel 1 for goliath/i}))
    fireEvent.click(screen.getByRole('button', {name: /merciful nurturing/i}))
    fireEvent.click(screen.getByRole('button', {name: /pick wheel 2 for goliath/i}))
    fireEvent.click(screen.getByRole('button', {name: /tablet of scriptures/i}))
    fireEvent.click(screen.getByRole('button', {name: /pick covenant for goliath/i}))
    fireEvent.click(screen.getByRole('button', {name: /deus ex machina/i}))

    expect(screen.getByText(/step 5 \/ 17: slot 2 - awakener/i)).toBeInTheDocument()
    expect(screen.getByRole('heading', {level: 2, name: /slot 2/i})).toBeInTheDocument()
    expect(screen.getByRole('button', {name: /pick awakener for slot 2/i})).toBeInTheDocument()

    const lineupControls = screen.getByLabelText(/mobile quick lineup controls/i)

    fireEvent.click(within(lineupControls).getByRole('button', {name: /^back$/i}))

    expect(screen.getByText(/step 4 \/ 17: slot 1 - covenant/i)).toBeInTheDocument()
    expect(screen.getByRole('heading', {level: 2, name: /goliath/i})).toBeInTheDocument()

    fireEvent.click(within(lineupControls).getByRole('button', {name: /^next$/i}))

    expect(screen.getByText(/step 5 \/ 17: slot 2 - awakener/i)).toBeInTheDocument()
    expect(screen.getByRole('heading', {level: 2, name: /slot 2/i})).toBeInTheDocument()
  })

  it('selects a slot and assigns an awakener there', () => {
    render(<BuilderV2Page />)

    fireEvent.click(screen.getByRole('button', {name: /^select slot 3$/i}))
    fireEvent.click(screen.getByRole('button', {name: /goliath/i}))

    const slot3 = screen.getByText('Slot 3').closest('article')
    if (!slot3) {
      throw new Error('Expected slot 3 article to render')
    }
    expect(within(slot3).getByText(/^Goliath$/)).toBeInTheDocument()
    expect(screen.getByText(/editing slot 3 - awakener/i)).toBeInTheDocument()
  })

  it('removes an assigned awakener from a slot', () => {
    render(<BuilderV2Page />)

    fireEvent.click(screen.getByRole('button', {name: /goliath/i}))
    fireEvent.click(screen.getByRole('button', {name: /remove goliath/i}))

    expect(screen.queryByRole('button', {name: /remove goliath/i})).not.toBeInTheDocument()
    expect(screen.getAllByText(/empty slot/i)).toHaveLength(4)
  })

  it('assigns and clears wheel and covenant loadout targets', () => {
    render(<BuilderV2Page />)

    fireEvent.click(screen.getByRole('button', {name: /goliath/i}))
    fireEvent.click(screen.getByRole('button', {name: /^select slot 1 wheel 1$/i}))
    fireEvent.click(screen.getByRole('button', {name: /merciful nurturing/i}))

    const slot1 = screen.getByText('Slot 1').closest('article')
    if (!slot1) {
      throw new Error('Expected slot 1 article to render')
    }
    expect(within(slot1).getByText(/merciful nurturing/i)).toBeInTheDocument()

    fireEvent.click(within(slot1).getByRole('button', {name: /clear slot 1 wheel 1/i}))
    expect(within(slot1).queryByText(/merciful nurturing/i)).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', {name: /^select slot 1 covenant$/i}))
    fireEvent.click(screen.getByRole('button', {name: /deus ex machina/i}))
    expect(within(slot1).getByText(/deus ex machina/i)).toBeInTheDocument()

    fireEvent.click(within(slot1).getByRole('button', {name: /clear slot 1 covenant/i}))
    expect(within(slot1).queryByText(/deus ex machina/i)).not.toBeInTheDocument()
  })

  it('assigns and clears the team posse target', () => {
    render(<BuilderV2Page />)

    fireEvent.click(screen.getByRole('button', {name: /select team posse/i}))
    fireEvent.click(screen.getByRole('button', {name: /taverns opening/i}))

    expect(screen.getByRole('button', {name: /clear posse/i})).toBeInTheDocument()
    expect(screen.getByText(/editing team 1 - posse/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', {name: /clear posse/i}))

    expect(screen.queryByRole('button', {name: /clear posse/i})).not.toBeInTheDocument()
  })

  it('drives quick lineup through visible V2 controls and picker tabs', () => {
    render(<BuilderV2Page />)

    fireEvent.click(screen.getByRole('button', {name: /quick team lineup/i}))

    expect(screen.getByText(/step 1 \/ 17: slot 1 - awakener/i)).toBeInTheDocument()
    expect(screen.getByRole('tab', {name: /^awakeners$/i})).toHaveAttribute('aria-selected', 'true')

    fireEvent.click(screen.getByRole('button', {name: /goliath/i}))

    expect(screen.getByText(/step 2 \/ 17: slot 1 - wheel 1/i)).toBeInTheDocument()
    expect(screen.getByRole('tab', {name: /^wheels$/i})).toHaveAttribute('aria-selected', 'true')

    fireEvent.click(screen.getByRole('button', {name: /^next$/i}))

    expect(screen.getByText(/step 3 \/ 17: slot 1 - wheel 2/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', {name: /^back$/i}))

    expect(screen.getByText(/step 2 \/ 17: slot 1 - wheel 1/i)).toBeInTheDocument()
  })

  it('cancels quick lineup and restores the original V2 team', () => {
    render(<BuilderV2Page />)

    fireEvent.click(screen.getByRole('button', {name: /goliath/i}))
    expect(screen.getByRole('button', {name: /remove goliath/i})).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', {name: /quick team lineup/i}))
    expect(screen.queryByRole('button', {name: /remove goliath/i})).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', {name: /cancel quick team lineup/i}))

    expect(screen.getByRole('button', {name: /remove goliath/i})).toBeInTheDocument()
    expect(screen.queryByText(/step 1 \/ 17/i)).not.toBeInTheDocument()
  })

  it('is reachable through /builder-v2 without adding a nav link', async () => {
    render(
      <MemoryRouter initialEntries={['/builder-v2']}>
        <App />
      </MemoryRouter>,
    )

    expect(await screen.findByRole('heading', {level: 1, name: /builder v2/i})).toBeInTheDocument()
    const desktopNav = screen.getByRole('navigation', {name: /primary navigation desktop/i})
    expect(within(desktopNav).queryByRole('link', {name: /builder v2/i})).not.toBeInTheDocument()
    expect(within(desktopNav).getByRole('link', {name: /^builder$/i})).toBeInTheDocument()
  })
})
