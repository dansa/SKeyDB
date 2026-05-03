import {fireEvent, render, screen, waitFor} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {resolveDescriptionTemplate} from '@/domain/description-args'
import {buildPublicFormulaContext} from '@/domain/public-formula-context'
import {
  buildWheelMainstatSeriesKey,
  resolveWheelMainstatValue,
} from '@/domain/wheel-mainstat-scaling'
import type {Wheel} from '@/domain/wheels'
import type {WheelFullV2Record} from '@/domain/wheels-full-v2'

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
    ownerAwakenerId: 'awakener-0001',
    ownerAwakenerName: 'alpha',
    aliases: ['Merciful Nurturing'],
    tags: ['Embryo Fusion'],
    mainstatKey: 'KEYFLARE_REGEN',
    lineupToken: 'a',
    ...overrides,
  }
}

function makeWheelFullRecord(overrides: Partial<WheelFullV2Record> = {}): WheelFullV2Record {
  return {
    id: 'B01',
    assetId: 'Weapon_Full_B01',
    name: 'Merciful Nurturing',
    rarity: 'SSR',
    realm: 'CARO',
    awakener: 'alpha',
    ownerAwakenerId: 'awakener-0001',
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
  beforeEach(() => {
    mockGetWheelAssetById.mockReset()
    mockGetWheelAssetById.mockReturnValue('/wheel.webp')
    window.localStorage.clear()
  })

  it('uses the wheel-specific enhance scaling tiers for description and mainstat values', () => {
    const wheel = makeWheel()
    const fullDataV2 = makeWheelFullRecord()

    render(
      <WheelDetailModal fullDataV2={fullDataV2} onClose={vi.fn()} wheel={wheel} wheels={[wheel]} />,
    )

    const slider = screen.getByRole('slider', {name: /enhance/i})

    expect(
      screen.getAllByText(resolveWheelMainstatValue(fullDataV2.mainstatSeriesKey, 0)).length,
    ).toBeGreaterThan(0)
    expect(
      screen.getByText(
        resolveDescriptionTemplate(fullDataV2.descriptionTemplate, fullDataV2.descriptionArgs, {
          rank: 1,
        }),
      ),
    ).toBeInTheDocument()

    fireEvent.change(slider, {
      target: {value: '1'},
    })

    expect(
      screen.getAllByText(resolveWheelMainstatValue(fullDataV2.mainstatSeriesKey, 0)).length,
    ).toBeGreaterThan(0)
    expect(
      screen.getByText(
        resolveDescriptionTemplate(fullDataV2.descriptionTemplate, fullDataV2.descriptionArgs, {
          rank: 2,
        }),
      ),
    ).toBeInTheDocument()

    fireEvent.change(slider, {
      target: {value: '2'},
    })

    expect(
      screen.getByText(
        resolveDescriptionTemplate(fullDataV2.descriptionTemplate, fullDataV2.descriptionArgs, {
          rank: 3,
        }),
      ),
    ).toBeInTheDocument()

    fireEvent.change(slider, {
      target: {value: '3'},
    })

    expect(
      screen.getAllByText(resolveWheelMainstatValue(fullDataV2.mainstatSeriesKey, 0)).length,
    ).toBeGreaterThan(0)
    expect(
      screen.getByText(
        resolveDescriptionTemplate(fullDataV2.descriptionTemplate, fullDataV2.descriptionArgs, {
          rank: 4,
        }),
      ),
    ).toBeInTheDocument()

    fireEvent.change(slider, {
      target: {value: '4'},
    })

    expect(
      screen.getAllByText(resolveWheelMainstatValue(fullDataV2.mainstatSeriesKey, 4)).length,
    ).toBeGreaterThan(0)
    expect(
      screen.getByText(
        resolveDescriptionTemplate(fullDataV2.descriptionTemplate, fullDataV2.descriptionArgs, {
          rank: 4,
        }),
      ),
    ).toBeInTheDocument()
  })

  it('navigates to the owner awakener when the owner link is activated', () => {
    const onSelectAwakener = vi.fn()

    render(
      <WheelDetailModal
        fullDataV2={makeWheelFullRecord()}
        onClose={vi.fn()}
        onSelectAwakener={onSelectAwakener}
        wheel={makeWheel()}
        wheels={[makeWheel()]}
      />,
    )

    fireEvent.click(screen.getByRole('button', {name: 'Alpha'}))

    expect(onSelectAwakener).toHaveBeenCalledWith({id: 'awakener-0001', name: 'alpha'}, 'overview')
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
        fullDataV2={makeWheelFullRecord()}
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
    const fullDataV2 = makeWheelFullRecord()

    render(
      <WheelDetailModal
        fullDataV2={fullDataV2}
        onClose={vi.fn()}
        wheel={makeWheel()}
        wheels={[makeWheel()]}
      />,
    )

    const slider = screen.getByRole('slider', {name: /enhance/i})
    expect(slider).toHaveAttribute('aria-valuetext', 'E0')

    fireEvent.change(slider, {target: {value: '99'}})
    expect(
      screen.getAllByText(resolveWheelMainstatValue(fullDataV2.mainstatSeriesKey, 15)).length,
    ).toBeGreaterThan(0)
    expect(screen.getByText('+12')).toBeInTheDocument()
    expect(screen.queryByText('E15')).not.toBeInTheDocument()

    fireEvent.change(slider, {target: {value: '-3'}})
    expect(
      screen.getAllByText(resolveWheelMainstatValue(fullDataV2.mainstatSeriesKey, 0)).length,
    ).toBeGreaterThan(0)
    expect(screen.queryByText('+12')).not.toBeInTheDocument()
    expect(screen.queryByText('E0')).not.toBeInTheDocument()
  })

  it('exposes the enhance level as aria-valuetext for keyboard users', () => {
    render(
      <WheelDetailModal
        fullDataV2={makeWheelFullRecord()}
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

  it('updates default wheel progression for the next wheel without changing the current live state', async () => {
    const firstWheel = makeWheel()
    const secondWheel = makeWheel({
      id: 'D12',
      name: 'Shared Dream',
      ownerAwakenerId: undefined,
      ownerAwakenerName: undefined,
      rarity: 'SR',
      realm: 'CHAOS',
      mainstatKey: 'CRIT_RATE',
    })

    const {rerender} = render(
      <WheelDetailModal
        fullDataV2={makeWheelFullRecord()}
        onClose={vi.fn()}
        wheel={firstWheel}
        wheels={[firstWheel, secondWheel]}
      />,
    )

    expect(screen.getByRole('slider', {name: /^enhance$/i})).toHaveAttribute('aria-valuetext', 'E0')

    fireEvent.click(screen.getByRole('button', {name: 'Open detail settings'}))
    fireEvent.change(screen.getByRole('slider', {name: /default enlighten/i}), {
      target: {value: '7'},
    })

    expect(screen.getByRole('slider', {name: /^enhance$/i})).toHaveAttribute('aria-valuetext', 'E0')
    expect(window.localStorage.getItem('database-detail-preferences')).toContain(
      '"defaultEnhanceLevel":7',
    )

    rerender(
      <WheelDetailModal
        fullDataV2={makeWheelFullRecord({
          id: secondWheel.id,
          assetId: secondWheel.assetId,
          name: secondWheel.name,
          rarity: secondWheel.rarity,
          realm: secondWheel.realm,
          awakener: secondWheel.awakener,
          ownerAwakenerId: undefined,
          ownerAwakenerName: secondWheel.ownerAwakenerName,
          aliases: secondWheel.aliases,
          mainstatKey: secondWheel.mainstatKey,
          mainstatSeriesKey: buildWheelMainstatSeriesKey(
            secondWheel.rarity,
            secondWheel.mainstatKey,
          ),
        })}
        onClose={vi.fn()}
        wheel={secondWheel}
        wheels={[firstWheel, secondWheel]}
      />,
    )

    expect(screen.getByRole('slider', {name: /^enhance$/i})).toHaveAttribute(
      'aria-valuetext',
      'E3 + 4',
    )
  })

  it('persists expanding lore on open and applies it when loading the next wheel', async () => {
    const firstWheel = makeWheel()
    const secondWheel = makeWheel({
      id: 'D12',
      name: 'Shared Dream',
      ownerAwakenerId: undefined,
      ownerAwakenerName: undefined,
      rarity: 'SR',
      realm: 'CHAOS',
      mainstatKey: 'CRIT_RATE',
    })

    const {rerender} = render(
      <WheelDetailModal
        fullDataV2={makeWheelFullRecord({
          lore: 'Line 1\nLine 2\nLine 3\nLine 4\nLine 5\nLine 6',
        })}
        onClose={vi.fn()}
        wheel={firstWheel}
        wheels={[firstWheel, secondWheel]}
      />,
    )

    expect(screen.getByText('Show More')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', {name: 'Open detail settings'}))
    fireEvent.click(screen.getByRole('checkbox', {name: /expand lore on open/i}))

    expect(window.localStorage.getItem('database-detail-preferences')).toContain(
      '"expandLoreByDefault":true',
    )
    expect(screen.getByText('Show Less')).toBeInTheDocument()

    rerender(
      <WheelDetailModal
        fullDataV2={makeWheelFullRecord({
          id: secondWheel.id,
          assetId: secondWheel.assetId,
          name: secondWheel.name,
          rarity: secondWheel.rarity,
          realm: secondWheel.realm,
          awakener: secondWheel.awakener,
          ownerAwakenerId: undefined,
          ownerAwakenerName: secondWheel.ownerAwakenerName,
          aliases: secondWheel.aliases,
          mainstatKey: secondWheel.mainstatKey,
          mainstatSeriesKey: buildWheelMainstatSeriesKey(
            secondWheel.rarity,
            secondWheel.mainstatKey,
          ),
          lore: 'Other 1\nOther 2\nOther 3\nOther 4\nOther 5\nOther 6',
        })}
        onClose={vi.fn()}
        wheel={secondWheel}
        wheels={[firstWheel, secondWheel]}
      />,
    )

    await waitFor(() => {
      expect(screen.getByText('Show Less')).toBeInTheDocument()
    })
  })

  it('uses the shared account level setting for computed public formulas', () => {
    const wheel = makeWheel()
    const fullDataV2 = makeWheelFullRecord({
      descriptionTemplate: 'Gain [StateArg1] charge.',
      descriptionArgs: {
        StateArg1: {
          kind: 'computed',
          formulaKey: 'scaled',
          baseFormula: 'accountStageGrowth',
          multiplier: 0.025,
          inputs: ['accountLevel'],
        },
      },
    })

    render(
      <WheelDetailModal fullDataV2={fullDataV2} onClose={vi.fn()} wheel={wheel} wheels={[wheel]} />,
    )

    expect(
      screen.getByText(
        resolveDescriptionTemplate(fullDataV2.descriptionTemplate, fullDataV2.descriptionArgs, {
          formulaContext: buildPublicFormulaContext({accountLevel: 50}),
        }),
      ),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', {name: 'Open detail settings'}))
    fireEvent.change(screen.getByRole('spinbutton', {name: 'Account level'}), {
      target: {value: '70'},
    })

    expect(window.localStorage.getItem('database-detail-preferences')).toContain(
      '"accountLevel":70',
    )
    expect(
      screen.getByText(
        resolveDescriptionTemplate(fullDataV2.descriptionTemplate, fullDataV2.descriptionArgs, {
          formulaContext: buildPublicFormulaContext({accountLevel: 70}),
        }),
      ),
    ).toBeInTheDocument()
  })

  it('omits owner and lore chrome when the wheel has no owner or lore data', () => {
    render(
      <WheelDetailModal
        fullDataV2={makeWheelFullRecord({
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
        fullDataV2={makeWheelFullRecord({
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

  it('uses shared database detail typography roles for scaled text and fixed utility chrome', () => {
    window.localStorage.setItem(
      'database-detail-preferences',
      JSON.stringify({
        shared: {
          showTagIcons: true,
          clickOutsideClosesPopovers: true,
          fontScale: 'large',
        },
        awakener: {
          showVisibleScaling: true,
          defaultSelection: {},
        },
        wheel: {
          defaultEnhanceLevel: 0,
          expandLoreByDefault: true,
        },
      }),
    )

    render(
      <WheelDetailModal
        fullDataV2={makeWheelFullRecord({
          lore: 'Pain, intense pain filled her every sense.\n\n<Italic:Still she kept diving.>\nRetreat to @3!\nLine 4\nLine 5',
        })}
        onClose={vi.fn()}
        wheel={makeWheel()}
        wheels={[makeWheel()]}
      />,
    )

    expect(screen.getByRole('dialog', {name: /merciful nurturing details/i})).toHaveStyle({
      '--desc-font-scale': '1.67',
    })
    expect(screen.getByRole('heading', {name: 'Merciful Nurturing'})).toHaveClass('text-xl')
    expect(
      screen.getByRole('heading', {name: 'Merciful Nurturing'}).getAttribute('style'),
    ).toBeNull()
    expect(screen.getByText('SSR').closest('p')).toHaveClass('text-xs')
    expect(screen.getByText('SSR').closest('p')?.getAttribute('style')).toBeNull()
    expect(
      screen
        .getByText(/Gain 10% Keyflare\./)
        .closest('p')
        ?.getAttribute('style'),
    ).toContain('12px')
    expect(document.querySelector('[data-wheel-lore-content]')?.getAttribute('style')).toContain(
      '20px',
    )
    expect(screen.getByRole('button', {name: 'Show Less'}).getAttribute('style')).toBeNull()
  })

  it('keeps the header fixed and scrolls only the detail body region', () => {
    render(
      <WheelDetailModal
        fullDataV2={makeWheelFullRecord({
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
        fullDataV2={makeWheelFullRecord()}
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
        fullDataV2={makeWheelFullRecord()}
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

  it('does not mutate hidden wheel search while the art viewer overlay owns focus', () => {
    render(
      <WheelDetailModal
        fullDataV2={makeWheelFullRecord()}
        onClose={vi.fn()}
        wheel={makeWheel()}
        wheels={[makeWheel()]}
      />,
    )

    const searchInput = screen.getByRole('combobox', {name: /jump to wheel/i})

    fireEvent.click(
      screen.getAllByRole('button', {name: /view full art for merciful nurturing/i})[0],
    )

    const overlay = screen.getByRole('dialog', {name: /merciful nurturing full art/i})
    expect(overlay).toHaveFocus()

    fireEvent.keyDown(window, {key: 'b'})

    expect(searchInput).toHaveValue('')
    expect(overlay).toHaveFocus()
  })
})
