import {useLayoutEffect} from 'react'

import {render} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import {useStableEvent} from './useStableEvent'

describe('useStableEvent', () => {
  it('keeps its identity while calling the latest committed handler', () => {
    const firstHandler = vi.fn((value: string) => `first:${value}`)
    const secondHandler = vi.fn((value: string) => `second:${value}`)
    const committedCallbacks: ((value: string) => string)[] = []

    function Probe({handler}: {handler: (value: string) => string}) {
      const stableHandler = useStableEvent(handler)
      useLayoutEffect(() => {
        committedCallbacks.push(stableHandler)
      })
      return null
    }

    const view = render(<Probe handler={firstHandler} />)
    const initialCallback = committedCallbacks.at(-1)
    expect(initialCallback?.('one')).toBe('first:one')

    view.rerender(<Probe handler={secondHandler} />)
    const updatedCallback = committedCallbacks.at(-1)

    expect(updatedCallback).toBe(initialCallback)
    expect(updatedCallback?.('two')).toBe('second:two')
    expect(firstHandler).toHaveBeenCalledTimes(1)
    expect(secondHandler).toHaveBeenCalledTimes(1)
  })
})
