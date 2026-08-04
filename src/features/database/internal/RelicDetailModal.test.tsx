import {useState} from 'react'

import {fireEvent, render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {MemoryRouter} from 'react-router'
import {describe, expect, it, vi} from 'vitest'

import {getRelicById, loadRelicRecordById} from '@/domain/relics'

import {buildRelicVariantLabels, getRelicVariantMetadataLabels} from './relic-database-presentation'
import {RelicDetailModal} from './RelicDetailModal'

async function loadFixture(id: string) {
  const item = getRelicById(id)
  const fullData = await loadRelicRecordById(id)
  if (!item || !fullData) throw new Error(`Missing relic fixture ${id}`)
  return {fullData, item}
}

describe('RelicDetailModal', () => {
  it('de-duplicates equivalent variant type and category metadata', () => {
    expect(getRelicVariantMetadataLabels({category: 'PENDULUM', variantType: 'PENDULUM'})).toEqual([
      'Pendulum',
    ])
    expect(getRelicVariantMetadataLabels({category: 'EVENT', variantType: 'EVENT'})).toEqual([
      'Event',
    ])
  })

  it('adds honest ordinals when a family repeats variant labels', async () => {
    const {fullData} = await loadFixture('relic-0113')
    const labels = buildRelicVariantLabels(fullData.variants)
    expect(labels.get('relic-variant-0138')).toBe('Pendulum — Variant 1')
    expect(labels.get('relic-variant-0146')).toBe('Pendulum — Variant 9')
  })

  it('uses descriptive source names when repeated labels can be honestly distinguished', async () => {
    const {fullData} = await loadFixture('relic-0171')
    const labels = buildRelicVariantLabels(fullData.variants)
    expect(labels.get('relic-variant-0256')).toBe('Pendulum — Gateway of All Realms α')
    expect(labels.get('relic-variant-0264')).toBe('Pendulum — Gateway of All Realms ι')
  })

  it('exposes the distinguishing names of newly consolidated family variants', async () => {
    const {fullData} = await loadFixture('relic-0067')
    const labels = buildRelicVariantLabels(fullData.variants)

    expect(labels.get('relic-variant-0074')).toBe('Event - Special — Argent Return: Birth')
    expect(labels.get('relic-variant-0080')).toBe('Event - Special — Argent Return: Sorrow')
  })

  it('defensively renders the family default for an invalid controlled variant', async () => {
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

    expect(screen.getByRole('heading', {name: 'Effect'})).toBeInTheDocument()
    expect(screen.getByRole('heading', {name: 'Lore'})).toBeInTheDocument()
    expect(screen.getByRole('combobox', {name: 'Relic variant switcher'})).toHaveValue(
      fullData.defaultVariantId,
    )
    expect(onRelicVariantChange).not.toHaveBeenCalled()
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
      screen.getByRole('combobox', {name: 'Relic variant switcher'}),
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

  it('renders a single variant with the same rail copy and row treatment as larger families', async () => {
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

    expect(screen.queryByRole('combobox', {name: 'Relic variant switcher'})).not.toBeInTheDocument()
    const variantRail = screen.getByRole('region', {name: 'Relic variants'})
    expect(variantRail).toHaveTextContent('Variants')
    expect(variantRail).toHaveTextContent('1 recorded')
    expect(variantRail).not.toHaveTextContent('Edition')
    expect(variantRail).not.toHaveTextContent('One recorded version')
    expect(variantRail).toHaveClass('h-52')
    expect(
      screen.getByRole('button', {name: 'Select relic variant Dimensional Image'}),
    ).toHaveClass('min-h-10', 'text-left')
    expect(screen.queryByText('SSR')).not.toBeInTheDocument()
    expect(document.querySelector('aside')).toHaveClass('w-[12rem]')
    expect(document.querySelector('aside')).not.toHaveClass('w-[21rem]')
    expect(document.querySelector('aside img')).toHaveClass('max-h-full', 'max-w-full')
    expect(document.querySelector('aside img')).not.toHaveClass('h-full', 'w-full')
    const desktopArtButton = document.querySelector('aside button')
    expect(desktopArtButton).toHaveClass('p-4')
    expect(desktopArtButton).not.toHaveClass('p-10', 'lg:p-14')
    await user.click(screen.getByRole('button', {name: '24'}))
    expect(onSelectAwakener).toHaveBeenCalledWith({id: 'awakener-0001', name: '24'}, 'overview')
  })

  it('changes exact variants with the desktop rail and mobile switcher', async () => {
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

    const secondVariant = fullData.variants[1]
    const secondVariantLabel =
      buildRelicVariantLabels(fullData.variants).get(secondVariant.id) ?? secondVariant.label
    await user.click(
      screen.getByRole('button', {name: `Select relic variant ${secondVariantLabel}`}),
    )
    expect(onRelicVariantChange).toHaveBeenCalledWith(secondVariant.id)
    await user.selectOptions(
      screen.getByRole('combobox', {name: 'Relic variant switcher'}),
      fullData.variants[3]?.id ?? '',
    )
    expect(screen.getByRole('combobox', {name: 'Relic variant switcher'})).toHaveClass(
      'appearance-none',
      'pr-11',
    )
    expect(onRelicVariantChange).toHaveBeenCalledWith(fullData.variants[3]?.id)
  })

  it('moves between variants with ArrowUp and ArrowDown without wrapping', async () => {
    const {fullData, item} = await loadFixture('relic-0229')
    const firstVariant = fullData.variants[0]
    const secondVariant = fullData.variants[1]
    const onRelicVariantChange = vi.fn()

    function ControlledRelicDetail() {
      const [selectedVariantId, setSelectedVariantId] = useState(firstVariant.id)
      return (
        <RelicDetailModal
          fullData={fullData}
          item={item}
          onClose={vi.fn()}
          onRelicVariantChange={(variantId) => {
            onRelicVariantChange(variantId)
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

    fireEvent.keyDown(window, {key: 'ArrowUp'})
    expect(onRelicVariantChange).not.toHaveBeenCalled()

    fireEvent.keyDown(screen.getByRole('button', {name: 'Close relic detail'}), {
      key: 'ArrowDown',
    })
    expect(onRelicVariantChange).toHaveBeenLastCalledWith(secondVariant.id)

    fireEvent.keyDown(window, {key: 'ArrowUp'})
    expect(onRelicVariantChange).toHaveBeenLastCalledWith(firstVariant.id)
    expect(onRelicVariantChange).toHaveBeenCalledTimes(2)

    for (let index = 1; index < fullData.variants.length; index += 1) {
      fireEvent.keyDown(window, {key: 'ArrowDown'})
    }
    expect(onRelicVariantChange).toHaveBeenLastCalledWith(fullData.variants.at(-1)?.id)
    fireEvent.keyDown(window, {key: 'ArrowDown'})
    expect(onRelicVariantChange).toHaveBeenCalledTimes(fullData.variants.length + 1)
  })

  it('leaves arrow keys to the focused native variant selector', async () => {
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

    fireEvent.keyDown(screen.getByRole('combobox', {name: 'Relic variant switcher'}), {
      key: 'ArrowDown',
    })
    expect(onRelicVariantChange).not.toHaveBeenCalled()
  })
})
