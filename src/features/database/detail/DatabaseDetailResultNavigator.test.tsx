import {fireEvent, render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import {
  createDatabaseDetailResultNavigation,
  type DatabaseDetailResultNavigation,
  type DatabaseDetailResultSet,
} from './database-detail-result-navigation'
import {DatabaseDetailResultNavigator} from './DatabaseDetailResultNavigator'

const wheelResultSet: DatabaseDetailResultSet = {
  kind: 'wheel',
  items: [
    {id: 'wheel-0001', name: 'Heart of a Knight'},
    {id: 'wheel-0002', name: 'Memory Spiral'},
    {id: 'wheel-0003', name: 'Grace Through Pain'},
  ],
}

function makeNavigation(
  overrides: Partial<DatabaseDetailResultNavigation> = {},
): DatabaseDetailResultNavigation {
  return {
    current: {
      index: 1,
      ref: {kind: 'wheel', id: 'wheel-0002'},
      total: 3,
    },
    next: {
      preview: {label: 'Grace Through Pain'},
      ref: {kind: 'wheel', id: 'wheel-0003', name: 'Grace Through Pain'},
    },
    onNext: vi.fn(),
    onPrevious: vi.fn(),
    previous: {
      preview: {label: 'Heart of a Knight'},
      ref: {kind: 'wheel', id: 'wheel-0001', name: 'Heart of a Knight'},
    },
    ...overrides,
  }
}

describe('createDatabaseDetailResultNavigation', () => {
  it('derives previous and next entries from the visible database result order', () => {
    const onSelect = vi.fn()

    const navigation = createDatabaseDetailResultNavigation({
      currentRef: {kind: 'wheel', id: 'wheel-0002'},
      onSelect,
      resultSet: wheelResultSet,
    })

    expect(navigation?.current.index).toBe(1)
    expect(navigation?.current.total).toBe(3)
    expect(navigation?.previous?.preview.label).toBe('Heart of a Knight')
    expect(navigation?.previous?.ref).toEqual({
      kind: 'wheel',
      id: 'wheel-0001',
      name: 'Heart of a Knight',
    })
    expect(navigation?.next?.preview.label).toBe('Grace Through Pain')
    expect(navigation?.next?.ref).toEqual({
      kind: 'wheel',
      id: 'wheel-0003',
      name: 'Grace Through Pain',
    })

    navigation?.onPrevious()
    navigation?.onNext()

    expect(onSelect).toHaveBeenNthCalledWith(1, {
      kind: 'wheel',
      id: 'wheel-0001',
      name: 'Heart of a Knight',
    })
    expect(onSelect).toHaveBeenNthCalledWith(2, {
      kind: 'wheel',
      id: 'wheel-0003',
      name: 'Grace Through Pain',
    })
  })

  it('does not offer navigation when the open detail is outside the active result set', () => {
    const navigation = createDatabaseDetailResultNavigation({
      currentRef: {kind: 'awakener', id: 'awakener-0001'},
      onSelect: vi.fn(),
      resultSet: wheelResultSet,
    })

    expect(navigation).toBeNull()
  })
})

describe('DatabaseDetailResultNavigator', () => {
  it('renders accessible previous and next controls with the active result position', () => {
    const onPrevious = vi.fn()
    const onNext = vi.fn()

    render(
      <DatabaseDetailResultNavigator
        navigation={makeNavigation({
          onNext,
          onPrevious,
        })}
      />,
    )

    expect(
      screen.getAllByRole('button', {name: 'Previous result: Heart of a Knight'}),
    ).toHaveLength(1)
    expect(screen.getAllByRole('button', {name: 'Next result: Grace Through Pain'})).toHaveLength(1)
    expect(screen.getAllByText('2 / 3').length).toBeGreaterThan(0)
    expect(screen.queryByText('SSR - Chaos')).not.toBeInTheDocument()
    expect(screen.queryByText('SSR - Caro')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', {name: 'Previous result: Heart of a Knight'}))
    fireEvent.click(screen.getByRole('button', {name: 'Next result: Grace Through Pain'}))

    expect(onPrevious).toHaveBeenCalledTimes(1)
    expect(onNext).toHaveBeenCalledTimes(1)
  })

  it('supports arrow-key paging without stealing arrow keys from text inputs', () => {
    const onPrevious = vi.fn()
    const onNext = vi.fn()

    render(
      <>
        <input aria-label='Search wheels' />
        <DatabaseDetailResultNavigator
          navigation={makeNavigation({
            onNext,
            onPrevious,
          })}
        />
      </>,
    )

    fireEvent.keyDown(window, {key: 'ArrowRight'})
    fireEvent.keyDown(window, {key: 'ArrowLeft'})

    expect(onNext).toHaveBeenCalledTimes(1)
    expect(onPrevious).toHaveBeenCalledTimes(1)

    screen.getByLabelText('Search wheels').focus()
    fireEvent.keyDown(screen.getByLabelText('Search wheels'), {key: 'ArrowRight'})

    expect(onNext).toHaveBeenCalledTimes(1)
  })

  it('clears inherited focus from an empty detail jump search input', () => {
    render(
      <>
        <input aria-label='Jump to wheel' data-detail-search-input='' />
        <DatabaseDetailResultNavigator
          navigation={makeNavigation({
            onNext: vi.fn(),
            onPrevious: vi.fn(),
          })}
        />
      </>,
    )

    const searchInput = screen.getByLabelText('Jump to wheel')
    searchInput.focus()
    expect(document.activeElement).toBe(searchInput)

    render(
      <DatabaseDetailResultNavigator
        navigation={makeNavigation({
          current: {
            index: 2,
            ref: {kind: 'wheel', id: 'wheel-0003'},
            total: 3,
          },
          next: null,
          onNext: vi.fn(),
          onPrevious: vi.fn(),
          previous: {
            preview: {label: 'Memory Spiral'},
            ref: {kind: 'wheel', id: 'wheel-0002', name: 'Memory Spiral'},
          },
        })}
      />,
    )

    expect(document.activeElement).not.toBe(searchInput)
  })

  it('keeps an intentionally focused empty jump search when the current result is unchanged', () => {
    const navigation = makeNavigation()
    const {rerender} = render(
      <>
        <input aria-label='Jump to wheel' data-detail-search-input='' />
        <DatabaseDetailResultNavigator navigation={navigation} />
      </>,
    )

    const searchInput = screen.getByLabelText('Jump to wheel')
    searchInput.focus()

    rerender(
      <>
        <input aria-label='Jump to wheel' data-detail-search-input='' />
        <DatabaseDetailResultNavigator navigation={{...navigation}} />
      </>,
    )

    expect(document.activeElement).toBe(searchInput)
  })
})
