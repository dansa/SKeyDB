import {render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import type {Awakener} from '@/domain/awakeners'
import type {AwakenerFull} from '@/domain/awakeners-full'

import {AwakenerDetailOverview} from './AwakenerDetailOverview'

vi.mock('../../../../domain/relics', () => ({
  getPortraitRelicByAwakenerIngameId: () => null,
}))

vi.mock('../../../../domain/relic-assets', () => ({
  getRelicPortraitAssetByAssetId: () => null,
}))

vi.mock('../../RichText/RichDescription', () => ({
  RichDescription: ({text}: {text: string}) => <span>{text}</span>,
}))

const TEST_AWAKENER: Awakener = {
  id: 1,
  name: 'salvador',
  realm: 'CHAOS',
  faction: 'Test',
  type: 'ASSAULT',
  rarity: 'SSR',
  aliases: ['salvador'],
  tags: [],
}

const TEST_FULL_DATA: AwakenerFull = {
  id: 1,
  name: 'salvador',
  stats: {
    CON: '100',
    ATK: '100',
    DEF: '100',
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
  primaryScalingBase: 20,
  statScaling: {
    CON: 1,
    ATK: 1,
    DEF: 1,
  },
  substatScaling: {},
  cards: {},
  exalts: {
    exalt: {name: 'Exalt', description: 'Exalt description'},
    over_exalt: {name: 'Over Exalt', description: 'Over Exalt description'},
  },
  talents: {
    T1: {name: 'First Talent', description: 'First description'},
    T2: {name: 'Second Talent', description: 'Second description'},
    T3: {name: 'Third Talent', description: 'Third description'},
    T4: {name: 'Fourth Talent', description: 'Fourth description'},
  },
  enlightens: {},
}

describe('AwakenerDetailOverview', () => {
  it('renders fourth talent entries when they exist in the full data', () => {
    render(
      <AwakenerDetailOverview
        awakener={TEST_AWAKENER}
        cardNames={new Set()}
        fullData={TEST_FULL_DATA}
        skillLevel={1}
        fontScale={'medium'}
        stats={TEST_FULL_DATA.stats}
        mode='talents'
      />,
    )

    expect(screen.getByText('First Talent')).toBeInTheDocument()
    expect(screen.getByText('Second Talent')).toBeInTheDocument()
    expect(screen.getByText('Third Talent')).toBeInTheDocument()
    expect(screen.getByText('Fourth Talent')).toBeInTheDocument()
    expect(screen.getByText('T4')).toBeInTheDocument()
  })

  it('renders enlightens, including the E15 absolute axiom fallback', () => {
    render(
      <AwakenerDetailOverview
        awakener={TEST_AWAKENER}
        cardNames={new Set()}
        fullData={{
          ...TEST_FULL_DATA,
          talents: {},
          enlightens: {
            E1: {name: 'E1 Name', description: 'E1 description'},
            E2: {name: 'E2 Name', description: 'E2 description'},
            E3: {name: 'E3 Name', description: 'E3 description'},
            E15: {name: 'Absolute Axiom', description: 'Axiom description'},
          },
        }}
        skillLevel={1}
        fontScale='large'
        stats={TEST_FULL_DATA.stats}
        mode='copies'
      />,
    )

    expect(screen.getByText('E1 Name')).toBeInTheDocument()
    expect(screen.getByText('E2 Name')).toBeInTheDocument()
    expect(screen.getByText('E3 Name')).toBeInTheDocument()
    expect(screen.getByText('Absolute Axiom')).toBeInTheDocument()
    expect(screen.getByText('Е15')).toBeInTheDocument()
  })

  it('shows an empty state when no entries exist for the selected mode', () => {
    render(
      <AwakenerDetailOverview
        awakener={TEST_AWAKENER}
        cardNames={new Set()}
        fullData={{...TEST_FULL_DATA, talents: {}, enlightens: {}}}
        skillLevel={1}
        fontScale='medium'
        stats={TEST_FULL_DATA.stats}
        mode='talents'
      />,
    )

    expect(screen.getByText('No talent data available.')).toBeInTheDocument()
  })
})
