import {fireEvent, render, screen} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

import {StageBannerRules} from './StageBannerRules'

describe('StageBannerRules', () => {
  it('shows shared rules once before each kind-specific set', () => {
    render(<StageBannerRules profiles={['awakener', 'wheel']} />)
    fireEvent.click(screen.getByText('Rules & Rates'))
    expect(screen.getAllByText(/SSR rate per pull/)).toHaveLength(1)
    expect(screen.getByRole('heading', {name: 'Character Awakening'})).toBeInTheDocument()
    expect(screen.getByRole('heading', {name: 'Wheel Awakening'})).toBeInTheDocument()
    expect(screen.getByText(/33.33% chance to be the rate-up/)).toBeInTheDocument()
    expect(screen.getByText(/50% chance to be the rate-up/)).toBeInTheDocument()
  })
})
