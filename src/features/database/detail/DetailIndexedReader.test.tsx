import {useState} from 'react'

import {act, cleanup, fireEvent, render, screen} from '@testing-library/react'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {DetailIndexedReader, type DetailIndexEntry} from './DetailIndexedReader'

const items: DetailIndexEntry[] = [
  {id: 'daily', label: 'Daily', children: [{id: 'greeting', label: 'Greeting'}]},
  {id: 'battle', label: 'Battle'},
]

function Contents() {
  return (
    <>
      <h2 id='daily' data-detail-anchor tabIndex={-1}>
        Daily quotes
      </h2>
      <h3 id='greeting' data-detail-anchor tabIndex={-1}>
        Greeting quote
      </h3>
      <h2 id='battle' data-detail-anchor tabIndex={-1}>
        Battle quotes
      </h2>
    </>
  )
}

function mockPositions(reader: HTMLElement) {
  vi.spyOn(reader, 'getBoundingClientRect').mockImplementation(() => ({top: 100}) as DOMRect)
  for (const [index, id] of ['daily', 'greeting', 'battle'].entries()) {
    const target = document.getElementById(id)
    if (!target) throw new Error(`Missing test anchor ${id}`)
    vi.spyOn(target, 'getBoundingClientRect').mockImplementation(
      () => ({top: 100 + index * 300 - reader.scrollTop}) as DOMRect,
    )
  }
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('DetailIndexedReader', () => {
  it('keeps all groups expanded across scrolling while respecting manual collapse', () => {
    render(
      <DetailIndexedReader
        items={[
          items[0],
          {id: 'battle', label: 'Battle', children: [{id: 'victory', label: 'Victory'}]},
        ]}
        scrollKey='skills'
        defaultExpandedGroups='all'
      >
        <Contents />
      </DetailIndexedReader>,
    )
    const reader = screen.getByLabelText('Reading area')
    mockPositions(reader)
    expect(screen.getByRole('button', {name: 'Greeting'})).toBeInTheDocument()
    expect(screen.getByRole('button', {name: 'Victory'})).toBeInTheDocument()
    reader.scrollTop = 620
    fireEvent.scroll(reader)
    expect(screen.getByRole('button', {name: 'Greeting'})).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', {name: 'Collapse Daily'}))
    reader.scrollTop = 320
    fireEvent.scroll(reader)
    expect(screen.queryByRole('button', {name: 'Greeting'})).not.toBeInTheDocument()
    expect(screen.getByRole('button', {name: 'Victory'})).toBeInTheDocument()
  })

  it('moves and focuses anchors within its own reading area', () => {
    render(
      <DetailIndexedReader items={items} scrollKey='quotes'>
        <Contents />
      </DetailIndexedReader>,
    )
    const reader = screen.getByLabelText('Reading area')
    mockPositions(reader)
    const focus = vi.spyOn(screen.getByRole('heading', {name: 'Battle quotes'}), 'focus')
    fireEvent.click(screen.getByRole('button', {name: 'Battle'}))
    expect(reader.scrollTop).toBe(600)
    expect(focus).toHaveBeenCalledWith({preventScroll: true})
    expect(screen.getByRole('button', {name: 'Battle'})).toHaveAttribute('aria-current', 'location')
  })

  it('tracks headings while scrolling and after content resize', () => {
    const resizes = new Set<() => void>()
    vi.stubGlobal(
      'ResizeObserver',
      class {
        callback: () => void
        constructor(callback: () => void) {
          this.callback = callback
          resizes.add(callback)
        }
        observe = vi.fn()
        disconnect = () => {
          resizes.delete(this.callback)
        }
      },
    )
    render(
      <DetailIndexedReader items={items} scrollKey='quotes'>
        <Contents />
      </DetailIndexedReader>,
    )
    const reader = screen.getByLabelText('Reading area')
    mockPositions(reader)
    reader.scrollTop = 350
    fireEvent.scroll(reader)
    expect(screen.getByRole('button', {name: 'Greeting'})).toHaveAttribute(
      'aria-current',
      'location',
    )
    reader.scrollTop = 620
    act(() => {
      for (const resize of [...resizes]) resize()
    })
    expect(screen.getByRole('button', {name: 'Battle'})).toHaveAttribute('aria-current', 'location')
  })

  it('supports grouped native index navigation and controlled chapter selection', () => {
    const onSelect = vi.fn()
    render(
      <DetailIndexedReader items={items} scrollKey='stories' selectedId='daily' onSelect={onSelect}>
        <Contents />
      </DetailIndexedReader>,
    )
    const select = screen.getByRole('combobox', {name: 'Index'})
    expect(select).toHaveValue('daily')
    expect(screen.getByRole('group', {name: 'Daily'})).toBeInTheDocument()
    fireEvent.change(select, {target: {value: 'greeting'}})
    expect(onSelect).toHaveBeenCalledWith('greeting')
    fireEvent.click(screen.getByRole('button', {name: 'Battle'}))
    expect(onSelect).toHaveBeenCalledWith('battle')
    expect(screen.getByLabelText('Reading area').scrollTop).toBe(0)
    expect(screen.getByRole('button', {name: 'Daily'})).toHaveAttribute('aria-current', 'location')
  })

  it('keeps group navigation separate from collapsing and reveals newly active groups', () => {
    render(
      <DetailIndexedReader items={items} scrollKey='quotes'>
        <Contents />
      </DetailIndexedReader>,
    )
    const reader = screen.getByLabelText('Reading area')
    mockPositions(reader)
    reader.scrollTop = 320
    fireEvent.scroll(reader)
    fireEvent.click(screen.getByRole('button', {name: 'Collapse Daily'}))
    expect(screen.queryByRole('button', {name: 'Greeting'})).not.toBeInTheDocument()
    expect(screen.getByRole('button', {name: 'Daily'})).toHaveAttribute('aria-current', 'location')
    expect(reader.scrollTop).toBe(320)
    reader.scrollTop = 620
    fireEvent.scroll(reader)
    reader.scrollTop = 320
    fireEvent.scroll(reader)
    expect(screen.getByRole('button', {name: 'Greeting'})).toHaveAttribute(
      'aria-current',
      'location',
    )
    expect(screen.getByRole('button', {name: 'Collapse Daily'})).toHaveAttribute(
      'aria-expanded',
      'true',
    )
  })

  it('focuses the newly selected chapter while restoring its reading position', () => {
    function Chapters() {
      const [chapter, setChapter] = useState('first')
      return (
        <DetailIndexedReader
          items={[
            {id: 'first', label: 'First'},
            {id: 'second', label: 'Second'},
          ]}
          scrollKey={chapter}
          selectedId={chapter}
          onSelect={setChapter}
        >
          <h2 data-detail-anchor id={chapter} key={chapter} tabIndex={-1}>
            {chapter} chapter
          </h2>
        </DetailIndexedReader>
      )
    }
    render(<Chapters />)
    const reader = screen.getByLabelText('Reading area')
    reader.scrollTop = 180
    fireEvent.scroll(reader)
    fireEvent.click(screen.getByRole('button', {name: 'Second'}))
    expect(screen.getByRole('heading', {name: 'second chapter'})).toHaveFocus()
    expect(reader.scrollTop).toBe(0)
    fireEvent.change(screen.getByRole('combobox', {name: 'Index'}), {target: {value: 'first'}})
    expect(screen.getByRole('heading', {name: 'first chapter'})).toHaveFocus()
    expect(reader.scrollTop).toBe(180)
  })

  it('reveals the active rail entry when the responsive rail becomes visible', () => {
    const observers = new Map<Element, () => void>()
    vi.stubGlobal(
      'ResizeObserver',
      class {
        targets: Element[] = []
        private callback: () => void
        constructor(callback: () => void) {
          this.callback = callback
        }
        observe = (target: Element) => {
          this.targets.push(target)
          observers.set(target, this.callback)
        }
        disconnect = () => {
          for (const target of this.targets) observers.delete(target)
        }
      },
    )
    render(
      <DetailIndexedReader items={items} scrollKey='quotes' selectedId='battle'>
        <Contents />
      </DetailIndexedReader>,
    )
    const index = screen.getByRole('navigation', {name: 'Section index'})
    let height = 0
    vi.spyOn(index, 'getBoundingClientRect').mockImplementation(
      () => ({top: 0, bottom: height, height}) as DOMRect,
    )
    vi.spyOn(
      screen.getByRole('button', {name: 'Battle'}),
      'getBoundingClientRect',
    ).mockImplementation(() => ({top: 224, bottom: 260}) as DOMRect)
    act(() => {
      observers.get(index)?.()
    })
    expect(index.scrollTop).toBe(0)
    height = 120
    act(() => {
      observers.get(index)?.()
    })
    expect(index.scrollTop).toBe(140)
  })

  it('selects the final anchor at the bottom even when it cannot reach the top', () => {
    render(
      <DetailIndexedReader items={items} scrollKey='quotes'>
        <Contents />
      </DetailIndexedReader>,
    )
    const reader = screen.getByLabelText('Reading area')
    mockPositions(reader)
    Object.defineProperties(reader, {
      scrollHeight: {configurable: true, value: 900},
      clientHeight: {configurable: true, value: 500},
    })
    reader.scrollTop = 400
    fireEvent.scroll(reader)
    expect(screen.getByRole('button', {name: 'Battle'})).toHaveAttribute('aria-current', 'location')
  })

  it('keeps a requested end-of-content anchor selected until scrolling resumes', () => {
    render(
      <DetailIndexedReader items={items} scrollKey='quotes'>
        <Contents />
      </DetailIndexedReader>,
    )
    const reader = screen.getByLabelText('Reading area')
    mockPositions(reader)
    let position = 0
    Object.defineProperties(reader, {
      scrollHeight: {configurable: true, value: 700},
      clientHeight: {configurable: true, value: 500},
      scrollTop: {
        configurable: true,
        get: () => position,
        set: (value: number) => {
          position = Math.min(200, value)
        },
      },
    })
    fireEvent.change(screen.getByRole('combobox', {name: 'Index'}), {target: {value: 'greeting'}})
    fireEvent.scroll(reader)
    expect(screen.getByRole('combobox', {name: 'Index'})).toHaveValue('greeting')
    reader.scrollTop = 190
    fireEvent.scroll(reader)
    expect(screen.getByRole('combobox', {name: 'Index'})).toHaveValue('daily')
  })

  it('restores independent scroll positions when returning to a section', () => {
    const {rerender} = render(
      <DetailIndexedReader items={items} scrollKey='quotes'>
        <Contents />
      </DetailIndexedReader>,
    )
    const reader = screen.getByLabelText('Reading area')
    reader.scrollTop = 450
    fireEvent.scroll(reader)
    rerender(
      <DetailIndexedReader items={items} scrollKey='skill-lore'>
        <Contents />
      </DetailIndexedReader>,
    )
    expect(reader.scrollTop).toBe(0)
    reader.scrollTop = 200
    fireEvent.scroll(reader)
    rerender(
      <DetailIndexedReader items={items} scrollKey='quotes'>
        <Contents />
      </DetailIndexedReader>,
    )
    expect(reader.scrollTop).toBe(450)
  })

  it('omits both indexes when there are no entries', () => {
    render(
      <DetailIndexedReader items={[]} scrollKey='intro' toolbar={<button>Intro</button>}>
        Introduction
      </DetailIndexedReader>,
    )
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    expect(screen.getByRole('button', {name: 'Intro'})).toBeInTheDocument()
  })
})
