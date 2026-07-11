import {render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import type {Relic} from '@/domain/relics'

import {RelicGridCard} from './RelicGridCard'

vi.mock('@/domain/relic-assets', () => ({getRelicAssetByAssetId: () => undefined}))

const relic: Relic = {
  aliases: [],
  assetId: '',
  categories: ['ASTRAL_REIGN', 'FADED_LEGACY'],
  defaultVariantCategory: 'ASTRAL_REIGN',
  defaultVariantId: 'relic-variant-0338',
  description: '',
  id: 'relic-0207',
  kind: 'GENERIC',
  name: 'Malignant Child',
  rarity: 'N',
  relicType: 'Relic',
  route: {canonicalPath: '/database/relics/malignant-child', slug: 'malignant-child'},
  variantCount: 5,
  variantCategoryTiers: [
    {category: 'ASTRAL_REIGN', tier: 'Silver'},
    {category: 'FADED_LEGACY', tier: 'Gold'},
  ],
  variantTiers: ['Silver', 'Gold'],
}

describe('RelicGridCard', () => {
  it('renders one family card with all categories and a quiet multi-variant count', () => {
    render(<RelicGridCard awakeners={[]} index={0} onSelect={vi.fn()} relic={relic} />)

    expect(screen.getByLabelText('View relic details for Malignant Child')).toBeInTheDocument()
    expect(screen.getByText('Astral Reign · Faded Legacy')).toBeInTheDocument()
    expect(screen.queryByText(/^N(?:\s|$)/)).not.toBeInTheDocument()
    expect(screen.getByLabelText('5 variants')).toHaveTextContent('×5')
  })

  it('hides the count for a single-variant family', () => {
    render(
      <RelicGridCard
        awakeners={[]}
        index={0}
        onSelect={vi.fn()}
        relic={{...relic, variantCount: 1}}
      />,
    )

    expect(screen.queryByLabelText('1 variants')).not.toBeInTheDocument()
  })
})
