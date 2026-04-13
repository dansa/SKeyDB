import {render, screen} from '@testing-library/react'
import {afterEach, describe, expect, it} from 'vitest'

import {
  getStarSize,
  readFontScale,
  renderTextWithBreaks,
  scaledFontStyle,
  writeFontScale,
} from './font-scale'

afterEach(() => {
  localStorage.clear()
})

describe('font-scale utilities', () => {
  it('reads and writes valid font scale values from local storage', () => {
    writeFontScale('large')
    expect(readFontScale()).toBe('large')
  })

  it('falls back to small when the stored value is invalid', () => {
    localStorage.setItem('modal-font-scale', 'huge')
    expect(readFontScale()).toBe('small')
  })

  it('returns scaled style values and star sizing presets', () => {
    expect(scaledFontStyle(12)).toEqual({fontSize: 'calc(var(--desc-font-scale, 1) * 12px)'})
    expect(getStarSize('small')).toEqual({width: '24px', height: '24px', space: '-space-x-2.5'})
    expect(getStarSize('medium')).toEqual({width: '28px', height: '28px', space: '-space-x-3.5'})
    expect(getStarSize('large')).toEqual({width: '32px', height: '32px', space: '-space-x-4'})
  })

  it('renders line breaks as separate spans and br elements', () => {
    render(<div>{renderTextWithBreaks('alpha\nbeta')}</div>)

    expect(screen.getByText('alpha')).toBeInTheDocument()
    expect(screen.getByText('beta')).toBeInTheDocument()
    expect(document.querySelectorAll('br')).toHaveLength(1)
  })
})
