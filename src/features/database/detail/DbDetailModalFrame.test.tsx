import {render} from '@testing-library/react'
import {afterEach, describe, expect, it} from 'vitest'

import {DbDetailModalFrame} from './DbDetailModalFrame'

describe('DbDetailModalFrame', () => {
  afterEach(() => {
    document.body.style.overflow = ''
    document.body.style.position = ''
    document.documentElement.style.overflow = ''
    document.documentElement.style.scrollbarGutter = ''
  })

  it('owns the database page scroll lock before opening its native dialog', () => {
    const {unmount} = render(
      <DbDetailModalFrame ariaLabel='Database detail'>
        <p>Detail content</p>
      </DbDetailModalFrame>,
    )

    expect(document.body.style.overflow).toBe('')
    expect(document.body.style.position).toBe('')
    expect(document.documentElement.style.overflow).toBe('hidden')
    expect(document.documentElement.style.scrollbarGutter).toBe('stable')

    unmount()

    expect(document.body.style.overflow).toBe('')
    expect(document.body.style.position).toBe('')
    expect(document.documentElement.style.overflow).toBe('')
    expect(document.documentElement.style.scrollbarGutter).toBe('')
  })
})
