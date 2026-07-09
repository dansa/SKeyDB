import {render, screen, within} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import type {DzoneResolvedMonster, DzoneResolvedWave} from '@/domain/dzone'

import {toDZoneAccessibleText} from './d-zone-display-text'
import type {DZoneRelicPreview} from './d-zone-view-model'
import {DZoneWaveCard} from './DZoneWaveCard'

const relics: DZoneRelicPreview[] = [
  {id: 'relic-0084', variantId: 'relic-variant-0105', name: '@1 Shared Sigil'},
  {id: 'relic-0241', variantId: 'relic-variant-0411', name: '@2 Visible Charm'},
  {id: 'relic-0259', variantId: 'relic-variant-0450', name: '@3 Overflow Relic'},
]

const monsters: DzoneResolvedMonster[] = Array.from({length: 11}, (_, index) => {
  const monsterNumber = index + 1
  const redactionLevel = (index % 4) + 1

  return {
    id: `dzone-monster-${monsterNumber.toString().padStart(4, '0')}`,
    name: `@${redactionLevel.toString()} Monster ${monsterNumber.toString()}`,
    characteristicIds: [],
    characteristics: [],
    descriptionTemplate: 'Test monster',
    assetName: `monster-${monsterNumber.toString()}.png`,
  }
})

const wave: DzoneResolvedWave = {
  id: 'wave-1',
  name: 'Wave 1',
  initialRelicIds: relics.map((relic) => relic.id),
  initialRelicVariantIds: relics.map((relic) => relic.variantId),
  monsters,
  alerts: [
    {
      id: 'alert-1',
      name: 'Alert I',
      monsters: monsters.map((monster) => ({
        ...monster,
        alertStats: {
          alertId: 'alert-1',
          alertName: 'Alert I',
          level: 35,
          hp: 900,
          hpBars: 1,
        },
      })),
    },
    {
      id: 'alert-4',
      name: 'Alert IV',
      monsters: monsters.map((monster, index) => ({
        ...monster,
        alertStats: {
          alertId: 'alert-4',
          alertName: 'Alert IV',
          level: 70 + index,
          hp: 401964,
          hpBars: 3,
        },
      })),
    },
  ],
}

function renderWaveCard(expanded: boolean, selectedAlertId = 'alert-1') {
  return render(
    <DZoneWaveCard
      expanded={expanded}
      getMonsterAsset={() => undefined}
      onExpandedChange={vi.fn()}
      onMonsterOpen={vi.fn()}
      onRelicOpen={vi.fn()}
      relics={relics}
      selectedAlertId={selectedAlertId}
      wave={wave}
    />,
  )
}

describe('toDZoneAccessibleText', () => {
  it('strips lore markers and normalizes accessible display text', () => {
    expect(toDZoneAccessibleText('@1  Marked @4 Name')).toBe('Marked Name')
  })
})

describe('DZoneWaveCard', () => {
  it('keeps collapsed overflow relic buttons out of keyboard and accessibility reach', () => {
    renderWaveCard(false)

    const card = screen.getByRole('article', {name: 'Wave 1'})
    expect(
      within(card).getByRole('button', {name: 'View Wave 1 relic details for Shared Sigil'}),
    ).not.toHaveAttribute('tabIndex')
    expect(
      within(card).getByRole('button', {name: 'View Wave 1 relic details for Visible Charm'}),
    ).not.toHaveAttribute('tabIndex')
    expect(
      within(card).queryByRole('button', {name: 'View Wave 1 relic details for Overflow Relic'}),
    ).toBe(null)

    const overflowButton = within(card).getByTitle('Overflow Relic')
    expect(overflowButton).toHaveAttribute('aria-hidden', 'true')
    expect(overflowButton).toHaveAttribute('tabIndex', '-1')
  })

  it('shows all relic and monster buttons when expanded', () => {
    renderWaveCard(true)

    const card = screen.getByRole('article', {name: 'Wave 1'})
    expect(within(card).getAllByRole('button', {name: /View Wave 1 relic details/})).toHaveLength(
      relics.length,
    )
    expect(
      within(card).getByRole('button', {name: 'View Wave 1 relic details for Overflow Relic'}),
    ).not.toHaveAttribute('tabIndex')
    expect(within(card).getAllByRole('button', {name: /View Wave 1 monster details/})).toHaveLength(
      monsters.length,
    )
  })

  it('keeps clipped collapsed monster buttons out of keyboard and accessibility reach', () => {
    renderWaveCard(false)

    const card = screen.getByRole('article', {name: 'Wave 1'})
    expect(within(card).getAllByRole('button', {name: /View Wave 1 monster details/})).toHaveLength(
      6,
    )

    const clippedMonster = within(card).getByTitle('Monster 7')
    expect(clippedMonster).toHaveAttribute('aria-hidden', 'true')
    expect(clippedMonster).toHaveAttribute('tabIndex', '-1')
  })

  it('shows selected alert levels only on expanded monster tiles', () => {
    renderWaveCard(true, 'alert-4')

    const card = screen.getByRole('article', {name: 'Wave 1'})
    const monsterOne = within(card).getByRole('button', {
      name: 'View Wave 1 monster details for Monster 1, level 70',
    })

    const levelChip = within(monsterOne).getByText('Lv 70')
    expect(levelChip).toBeInTheDocument()
    expect(levelChip).toHaveClass('d-zone-monster-badge', 'd-zone-monster-level-chip')
    expect(levelChip.parentElement).toBe(monsterOne)
    expect(within(monsterOne).queryByText('Lv 35')).not.toBeInTheDocument()
  })

  it('hides selected alert level chips while collapsed', () => {
    renderWaveCard(false, 'alert-4')

    expect(screen.queryByText('Lv 70')).not.toBeInTheDocument()
  })
})
