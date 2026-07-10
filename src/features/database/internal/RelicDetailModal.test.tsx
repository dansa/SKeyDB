import {useState} from 'react'

import {render, screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {MemoryRouter} from 'react-router-dom'
import {describe, expect, it, vi} from 'vitest'

import {getRelicById, loadRelicRecordById} from '@/domain/relics'

import {buildRelicVariantLabels} from './relic-database-presentation'
import {RelicDetailModal} from './RelicDetailModal'

async function loadFixture(id: string) {
  const item = getRelicById(id)
  const fullData = await loadRelicRecordById(id)
  if (!item || !fullData) throw new Error(`Missing relic fixture ${id}`)
  return {fullData, item}
}

describe('RelicDetailModal', () => {
  it('adds honest ordinals when a family repeats variant labels', async () => {
    const {fullData} = await loadFixture('relic-0113')
    const labels = buildRelicVariantLabels(fullData.variants)
    expect(labels.get('relic-variant-0138')).toBe('Pendulum — Variant 1')
    expect(labels.get('relic-variant-0146')).toBe('Pendulum — Variant 9')
  })

  it('keeps using the source label and honest ordinals when variant names differ', async () => {
    const {fullData} = await loadFixture('relic-0171')
    const labels = buildRelicVariantLabels(fullData.variants)
    expect(labels.get('relic-variant-0256')).toBe('Pendulum — Variant 1')
    expect(labels.get('relic-variant-0264')).toBe('Pendulum — Variant 9')
  })

  it('canonicalizes an invalid variant to the family default and renders Effect and Lore', async () => {
    const {fullData, item} = await loadFixture('relic-0207')
    const onRelicVariantChange = vi.fn()
    render(
      <MemoryRouter>
        <RelicDetailModal
          fullData={fullData}
          item={item}
          onClose={vi.fn()}
          onRelicVariantChange={onRelicVariantChange}
          selectedVariantId='relic-variant-9999'
        />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(onRelicVariantChange).toHaveBeenCalledWith(fullData.defaultVariantId)
    })
    expect(screen.getByRole('heading', {name: 'Effect'})).toBeInTheDocument()
    expect(screen.getByRole('heading', {name: 'Lore'})).toBeInTheDocument()
    expect(screen.getByRole('combobox', {name: 'Relic variant'})).toHaveValue(
      fullData.defaultVariantId,
    )
  })

  it('falls back to non-empty family Effect and Lore when variant fields are blank', async () => {
    const {fullData, item} = await loadFixture('relic-0207')
    const firstVariant = fullData.variants[0]
    const recordWithBlankVariantText = {
      ...fullData,
      descriptionTemplate: 'Family fallback effect.',
      lore: 'Family fallback lore.',
      variants: [
        {...firstVariant, descriptionTemplate: '   ', lore: ''},
        ...fullData.variants.slice(1),
      ],
    }

    render(
      <MemoryRouter>
        <RelicDetailModal
          fullData={recordWithBlankVariantText}
          item={item}
          onClose={vi.fn()}
          selectedVariantId={firstVariant.id}
        />
      </MemoryRouter>,
    )

    expect(screen.getByText('Family fallback effect.')).toBeInTheDocument()
    expect(screen.getByText('Family fallback lore.')).toBeInTheDocument()
  })

  it('updates exact Effect and Lore content when the controlled variant changes', async () => {
    const user = userEvent.setup()
    const {fullData, item} = await loadFixture('relic-0207')
    const firstVariant = fullData.variants[0]
    const secondVariant = fullData.variants[1]
    const recordWithDistinctText = {
      ...fullData,
      variants: [
        {...firstVariant, descriptionTemplate: 'First exact effect.', lore: 'First exact lore.'},
        {...secondVariant, descriptionTemplate: 'Second exact effect.', lore: 'Second exact lore.'},
        ...fullData.variants.slice(2),
      ],
    }

    function ControlledRelicDetail() {
      const [selectedVariantId, setSelectedVariantId] = useState(firstVariant.id)
      return (
        <RelicDetailModal
          fullData={recordWithDistinctText}
          item={item}
          onClose={vi.fn()}
          onRelicVariantChange={(variantId) => {
            if (variantId) setSelectedVariantId(variantId)
          }}
          selectedVariantId={selectedVariantId}
        />
      )
    }

    render(
      <MemoryRouter>
        <ControlledRelicDetail />
      </MemoryRouter>,
    )

    expect(screen.getByText('First exact effect.')).toBeInTheDocument()
    expect(screen.getByText('First exact lore.')).toBeInTheDocument()
    await user.selectOptions(
      screen.getByRole('combobox', {name: 'Relic variant'}),
      secondVariant.id,
    )
    expect(screen.getByText('Second exact effect.')).toBeInTheDocument()
    expect(screen.getByText('Second exact lore.')).toBeInTheDocument()
    expect(screen.queryByText('First exact effect.')).not.toBeInTheDocument()
  })

  it('uses exact variant type metadata and does not invent missing rarity or category metadata', async () => {
    const {fullData, item} = await loadFixture('relic-0207')
    const categorylessVariant = fullData.variants.find(
      (variant) => !variant.category && !variant.rarity,
    )
    if (!categorylessVariant) throw new Error('Missing categoryless relic variant fixture')

    render(
      <MemoryRouter>
        <RelicDetailModal
          fullData={fullData}
          item={item}
          onClose={vi.fn()}
          selectedVariantId={categorylessVariant.id}
        />
      </MemoryRouter>,
    )

    expect(screen.getByText('Awakener Mechanic')).toBeInTheDocument()
    expect(screen.queryByText(fullData.relicType)).not.toBeInTheDocument()
    expect(screen.queryByText('N')).not.toBeInTheDocument()
    expect(screen.queryByText('Astral Reign')).not.toBeInTheDocument()
    expect(screen.queryByText('Faded Legacy')).not.toBeInTheDocument()
  })

  it('hides the navigator for one variant and opens the mapped Awakener owner', async () => {
    const user = userEvent.setup()
    const {fullData, item} = await loadFixture('relic-0001')
    const onSelectAwakener = vi.fn()
    render(
      <MemoryRouter>
        <RelicDetailModal
          fullData={fullData}
          item={item}
          onClose={vi.fn()}
          onRelicVariantChange={vi.fn()}
          onSelectAwakener={onSelectAwakener}
          selectedVariantId={fullData.defaultVariantId}
        />
      </MemoryRouter>,
    )

    expect(screen.queryByRole('combobox', {name: 'Relic variant'})).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', {name: '24'}))
    expect(onSelectAwakener).toHaveBeenCalledWith({id: 'awakener-0001', name: '24'}, 'overview')
  })

  it('changes exact variants with the settled select and arrows', async () => {
    const user = userEvent.setup()
    const {fullData, item} = await loadFixture('relic-0229')
    const onRelicVariantChange = vi.fn()
    render(
      <MemoryRouter>
        <RelicDetailModal
          fullData={fullData}
          item={item}
          onClose={vi.fn()}
          onRelicVariantChange={onRelicVariantChange}
          selectedVariantId={fullData.defaultVariantId}
        />
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', {name: 'Next relic variant'}))
    expect(onRelicVariantChange).toHaveBeenCalledWith(fullData.variants[1]?.id)
    await user.selectOptions(
      screen.getByRole('combobox', {name: 'Relic variant'}),
      fullData.variants[3]?.id ?? '',
    )
    expect(onRelicVariantChange).toHaveBeenCalledWith(fullData.variants[3]?.id)
  })
})
