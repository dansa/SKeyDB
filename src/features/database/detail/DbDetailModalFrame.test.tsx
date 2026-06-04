import {render} from '@testing-library/react'
import {afterEach, describe, expect, it} from 'vitest'

import {DbDetailModalFrame} from './DbDetailModalFrame'

describe('DbDetailModalFrame', () => {
  afterEach(() => {
    document.body.style.overflow = ''
    document.body.style.position = ''
    document.documentElement.style.overflow = ''
  })

  it('does not apply a second page scroll lock over database detail chrome', () => {
    document.body.style.overflow = 'hidden'

    const {unmount} = render(
      <DbDetailModalFrame ariaLabel='Database detail'>
        <p>Detail content</p>
      </DbDetailModalFrame>,
    )

    expect(document.body.style.overflow).toBe('hidden')
    expect(document.body.style.position).toBe('')
    expect(document.documentElement.style.overflow).toBe('')

    unmount()

    expect(document.body.style.overflow).toBe('hidden')
    expect(document.body.style.position).toBe('')
    expect(document.documentElement.style.overflow).toBe('')
  })
})
