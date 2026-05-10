import {act, fireEvent, render, screen} from '@testing-library/react'
import {afterEach, describe, expect, it, vi} from 'vitest'

import type {AwakenerFull} from '@/domain/awakeners-full'
import {resolveTag} from '@/domain/tags'

import {GlobalPopoverContainer} from '../RichTextPopovers/trail/GlobalPopoverContainer'
import * as popoverRenderersModule from '../RichTextPopovers/trail/popover-renderers'
import {usePopoverStore} from '../RichTextPopovers/trail/usePopoverStore'
import {RichDescription} from './RichDescription'

vi.mock('../RichTextPopovers/trail/PopoverTrailPanel', () => ({
  PopoverTrailPanel: ({
    children,
    onCloseTop,
  }: {
    children: React.ReactNode
    onCloseTop: () => void
  }) => (
    <div>
      <button onClick={onCloseTop} type='button'>
        Close top
      </button>
      {children}
    </div>
  ),
}))

vi.mock('../RichTextPopovers/entries/SkillPopover', () => ({
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

vi.mock('../RichTextPopovers/entries/TagPopover', () => ({
  TagPopover: ({tag}: {tag: {label: string}}) => <div>Tag Popover {tag.label}</div>,
}))

vi.mock('../RichTextPopovers/entries/ScalingPopover', () => ({
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

afterEach(() => {
  act(() => {
    usePopoverStore.getState().clear()
  })
  vi.restoreAllMocks()
})

describe('RichDescription', () => {
  it('routes trail rendering through renderTrailEntry and preserves close callbacks for nested entries', () => {
    const anchorElement = document.createElement('button')
    document.body.appendChild(anchorElement)
    anchorElement.getBoundingClientRect = () =>
      ({
        top: 10,
        bottom: 30,
        left: 20,
        right: 40,
        width: 20,
        height: 20,
        x: 20,
        y: 10,
        toJSON: () => ({}),
      }) as DOMRect

    act(() => {
      usePopoverStore.setState({
        trail: [
          {
            key: 'skill:strike',
            kind: 'skill',
            name: 'Strike',
            label: 'C1',
            description: 'Strike description',
          },
          {
            key: 'tag:weakness',
            kind: 'tag',
            tag: {
              key: 'weakness',
              label: 'Weakness',
              description: 'desc',
              iconId: 'UI_Battle_White_Buff_001',
              aliases: [],
            },
          },
          {
            key: 'scaling:atk',
            kind: 'scaling',
            values: [10, 20],
            suffix: '%',
            stat: 'ATK',
          },
        ],
        anchorRect: anchorElement.getBoundingClientRect(),
        anchorElement,
        renderContext: {
          cardNames: new Set(['Strike']),
          fullData: TEST_FULL_DATA,
          skillLevel: 1,
          stats: TEST_FULL_DATA.stats,
        },
      })
    })

    const renderTrailEntrySpy = vi
      .spyOn(popoverRenderersModule, 'renderTrailEntry')
      .mockImplementation((entry, context) => (
        <div key={entry.key}>
          <span>{entry.key}</span>
          {context.onBack ? (
            <button onClick={context.onBack} type='button'>
              Back {entry.key}
            </button>
          ) : null}
          <button onClick={context.onClose} type='button'>
            Close {entry.key}
          </button>
        </div>
      ))

    render(
      <>
        <RichDescription
          cardNames={new Set(['Strike'])}
          fullData={TEST_FULL_DATA}
          skillLevel={1}
          stats={TEST_FULL_DATA.stats}
          text='Ignored because trail is mocked.'
        />
        <GlobalPopoverContainer />
      </>,
    )

    expect(renderTrailEntrySpy).toHaveBeenCalledTimes(3)
    expect(renderTrailEntrySpy.mock.calls[0]?.[1]).toMatchObject({depth: 1, totalDepth: 3})
    expect(renderTrailEntrySpy.mock.calls[1]?.[1]).toMatchObject({depth: 2, totalDepth: 3})
    expect(renderTrailEntrySpy.mock.calls[2]?.[1]).toMatchObject({depth: 3, totalDepth: 3})

    // Test "Close scaling:atk" first (at index 2)
    fireEvent.click(screen.getByRole('button', {name: 'Close scaling:atk'}))
    expect(usePopoverStore.getState().trail.length).toBe(2)

    // Re-render happens, tag:weakness is still there. Test "Back tag:weakness" (at index 1)
    fireEvent.click(screen.getByRole('button', {name: 'Back tag:weakness'}))
    expect(usePopoverStore.getState().trail.length).toBe(1)

    // Test "Close top"
    fireEvent.click(screen.getByRole('button', {name: 'Close top'}))
    expect(usePopoverStore.getState().trail.length).toBe(0)
  })

  it('opens a skill popover when a rendered card token is clicked', () => {
    render(
      <>
        <RichDescription
          cardNames={new Set(['Strike'])}
          fullData={TEST_FULL_DATA}
          skillLevel={1}
          stats={TEST_FULL_DATA.stats}
          text='Use {Strike}.'
        />
        <GlobalPopoverContainer />
      </>,
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
      <>
        <RichDescription
          cardNames={new Set()}
          fullData={TEST_FULL_DATA}
          skillLevel={1}
          stats={TEST_FULL_DATA.stats}
          text='Applies {Weakness}.'
        />
        <GlobalPopoverContainer />
      </>,
    )

    fireEvent.click(screen.getByRole('button', {name: 'Weakness'}))
    expect(screen.getByText(`Tag Popover ${tag.label}`)).toBeInTheDocument()
  })

  it('opens a scaling popover when a scaling token is clicked', () => {
    render(
      <>
        <RichDescription
          cardNames={new Set()}
          fullData={TEST_FULL_DATA}
          skillLevel={1}
          stats={TEST_FULL_DATA.stats}
          text='Deals (10/20% ATK) damage.'
        />
        <GlobalPopoverContainer />
      </>,
    )

    fireEvent.click(screen.getByRole('button', {name: '20'}))
    expect(screen.getByText('Scaling Popover 10/20%')).toBeInTheDocument()
  })

  it('treats Rouse as a clickable card token when it exists only in full card data', () => {
    render(
      <>
        <RichDescription
          cardNames={new Set()}
          fullData={TEST_FULL_DATA}
          skillLevel={1}
          stats={TEST_FULL_DATA.stats}
          text='Triggers {Rouse}.'
        />
        <GlobalPopoverContainer />
      </>,
    )

    fireEvent.click(screen.getByRole('button', {name: 'Rouse'}))
    expect(screen.getByText('Skill Popover ROUSE Strike')).toBeInTheDocument()
  })

  it('clears the trail when navigating to the cards tab from a skill popover', () => {
    const onNavigateToCards = vi.fn()

    render(
      <>
        <RichDescription
          cardNames={new Set(['Strike'])}
          fullData={TEST_FULL_DATA}
          onNavigateToCards={onNavigateToCards}
          skillLevel={1}
          stats={TEST_FULL_DATA.stats}
          text='Use {Strike}.'
        />
        <GlobalPopoverContainer />
      </>,
    )

    fireEvent.click(screen.getByRole('button', {name: 'Strike'}))
    expect(screen.getByText('Skill Popover ROUSE Strike')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', {name: 'Navigate to cards'}))

    expect(onNavigateToCards).toHaveBeenCalledTimes(1)
    expect(screen.queryByText('Skill Popover ROUSE Strike')).toBeNull()
  })

  it('recognizes "exalt" and "over_exalt" as interactive tokens', () => {
    render(
      <>
        <RichDescription
          cardNames={new Set()}
          fullData={TEST_FULL_DATA}
          skillLevel={1}
          stats={TEST_FULL_DATA.stats}
          text='Trigger {exalt} and then {over_exalt}.'
        />
        <GlobalPopoverContainer />
      </>,
    )

    expect(screen.getByRole('button', {name: 'exalt'})).toBeInTheDocument()
    expect(screen.getByRole('button', {name: 'over_exalt'})).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', {name: 'exalt'}))
    expect(screen.getByText('Skill Popover EXALT Exalt')).toBeInTheDocument()
  })
})
