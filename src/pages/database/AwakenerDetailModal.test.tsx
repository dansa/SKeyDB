import {fireEvent, render, screen, waitFor} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import type {Awakener} from '@/domain/awakeners'

import {AwakenerDetailModal} from './AwakenerDetailModal'

vi.mock('../../domain/awakeners-full', () => ({
  loadAwakenersFull: async () => [
    {
      id: 1,
      stats: {
        CON: '140',
        ATK: '135',
        DEF: '126',
        CritRate: '14.6%',
        CritDamage: '50%',
        AliemusRegen: '0',
        KeyflareRegen: '15',
        RealmMastery: '0',
        SigilYield: '0%',
        DamageAmplification: '0%',
        DeathResistance: '0%',
      },
      primaryScalingBase: 30,
      statScaling: {
        CON: 1.55,
        ATK: 1.5,
        DEF: 1.4,
      },
      substatScaling: {
        CritRate: '1.6%',
      },
      cards: {},
      exalts: {
        exalt: {name: 'Exalt', description: 'x'},
        over_exalt: {name: 'Over Exalt', description: 'x'},
      },
      talents: {},
      enlightens: {},
    },
    {
      id: 2,
      stats: {
        CON: '149',
        ATK: '204',
        DEF: '160',
        CritRate: '5%',
        CritDamage: '50%',
        AliemusRegen: '0',
        KeyflareRegen: '15',
        RealmMastery: '0',
        SigilYield: '0%',
        DamageAmplification: '0%',
        DeathResistance: '0%',
      },
      primaryScalingBase: 30,
      statScaling: {
        CON: 1.35,
        ATK: 1.85,
        DEF: 1.45,
      },
      substatScaling: {},
      cards: {},
      exalts: {
        exalt: {name: 'Exalt', description: 'x'},
        over_exalt: {name: 'Over Exalt', description: 'x'},
      },
      talents: {},
      enlightens: {},
    },
  ],
  getAwakenerFullById: (id: number, data: {id: number}[]) =>
    data.find((entry) => entry.id === id) ?? null,
}))

vi.mock('../../domain/awakener-assets', () => ({
  getAwakenerPortraitAsset: () => null,
}))

vi.mock('../../domain/rich-text', () => ({
  getCardNamesFromFull: () => new Set<string>(),
}))

vi.mock('../../domain/name-format', () => ({
  formatAwakenerNameForUi: (name: string) => name,
}))

vi.mock('../../domain/factions', () => ({
  getRealmIcon: () => null,
  getRealmLabel: (realm: string) => realm,
  getRealmTint: () => '#ffffff',
}))

vi.mock('./AwakenerDetailSidebar', () => ({
  AwakenerDetailSidebar: ({
    enlightenOffset,
    level,
    onDecreaseEnlighten,
    onIncreaseEnlighten,
    onLevelChange,
    stats,
  }: {
    enlightenOffset: number
    level: number
    onDecreaseEnlighten: () => void
    onIncreaseEnlighten: () => void
    onLevelChange: (level: number) => void
    stats: {CON: string; CritRate: string} | null
  }) => (
    <div>
      <button
        onClick={() => {
          onLevelChange(90)
        }}
        type='button'
      >
        Set level 90
      </button>
      <button
        onClick={() => {
          onIncreaseEnlighten()
        }}
        type='button'
      >
        Increase Psyche Surge
      </button>
      <button
        onClick={() => {
          onDecreaseEnlighten()
        }}
        type='button'
      >
        Decrease Psyche Surge
      </button>
      <div>Sidebar Level {level}</div>
      <div>Sidebar E3+{enlightenOffset}</div>
      <div>Sidebar CON {stats?.CON ?? 'none'}</div>
      <div>Sidebar Crit Rate {stats?.CritRate ?? 'none'}</div>
    </div>
  ),
}))

vi.mock('./AwakenerDetailOverview', () => ({
  AwakenerDetailOverview: ({stats}: {stats: {CON: string; CritRate: string} | null}) => (
    <div>
      <div>Overview CON {stats?.CON ?? 'none'}</div>
      <div>Overview Crit Rate {stats?.CritRate ?? 'none'}</div>
    </div>
  ),
}))

