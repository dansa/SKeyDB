import {fireEvent, render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import type {AwakenerFull} from '@/domain/awakeners-full'
import {resolveTag} from '@/domain/tags'

import {RichDescription} from './RichDescription'

vi.mock('../RichTextPopovers/PopoverTrailPanel', () => ({
  PopoverTrailPanel: ({children}: {children: React.ReactNode}) => <div>{children}</div>,
}))

vi.mock('../RichTextPopovers/SkillPopover', () => ({
  SkillPopover: ({
    name,
    label,
    onNavigateToCards,
  }: {
    name: string
    label: string
    onNavigateToCards?: () => void
  }) => (
    <div>
      Skill Popover {label} {name}
      {onNavigateToCards ? (
        <button onClick={onNavigateToCards} type='button'>
          Navigate to cards
        </button>
      ) : null}
    </div>
  ),
}))

vi.mock('../RichTextPopovers/TagPopover', () => ({
  TagPopover: ({tag}: {tag: {label: string}}) => <div>Tag Popover {tag.label}</div>,
}))

vi.mock('../RichTextPopovers/ScalingPopover', () => ({
  ScalingPopover: ({values, suffix}: {values: number[]; suffix: string}) => (
    <div>
      Scaling Popover {values.join('/')}
      {suffix}
    </div>
  ),
}))

const TEST_FULL_DATA: AwakenerFull = {
  id: 1,
  name: 'salvador',
  stats: {
    CON: '100',
    ATK: '200',
    DEF: '80',
    CritRate: '5%',
    CritDamage: '50%',
    AliemusRegen: '0',
    KeyflareRegen: '0',
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
  cards: {
    C1: {name: 'Strike', cost: '2', description: 'Strike description'},
    C2: {name: 'Rouse', cost: '1', description: 'Rouse description'},
  },
  exalts: {
    exalt: {name: 'Exalt', description: 'Exalt description'},
    over_exalt: {name: 'Over Exalt', description: 'Over exalt description'},
  },
  talents: {},
  enlightens: {},
}

describe('RichDescription', () => {
  it('opens a skill popover when a rendered card token is clicked', () => {
    render(
      <RichDescription
        cardNames={new Set(['Strike'])}
        fullData={TEST_FULL_DATA}
        skillLevel={1}
        stats={TEST_FULL_DATA.stats}
        text='Use {Strike}.'
      />,
    )

    fireEvent.click(screen.getByRole('button', {name: 'Strike'}))
    expect(screen.getByText('Skill Popover ROUSE Strike')).toBeInTheDocument()
  })

  it('opens a tag popover when a mechanic token with description is clicked', () => {
    const tag = resolveTag('Weakness')
    if (!tag) {
      throw new Error('Expected Weakness tag fixture to exist')
    }

    render(
      <RichDescription
        cardNames={new Set()}
        fullData={TEST_FULL_DATA}
        skillLevel={1}
        stats={TEST_FULL_DATA.stats}
        text='Applies {Weakness}.'
      />,
    )

    fireEvent.click(screen.getByRole('button', {name: 'Weakness'}))
    expect(screen.getByText(`Tag Popover ${tag.label}`)).toBeInTheDocument()
  })

  it('opens a scaling popover when a scaling token is clicked', () => {
    render(
      <RichDescription
        cardNames={new Set()}
        fullData={TEST_FULL_DATA}
        skillLevel={1}
        stats={TEST_FULL_DATA.stats}
        text='Deals (10/20% ATK) damage.'
      />,
    )

    fireEvent.click(screen.getByRole('button', {name: '20'}))
    expect(screen.getByText('Scaling Popover 10/20%')).toBeInTheDocument()
  })

  it('treats Rouse as a clickable card token when it exists only in full card data', () => {
    render(
      <RichDescription
        cardNames={new Set()}
        fullData={TEST_FULL_DATA}
        skillLevel={1}
        stats={TEST_FULL_DATA.stats}
        text='Triggers {Rouse}.'
      />,
    )

    fireEvent.click(screen.getByRole('button', {name: 'Rouse'}))
    expect(screen.getByText('Skill Popover ROUSE Strike')).toBeInTheDocument()
  })

  it('clears the trail when navigating to the cards tab from a skill popover', () => {
    const onNavigateToCards = vi.fn()

    render(
      <RichDescription
        cardNames={new Set(['Strike'])}
        fullData={TEST_FULL_DATA}
        onNavigateToCards={onNavigateToCards}
        skillLevel={1}
        stats={TEST_FULL_DATA.stats}
        text='Use {Strike}.'
      />,
    )

    fireEvent.click(screen.getByRole('button', {name: 'Strike'}))
    expect(screen.getByText('Skill Popover ROUSE Strike')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', {name: 'Navigate to cards'}))

    expect(onNavigateToCards).toHaveBeenCalledTimes(1)
    expect(screen.queryByText('Skill Popover ROUSE Strike')).toBeNull()
  })

  it('recognizes "exalt" and "over_exalt" as interactive tokens', () => {
    render(
      <RichDescription
        cardNames={new Set()}
        fullData={TEST_FULL_DATA}
        skillLevel={1}
        stats={TEST_FULL_DATA.stats}
        text='Trigger {exalt} and then {over_exalt}.'
      />,
    )

    expect(screen.getByRole('button', {name: 'exalt'})).toBeInTheDocument()
    expect(screen.getByRole('button', {name: 'over_exalt'})).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', {name: 'exalt'}))
    expect(screen.getByText('Skill Popover EXALT Exalt')).toBeInTheDocument()
  })
})
