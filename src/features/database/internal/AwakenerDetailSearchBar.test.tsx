import {fireEvent, render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import type {Awakener} from '@/domain/awakeners'

import {AwakenerDetailSearchBar} from './AwakenerDetailSearchBar'

vi.mock('@/domain/awakener-assets', () => ({
  getAwakenerPortraitAsset: () => null,
}))

vi.mock('@/domain/name-format', () => ({
  formatAwakenerNameForUi: (name: string) => name,
}))

vi.mock('@/domain/realms', () => ({
  getRealmLabel: (realm: string) => realm,
  getRealmAccent: () => '#ffffff',
}))

const RESULTS: Awakener[] = [
  {
    id: 'awakener-0001',
    name: 'alpha',
    realm: 'CHAOS',
    faction: 'Test',
    type: 'ASSAULT',
    rarity: 'SSR',
    aliases: ['alpha'],
    tags: [],
    lineupToken: 'a',
  },
  {
    id: 'awakener-0002',
    name: 'beta',
    realm: 'AEQUOR',
    faction: 'Test',
    type: 'ASSAULT',
    rarity: 'SSR',
    aliases: ['beta'],
    tags: [],
    lineupToken: 'b',
  },
]

describe('AwakenerDetailSearchBar', () => {
  it('scrolls the active option into view when keyboard navigation changes it', () => {
    const scrollIntoView = vi.fn()
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: scrollIntoView,
    })

    const {rerender} = render(
      <AwakenerDetailSearchBar
        activeIndex={0}
        isOpen
        inputRef={{current: null}}
        onQueryChange={vi.fn()}
        onSelectAwakener={vi.fn()}
        query='a'
        results={RESULTS}
      />,
    )

    scrollIntoView.mockClear()

    rerender(
      <AwakenerDetailSearchBar
        activeIndex={1}
        isOpen
        inputRef={{current: null}}
        onQueryChange={vi.fn()}
        onSelectAwakener={vi.fn()}
        query='a'
        results={RESULTS}
      />,
    )

    expect(screen.getByRole('option', {name: /beta/i})).toHaveAttribute('aria-selected', 'true')
    expect(scrollIntoView).toHaveBeenCalled()
  })

  it('wires the combobox active descendant to the highlighted option', () => {
    render(
      <AwakenerDetailSearchBar
        activeIndex={1}
        isOpen
        inputRef={{current: null}}
        onQueryChange={vi.fn()}
        onSelectAwakener={vi.fn()}
        query='a'
        results={RESULTS}
      />,
    )

    const input = screen.getByRole('combobox', {name: /jump to awakener/i})
    const activeOption = screen.getByRole('option', {name: /beta/i})

    expect(activeOption).toHaveAttribute('id')
    expect(input).toHaveAttribute('aria-activedescendant', activeOption.getAttribute('id'))
  })

  it('keeps the combobox collapsed until the search surface is actually open', () => {
    const {rerender} = render(
      <AwakenerDetailSearchBar
        activeIndex={0}
        isOpen={false}
        inputRef={{current: null}}
        onQueryChange={vi.fn()}
        onSelectAwakener={vi.fn()}
        query='alpha'
        results={RESULTS}
      />,
    )

    expect(screen.getByRole('combobox', {name: /jump to awakener/i})).toHaveAttribute(
      'aria-expanded',
      'false',
    )
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()

    rerender(
      <AwakenerDetailSearchBar
        activeIndex={0}
        isOpen
        inputRef={{current: null}}
        onQueryChange={vi.fn()}
        onSelectAwakener={vi.fn()}
        query='alpha'
        results={RESULTS}
      />,
    )

    expect(screen.getByRole('combobox', {name: /jump to awakener/i})).toHaveAttribute(
      'aria-expanded',
      'true',
    )
    expect(screen.getByRole('listbox')).toBeInTheDocument()
  })

  it('shows an empty-state listbox when the search is open with no matches', () => {
    render(
      <AwakenerDetailSearchBar
        activeIndex={0}
        isOpen
        inputRef={{current: null}}
        onQueryChange={vi.fn()}
        onSelectAwakener={vi.fn()}
        query='zzz'
        results={[]}
      />,
    )

    expect(screen.getByRole('combobox', {name: /jump to awakener/i})).toHaveAttribute(
      'aria-expanded',
      'true',
    )
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    expect(screen.getByText('No awakeners matched that search.')).toBeInTheDocument()
  })

  it('keeps popup options out of the normal tab order while preserving click selection', () => {
    const onSelectAwakener = vi.fn()

    render(
      <AwakenerDetailSearchBar
        activeIndex={0}
        isOpen
        inputRef={{current: null}}
        onQueryChange={vi.fn()}
        onSelectAwakener={onSelectAwakener}
        query='a'
        results={RESULTS}
      />,
    )

    const option = screen.getByRole('option', {name: /alpha/i})
    expect(option).toHaveAttribute('tabindex', '-1')

    fireEvent.click(option)

    expect(onSelectAwakener).toHaveBeenCalledWith(expect.objectContaining({id: 'awakener-0001'}))
  })
})
