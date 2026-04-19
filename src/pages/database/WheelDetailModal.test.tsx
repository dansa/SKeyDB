import {fireEvent, render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import {resolveDescriptionTemplate} from '@/domain/description-args'
import {
  buildWheelMainstatSeriesKey,
  resolveWheelMainstatValue,
} from '@/domain/wheel-mainstat-scaling'
import type {Wheel} from '@/domain/wheels'
import type {WheelFullV1Record} from '@/domain/wheels-full-v1'

import {WheelDetailModal} from './WheelDetailModal'

const mockGetWheelAssetById = vi.fn((_wheelId: string): string | undefined => '/wheel.webp')

vi.mock('@/domain/wheel-assets', () => ({
  getWheelAssetById: (wheelId: string) => mockGetWheelAssetById(wheelId),
}))

vi.mock('@/domain/name-format', () => ({
  formatAwakenerNameForUi: (name: string) =>
    name.charAt(0).toUpperCase() + name.slice(1).toLowerCase(),
}))

function makeWheel(overrides: Partial<Wheel> = {}): Wheel {
  return {
    id: 'B01',
    assetId: 'Weapon_Full_B01',
    name: 'Merciful Nurturing',
    rarity: 'SSR',
    realm: 'CARO',
    awakener: 'alpha',
    ownerAwakenerId: 1,
    ownerAwakenerName: 'alpha',
    aliases: ['Merciful Nurturing'],
    tags: ['Embryo Fusion'],
    mainstatKey: 'KEYFLARE_REGEN',
    ...overrides,
  }
}

function makeWheelFullRecord(overrides: Partial<WheelFullV1Record> = {}): WheelFullV1Record {
  return {
    id: 'B01',
    assetId: 'Weapon_Full_B01',
    name: 'Merciful Nurturing',
    rarity: 'SSR',
    realm: 'CARO',
    awakener: 'alpha',
    ownerAwakenerId: 1,
    ownerAwakenerName: 'alpha',
    aliases: ['Merciful Nurturing'],
    searchTags: ['Embryo Fusion'],
    mainstatKey: 'KEYFLARE_REGEN',
    mainstatSeriesKey: buildWheelMainstatSeriesKey('SSR', 'KEYFLARE_REGEN'),
    descriptionTemplate: 'Gain [StateArg1]% Keyflare.',
    descriptionArgs: {
      StateArg1: {
        kind: 'scaling',
        values: ['10', '20', '30', '40'],
        suffix: '%',
      },
    },
    ...overrides,
  }
}

describe('WheelDetailModal', () => {
  it('uses the wheel-specific enhance scaling tiers for description and mainstat values', () => {
    const wheel = makeWheel()
    const fullDataV1 = makeWheelFullRecord()

    render(
      <WheelDetailModal fullDataV1={fullDataV1} onClose={vi.fn()} wheel={wheel} wheels={[wheel]} />,
    )

    const slider = screen.getByRole('slider', {name: /enhance/i})

    expect(
      screen.getAllByText(resolveWheelMainstatValue(fullDataV1.mainstatSeriesKey, 0)).length,
    ).toBeGreaterThan(0)
    expect(
      screen.getByText(
        resolveDescriptionTemplate(fullDataV1.descriptionTemplate, fullDataV1.descriptionArgs, {
          rank: 1,
        }),
      ),
    ).toBeInTheDocument()

    fireEvent.change(slider, {
      target: {value: '1'},
    })

    expect(
      screen.getAllByText(resolveWheelMainstatValue(fullDataV1.mainstatSeriesKey, 0)).length,
    ).toBeGreaterThan(0)
    expect(
      screen.getByText(
        resolveDescriptionTemplate(fullDataV1.descriptionTemplate, fullDataV1.descriptionArgs, {
          rank: 2,
        }),
      ),
    ).toBeInTheDocument()

    fireEvent.change(slider, {
      target: {value: '2'},
    })

    expect(
      screen.getByText(
        resolveDescriptionTemplate(fullDataV1.descriptionTemplate, fullDataV1.descriptionArgs, {
          rank: 3,
        }),
      ),
    ).toBeInTheDocument()

    fireEvent.change(slider, {
      target: {value: '3'},
    })

    expect(
      screen.getAllByText(resolveWheelMainstatValue(fullDataV1.mainstatSeriesKey, 0)).length,
    ).toBeGreaterThan(0)
    expect(
      screen.getByText(
        resolveDescriptionTemplate(fullDataV1.descriptionTemplate, fullDataV1.descriptionArgs, {
          rank: 4,
        }),
      ),
    ).toBeInTheDocument()

    fireEvent.change(slider, {
      target: {value: '4'},
    })

    expect(
      screen.getAllByText(resolveWheelMainstatValue(fullDataV1.mainstatSeriesKey, 4)).length,
    ).toBeGreaterThan(0)
    expect(
      screen.getByText(
        resolveDescriptionTemplate(fullDataV1.descriptionTemplate, fullDataV1.descriptionArgs, {
          rank: 4,
        }),
      ),
    ).toBeInTheDocument()
  })

  it('navigates to the owner awakener when the owner link is activated', () => {
    const onSelectAwakener = vi.fn()

    render(
      <WheelDetailModal
        fullDataV1={makeWheelFullRecord()}
        onClose={vi.fn()}
        onSelectAwakener={onSelectAwakener}
        wheel={makeWheel()}
        wheels={[makeWheel()]}
      />,
    )

    fireEvent.click(screen.getByRole('button', {name: 'Alpha'}))

    expect(onSelectAwakener).toHaveBeenCalledWith({id: 1, name: 'alpha'}, 'overview')
  })

  it('renders a wheel jump combobox and navigates to another wheel from search', () => {
    const onSelectWheel = vi.fn()
    const currentWheel = makeWheel()
    const alternateWheel = makeWheel({
      id: 'D12',
      name: 'Shared Dream',
      ownerAwakenerId: undefined,
      ownerAwakenerName: undefined,
      rarity: 'SR',
      realm: 'CHAOS',
      mainstatKey: 'CRIT_RATE',
    })

    render(
      <WheelDetailModal
        fullDataV1={makeWheelFullRecord()}
        onClose={vi.fn()}
        onSelectWheel={onSelectWheel}
        wheel={currentWheel}
        wheels={[currentWheel, alternateWheel]}
      />,
    )

    fireEvent.change(screen.getByRole('combobox', {name: /jump to wheel/i}), {
      target: {value: 'Shared'},
    })

    fireEvent.click(screen.getByRole('option', {name: /shared dream/i}))

    expect(onSelectWheel).toHaveBeenCalledWith(expect.objectContaining({name: 'Shared Dream'}))
  })

  it('clamps the enhance slider within supported wheel bounds', () => {
    const fullDataV1 = makeWheelFullRecord()

    render(
      <WheelDetailModal
        fullDataV1={fullDataV1}
        onClose={vi.fn()}
        wheel={makeWheel()}
        wheels={[makeWheel()]}
      />,
    )

    const slider = screen.getByRole('slider', {name: /enhance/i})
    expect(slider).toHaveAttribute('aria-valuetext', 'E0')

    fireEvent.change(slider, {target: {value: '99'}})
    expect(
      screen.getAllByText(resolveWheelMainstatValue(fullDataV1.mainstatSeriesKey, 15)).length,
    ).toBeGreaterThan(0)
    expect(screen.getByText('+12')).toBeInTheDocument()
    expect(screen.queryByText('E15')).not.toBeInTheDocument()

    fireEvent.change(slider, {target: {value: '-3'}})
    expect(
      screen.getAllByText(resolveWheelMainstatValue(fullDataV1.mainstatSeriesKey, 0)).length,
    ).toBeGreaterThan(0)
    expect(screen.queryByText('+12')).not.toBeInTheDocument()
    expect(screen.queryByText('E0')).not.toBeInTheDocument()
  })

  it('exposes the enhance level as aria-valuetext for keyboard users', () => {
    render(
      <WheelDetailModal
        fullDataV1={makeWheelFullRecord()}
        onClose={vi.fn()}
        wheel={makeWheel()}
        wheels={[makeWheel()]}
      />,
    )

    const slider = screen.getByRole('slider', {name: /enhance/i})

    expect(slider).toHaveAttribute('aria-valuetext', 'E0')

    fireEvent.change(slider, {target: {value: '7'}})

    expect(screen.getByRole('slider', {name: /enhance/i})).toHaveAttribute(
      'aria-valuetext',
      'E3 + 4',
    )
  })

  it('omits owner and lore chrome when the wheel has no owner or lore data', () => {
    render(
      <WheelDetailModal
        fullDataV1={makeWheelFullRecord({
          lore: undefined,
          ownerAwakenerId: undefined,
          ownerAwakenerName: undefined,
        })}
        onClose={vi.fn()}
        wheel={makeWheel({awakener: '', ownerAwakenerId: undefined, ownerAwakenerName: undefined})}
        wheels={[
          makeWheel({awakener: '', ownerAwakenerId: undefined, ownerAwakenerName: undefined}),
        ]}
      />,
    )

    expect(screen.queryByRole('button', {name: 'alpha'})).not.toBeInTheDocument()
    expect(screen.queryByText('Lore')).not.toBeInTheDocument()
  })

  it('renders lore with limited markup and censor tokens without exposing raw tags', () => {
    render(
      <WheelDetailModal
        fullDataV1={makeWheelFullRecord({
          lore: 'Pain, intense pain filled her every sense.\n\n<Italic:Still she kept diving.>\nIn her first year as an <Awakener>.\nRetreat to @3!',
        })}
        onClose={vi.fn()}
        wheel={makeWheel()}
        wheels={[makeWheel()]}
      />,
    )

    expect(screen.getByText(/Pain, intense pain filled her every sense\./)).toBeInTheDocument()
    expect(screen.getByText(/Still she kept diving\./)).toBeInTheDocument()
    expect(
      screen.getByText(
        (_, element) => element?.textContent === 'In her first year as an Awakener.',
      ),
    ).toBeInTheDocument()
    expect(screen.queryByText(/<Italic:/)).not.toBeInTheDocument()
    expect(screen.queryByText(/@3/)).not.toBeInTheDocument()
    expect(screen.getByLabelText('Redacted lore text')).toBeInTheDocument()
  })

  it('keeps the header fixed and scrolls only the detail body region', () => {
    render(
      <WheelDetailModal
        fullDataV1={makeWheelFullRecord({
          lore: 'Line 1\nLine 2\nLine 3\nLine 4\nLine 5\nLine 6',
        })}
        onClose={vi.fn()}
        wheel={makeWheel()}
        wheels={[makeWheel()]}
      />,
    )

    expect(screen.getByRole('heading', {name: 'Merciful Nurturing'})).toBeInTheDocument()
    expect(document.querySelector('[data-wheel-detail-scroll]')).not.toBeNull()
    expect(screen.getByText('Show More')).toBeInTheDocument()
  })

  it('shows a stable no-image fallback when wheel art is unavailable', () => {
    mockGetWheelAssetById.mockReturnValueOnce(undefined).mockReturnValueOnce(undefined)

    render(
      <WheelDetailModal
        fullDataV1={makeWheelFullRecord()}
        onClose={vi.fn()}
        wheel={makeWheel()}
        wheels={[makeWheel()]}
      />,
    )

    expect(screen.getAllByText('No Image')).toHaveLength(1)
  })

  it('opens the full wheel art overlay and closes it on backdrop click', () => {
    render(
      <WheelDetailModal
        fullDataV1={makeWheelFullRecord()}
        onClose={vi.fn()}
        wheel={makeWheel()}
        wheels={[makeWheel()]}
      />,
    )

    fireEvent.click(
      screen.getAllByRole('button', {name: /view full art for merciful nurturing/i})[0],
    )

    expect(screen.getByRole('dialog', {name: /merciful nurturing full art/i})).toBeInTheDocument()
    expect(screen.getByRole('img', {name: /merciful nurturing full art/i})).toHaveAttribute(
      'src',
      '/wheel.webp',
    )

    fireEvent.click(screen.getByRole('dialog', {name: /merciful nurturing full art/i}))

    expect(
      screen.queryByRole('dialog', {name: /merciful nurturing full art/i}),
    ).not.toBeInTheDocument()
  })
})
