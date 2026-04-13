import {fireEvent, render, screen, waitFor} from '@testing-library/react'
import {afterEach, describe, expect, it, vi} from 'vitest'

import type {Awakener} from '@/domain/awakeners'

import {resetAwakenerDetailModalStore} from '../State/useAwakenerDetailModalStore'
import {AwakenerDetailModal} from './AwakenerDetailModal'

vi.mock('../../../../../domain/awakeners-full', () => ({
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
        BaseAliemus: '100',
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
        BaseAliemus: '100',
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

vi.mock('../../../../../domain/awakener-assets', () => ({
  getAwakenerPortraitAsset: () => null,
}))

vi.mock('../../../../../domain/rich-text', () => ({
  getCardNamesFromFull: () => new Set<string>(),
}))

vi.mock('../../../../../domain/name-format', () => ({
  formatAwakenerNameForUi: (name: string) => name,
}))

vi.mock('../../../../../domain/factions', () => ({
  getRealmIcon: () => null,
  getRealmLabel: (realm: string) => realm,
  getRealmTint: () => '#ffffff',
}))

vi.mock('./AwakenerDetailSidebar', () => ({
  AwakenerDetailSidebar: ({
    enlightenOffset,
    level,
    onLevelChange,
    onPsycheSurgeChange,
    onSkillLevelChange,
    scalingPreviewSource: _scalingPreviewSource,
    skillLevel,
    stats,
  }: {
    enlightenOffset: number
    level: number
    onLevelChange: (level: number) => void
    onPsycheSurgeChange: (offset: number) => void
    onSkillLevelChange: (level: number) => void
    scalingPreviewSource: unknown
    skillLevel: number
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
          onSkillLevelChange(6)
        }}
        type='button'
      >
        Set skill level 6
      </button>
      <button
        onClick={() => {
          onPsycheSurgeChange(1)
        }}
        type='button'
      >
        Set Psyche Surge 1
      </button>
      <div>Sidebar Level {level}</div>
      <div>Sidebar Skill Level {skillLevel}</div>
      <div>Sidebar E3+{enlightenOffset}</div>
      <div>Sidebar CON {stats?.CON ?? 'none'}</div>
      <div>Sidebar Crit Rate {stats?.CritRate ?? 'none'}</div>
    </div>
  ),
}))

vi.mock('../Content/AwakenerDetailOverview', () => ({
  AwakenerDetailOverview: ({
    stats,
    mode,
  }: {
    stats: {CON: string; CritRate: string} | null
    mode: 'copies' | 'talents'
  }) => (
    <div>
      <div>
        {mode === 'copies' ? 'Copies' : 'Talents'} CON {stats?.CON ?? 'none'}
      </div>
      <div>
        {mode === 'copies' ? 'Copies' : 'Talents'} Crit Rate {stats?.CritRate ?? 'none'}
      </div>
    </div>
  ),
}))

vi.mock('../Content/AwakenerDetailCards', () => ({
  AwakenerDetailCards: () => <div>Skills Tab</div>,
}))

vi.mock('../Builds/AwakenerBuildsTab', () => ({
  AwakenerBuildsTab: ({awakenerId}: {awakenerId: number}) => <div>Builds Tab {awakenerId}</div>,
}))

vi.mock('../Content/AwakenerTeamsTab', () => ({
  AwakenerTeamsTab: () => <div>Teams Tab</div>,
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

afterEach(() => {
  localStorage.clear()
  resetAwakenerDetailModalStore()
})

describe('AwakenerDetailModal', () => {
  it('resets active tab to Skills when switching awakeners', async () => {
    const onClose = vi.fn()
    const first = makeAwakener(1, 'alpha')
    const second = makeAwakener(2, 'beta')

    const {rerender} = render(
      <AwakenerDetailModal awakener={first} key={first.id} onClose={onClose} />,
    )

    fireEvent.click(screen.getByRole('button', {name: 'Copies'}))
    expect(screen.getByRole('button', {name: 'Copies'}).className).toContain('text-amber-100')

    rerender(<AwakenerDetailModal awakener={second} key={second.id} onClose={onClose} />)

    await waitFor(() => {
      expect(screen.getByRole('button', {name: 'Skills'}).className).toContain('text-amber-100')
    })
  })

  it('updates resolved awakener stats when the database level changes', async () => {
    const onClose = vi.fn()
    const awakener = makeAwakener(1, 'thais')

    render(<AwakenerDetailModal awakener={awakener} onClose={onClose} />)

    fireEvent.click(screen.getByRole('button', {name: 'Copies'}))

    await waitFor(() => {
      expect(screen.getAllByText('Sidebar Level 60')).toHaveLength(2)
      expect(screen.getAllByText('Sidebar Skill Level 1')).toHaveLength(2)
      expect(screen.getAllByText('Sidebar E3+0')).toHaveLength(2)
      expect(screen.getAllByText('Sidebar CON 140')).toHaveLength(2)
      expect(screen.getAllByText('Sidebar Crit Rate 14.6%')).toHaveLength(2)
      expect(screen.getByText('Copies CON 140')).toBeInTheDocument()
      expect(screen.getByText('Copies Crit Rate 14.6%')).toBeInTheDocument()
    })

    fireEvent.click(screen.getAllByRole('button', {name: 'Set level 90'})[0])

    expect(screen.getAllByText('Sidebar Level 90')).toHaveLength(2)
    expect(screen.getAllByText('Sidebar CON 186')).toHaveLength(2)
    expect(screen.getByText('Copies CON 186')).toBeInTheDocument()
  })

  it('updates resolved substats when the Psyche Surge offset changes', async () => {
    const onClose = vi.fn()
    const awakener = makeAwakener(1, 'thais')

    render(<AwakenerDetailModal awakener={awakener} onClose={onClose} />)

    fireEvent.click(screen.getByRole('button', {name: 'Copies'}))

    await waitFor(() => {
      expect(screen.getAllByText('Sidebar E3+0')).toHaveLength(2)
      expect(screen.getAllByText('Sidebar Crit Rate 14.6%')).toHaveLength(2)
      expect(screen.getByText('Copies Crit Rate 14.6%')).toBeInTheDocument()
    })

    fireEvent.click(screen.getAllByRole('button', {name: 'Set Psyche Surge 1'})[0])

    expect(screen.getAllByText('Sidebar E3+1')).toHaveLength(2)
    expect(screen.getAllByText('Sidebar Crit Rate 16.2%')).toHaveLength(2)
    expect(screen.getByText('Copies Crit Rate 16.2%')).toBeInTheDocument()
  })

  it('passes the active awakener id to the builds tab', async () => {
    const onClose = vi.fn()
    const awakener = makeAwakener(1, 'thais')

    render(<AwakenerDetailModal awakener={awakener} onClose={onClose} />)

    fireEvent.click(screen.getByRole('button', {name: 'Builds'}))

    expect(await screen.findByText('Builds Tab 1')).toBeInTheDocument()
  })

  it('keeps skill level state in the sidebar block', async () => {
    const onClose = vi.fn()
    const awakener = makeAwakener(1, 'thais')

    render(<AwakenerDetailModal awakener={awakener} onClose={onClose} />)

    await waitFor(() => {
      expect(screen.getAllByText('Sidebar Skill Level 1')).toHaveLength(2)
    })

    fireEvent.click(screen.getAllByRole('button', {name: 'Set skill level 6'})[0])

    expect(screen.getAllByText('Sidebar Skill Level 6')).toHaveLength(2)
  })
})