vi.mock('./AwakenerDetailCards', () => ({
  AwakenerDetailCards: () => <div>Cards Tab</div>,
}))

vi.mock('./AwakenerBuildsTab', () => ({
  AwakenerBuildsTab: ({awakenerId}: {awakenerId: number}) => <div>Builds Tab {awakenerId}</div>,
}))

vi.mock('./AwakenerTeamsTab', () => ({
  AwakenerTeamsTab: () => <div>Teams Tab</div>,
}))

vi.mock('./SkillLevelSlider', () => ({
  SkillLevelSlider: () => <div>Skill Slider</div>,
}))

function makeAwakener(id: number, name: string): Awakener {
  return {
    id,
    name,
    realm: 'AEQUOR',
    faction: 'Test',
    type: 'ASSAULT',
    rarity: 'SSR',
    aliases: [name],
    tags: [],
  }
}

describe('AwakenerDetailModal', () => {
  it('resets active tab to overview when switching awakeners', async () => {
    const onClose = vi.fn()
    const first = makeAwakener(1, 'alpha')
    const second = makeAwakener(2, 'beta')

    const {rerender} = render(
      <AwakenerDetailModal awakener={first} key={first.id} onClose={onClose} />,
    )

    fireEvent.click(screen.getByRole('button', {name: 'Cards'}))
    expect(screen.getByRole('button', {name: 'Cards'}).className).toContain('border-amber-200/70')

    rerender(<AwakenerDetailModal awakener={second} key={second.id} onClose={onClose} />)

    await waitFor(() => {
      expect(screen.getByRole('button', {name: 'Overview'}).className).toContain(
        'border-amber-200/70',
      )
    })
  })

  it('updates resolved awakener stats when the database level changes', async () => {
    const onClose = vi.fn()
    const awakener = makeAwakener(1, 'thais')

    render(<AwakenerDetailModal awakener={awakener} onClose={onClose} />)

    await waitFor(() => {
      expect(screen.getAllByText('Sidebar Level 60')).toHaveLength(2)
      expect(screen.getAllByText('Sidebar E3+0')).toHaveLength(2)
      expect(screen.getAllByText('Sidebar CON 140')).toHaveLength(2)
      expect(screen.getAllByText('Sidebar Crit Rate 14.6%')).toHaveLength(2)
      expect(screen.getByText('Overview CON 140')).toBeInTheDocument()
      expect(screen.getByText('Overview Crit Rate 14.6%')).toBeInTheDocument()
    })

    fireEvent.click(screen.getAllByRole('button', {name: 'Set level 90'})[0])

    expect(screen.getAllByText('Sidebar Level 90')).toHaveLength(2)
    expect(screen.getAllByText('Sidebar CON 186')).toHaveLength(2)
    expect(screen.getByText('Overview CON 186')).toBeInTheDocument()
  })

  it('updates resolved substats when the Psyche Surge offset changes', async () => {
    const onClose = vi.fn()
    const awakener = makeAwakener(1, 'thais')

    render(<AwakenerDetailModal awakener={awakener} onClose={onClose} />)

    await waitFor(() => {
      expect(screen.getAllByText('Sidebar E3+0')).toHaveLength(2)
      expect(screen.getAllByText('Sidebar Crit Rate 14.6%')).toHaveLength(2)
      expect(screen.getByText('Overview Crit Rate 14.6%')).toBeInTheDocument()
    })

    fireEvent.click(screen.getAllByRole('button', {name: 'Increase Psyche Surge'})[0])

    expect(screen.getAllByText('Sidebar E3+1')).toHaveLength(2)
    expect(screen.getAllByText('Sidebar Crit Rate 16.2%')).toHaveLength(2)
    expect(screen.getByText('Overview Crit Rate 16.2%')).toBeInTheDocument()
  })

  it('passes the active awakener id to the builds tab', async () => {
    const onClose = vi.fn()
    const awakener = makeAwakener(1, 'thais')

    render(<AwakenerDetailModal awakener={awakener} onClose={onClose} />)

    fireEvent.click(screen.getByRole('button', {name: 'Builds'}))

    expect(await screen.findByText('Builds Tab 1')).toBeInTheDocument()
  })
})
