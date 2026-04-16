import type {ComponentProps} from 'react'

import {fireEvent, render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import type {AwakenerOverlayRecord} from '@/domain/awakener-source-schema'
import type {ResolvedAwakenerDatabaseReferenceLayer} from '@/domain/awakeners-database-view'

import {useDatabasePopoverControllerContext} from './database-popover-context'
import {
  DatabaseReferencePopover,
  type DatabaseReferencePopoverEntry,
} from './DatabaseReferencePopover'

vi.mock('./database-popover-context', () => ({
  useDatabasePopoverControllerContext: vi.fn(),
}))

type TestPopoverProps = Omit<ComponentProps<typeof DatabaseReferencePopover>, 'entry'> & {
  name: string
  label: string
  description: string
  keywordFooterText?: string
  detailLinks?: DatabaseReferencePopoverEntry['detailLinks']
  descriptionRecord?: DatabaseReferencePopoverEntry['record']
  descriptionRank?: number
  descriptionMaxRank?: number
  influenceBadges?: {
    kind: 'enlighten' | 'talent'
    id: string
    label: string
    referenceName: string
    slot?: 'E1' | 'E2' | 'E3' | 'AbsoluteAxiom'
  }[]
}

function TestDatabaseReferencePopover({
  name,
  label,
  description,
  keywordFooterText,
  detailLinks,
  descriptionRecord,
  descriptionRank,
  descriptionMaxRank,
  influenceBadges,
  ...props
}: TestPopoverProps) {
  const entry = {
    name,
    label,
    description,
    keywordFooterText,
    detailLinks,
    record: descriptionRecord,
    descriptionRank,
    descriptionMaxRank,
    influenceBadges,
  } as DatabaseReferencePopoverEntry

  return <DatabaseReferencePopover {...props} entry={entry} />
}

describe('DatabaseReferencePopover', () => {
  function buildReferenceLayer(
    overrides: Partial<ResolvedAwakenerDatabaseReferenceLayer> = {},
  ): ResolvedAwakenerDatabaseReferenceLayer {
    return {
      accessibleOverlays: [],
      cardNames: new Set<string>(),
      overlayByName: new Map(),
      referenceInfoById: new Map(),
      referenceInfoByName: new Map(),
      ...overrides,
    }
  }

  it('shows enlighten influence badges for affected cards', () => {
    vi.mocked(useDatabasePopoverControllerContext).mockReturnValue(null)

    render(
      <TestDatabaseReferencePopover
        description='Popover text'
        influenceBadges={[
          {
            kind: 'enlighten',
            id: 'enlighten.test.e1',
            label: 'E1',
            referenceName: 'First Bloom',
            slot: 'E1',
          },
          {
            kind: 'enlighten',
            id: 'enlighten.test.e3',
            label: 'E3',
            referenceName: 'Third Bloom',
            slot: 'E3',
          },
          {
            kind: 'talent',
            id: 'talent.test.base',
            label: 'T1',
            referenceName: 'Base Talent',
          },
        ]}
        label='Card · C4 · Cost 2'
        name='Symbiotic Aberration'
        onClose={vi.fn()}
        onMechanicTokenClick={vi.fn()}
        onSkillTokenClick={vi.fn()}
        referenceLayer={buildReferenceLayer()}
        selectedEnlightenSlot='E2'
        stats={null}
      />,
    )

    expect(screen.getByText('Symbiotic Aberration')).toBeInTheDocument()
    expect(screen.getByText('Card · C4 · Cost 2')).toBeInTheDocument()
    expect(screen.getByText('E1')).toBeInTheDocument()
    expect(screen.getByText('E3')).toBeInTheDocument()
    expect(screen.getByText('T1')).toBeInTheDocument()
    expect(screen.getByRole('button', {name: 'Close skill popover'})).toHaveClass('h-8', 'w-8')
  })

  it('uses the same faint golden border for top and nested popovers', () => {
    vi.mocked(useDatabasePopoverControllerContext).mockReturnValue(null)

    const {rerender, container} = render(
      <TestDatabaseReferencePopover
        description='Popover text'
        label='Card · C4 · Cost 2'
        layerCount={2}
        layerIndex={1}
        name='Symbiotic Aberration'
        onClose={vi.fn()}
        onMechanicTokenClick={vi.fn()}
        onSkillTokenClick={vi.fn()}
        referenceLayer={buildReferenceLayer()}
        stats={null}
      />,
    )

    expect(container.firstElementChild).toHaveClass('border-amber-200/35')
    expect(container.firstElementChild).not.toHaveClass('border-slate-600/50')

    rerender(
      <TestDatabaseReferencePopover
        description='Popover text'
        label='Card · C4 · Cost 2'
        layerCount={2}
        layerIndex={0}
        name='Symbiotic Aberration'
        onClose={vi.fn()}
        onMechanicTokenClick={vi.fn()}
        onSkillTokenClick={vi.fn()}
        referenceLayer={buildReferenceLayer()}
        stats={null}
      />,
    )

    expect(container.firstElementChild).toHaveClass('border-amber-200/35')
    expect(container.firstElementChild).not.toHaveClass('border-slate-600/50')
  })

  it('renders nested detail links and opens them through the shared info callback', () => {
    const onInfoEntryClick = vi.fn()
    vi.mocked(useDatabasePopoverControllerContext).mockReturnValue(null)

    render(
      <TestDatabaseReferencePopover
        description='Popover text'
        detailLinks={[
          {
            label: 'Show exact breakpoints',
            entry: {
              key: 'info.scaling.breakdown',
              name: 'Scaling Breakdown',
              label: 'Level & Psyche Surge Values',
              description: 'Detailed scaling text.',
            },
          },
        ]}
        label='Database Guide'
        name='Scaling Information'
        onClose={vi.fn()}
        onInfoEntryClick={onInfoEntryClick}
        onMechanicTokenClick={vi.fn()}
        onSkillTokenClick={vi.fn()}
        referenceLayer={buildReferenceLayer()}
        stats={null}
      />,
    )

    expect(screen.getByText('More Details')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', {name: /Show exact breakpoints/i}))
    expect(onInfoEntryClick).toHaveBeenCalledWith(
      expect.objectContaining({
        key: 'info.scaling.breakdown',
        label: 'Level & Psyche Surge Values',
      }),
    )
  })

  it('forwards nested badge opens through the shared reference callback', () => {
    const onSkillTokenClick = vi.fn()
    vi.mocked(useDatabasePopoverControllerContext).mockReturnValue(null)

    render(
      <TestDatabaseReferencePopover
        description='Popover text'
        influenceBadges={[
          {
            kind: 'enlighten',
            id: 'enlighten.test.e2',
            label: 'E2',
            referenceName: 'Second Bloom',
            slot: 'E2',
          },
          {
            kind: 'talent',
            id: 'talent.test.base',
            label: 'T1',
            referenceName: 'Base Talent',
          },
        ]}
        label='Card · C4 · Cost 2'
        name='Symbiotic Aberration'
        onClose={vi.fn()}
        onMechanicTokenClick={vi.fn()}
        onSkillTokenClick={onSkillTokenClick}
        referenceLayer={buildReferenceLayer()}
        selectedEnlightenSlot='E2'
        stats={null}
      />,
    )

    fireEvent.click(screen.getByRole('button', {name: 'E2'}))
    expect(onSkillTokenClick).toHaveBeenNthCalledWith(1, 'Second Bloom')

    fireEvent.click(screen.getByRole('button', {name: 'T1'}))
    expect(onSkillTokenClick).toHaveBeenNthCalledWith(2, 'Base Talent')
  })

  it('falls back to the overlay path for self-referential rouse aliases', async () => {
    vi.mocked(useDatabasePopoverControllerContext).mockReturnValue(null)
    const onMechanicTokenClick = vi.fn()
    const onSkillTokenClick = vi.fn()
    const referenceLayer = buildReferenceLayer({
      referenceInfoByName: new Map([
        [
          'rouse',
          {
            kind: 'skill',
            id: 'skill.test.rouse',
            name: 'Strike',
            label: 'Rouse · Cost 1',
            record: {
              id: 'skill.test.rouse',
              ownerAwakenerId: 1,
              kind: 'command',
              displayName: 'Strike',
              cost: '1',
              descriptionTemplate: 'Gain {Rouse}.',
              descriptionArgs: {},
              cardKeywords: [],
              variants: [],
            },
            description: 'Gain Rouse.',
            descriptionRank: 1,
            descriptionMaxRank: 6,
            influencingEnlightenSlots: [],
            influencingTalentIds: [],
          },
        ],
      ]) as ResolvedAwakenerDatabaseReferenceLayer['referenceInfoByName'],
      accessibleOverlays: [
        {
          id: 'overlay.global.rouse',
          displayName: 'Rouse',
          aliases: [],
          overlayType: 'mechanic',
          descriptionTemplate: 'Rouse overlay text.',
          descriptionArgs: {},
        } satisfies AwakenerOverlayRecord,
      ],
      cardNames: new Set<string>(['Rouse']),
    })

    render(
      <TestDatabaseReferencePopover
        description='Gain {Rouse}.'
        descriptionRecord={{
          id: 'skill.test.rouse',
          ownerAwakenerId: 1,
          kind: 'command',
          displayName: 'Strike',
          cost: '1',
          descriptionTemplate: 'Gain {Rouse}.',
          descriptionArgs: {},
          cardKeywords: [],
          variants: [],
        }}
        label='Card · Rouse · Cost 1'
        name='Strike'
        onClose={vi.fn()}
        onMechanicTokenClick={onMechanicTokenClick}
        onSkillTokenClick={onSkillTokenClick}
        referenceLayer={referenceLayer}
        stats={null}
      />,
    )

    fireEvent.click(await screen.findByRole('button', {name: 'Rouse'}))

    expect(onSkillTokenClick).not.toHaveBeenCalled()
    expect(onMechanicTokenClick).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'overlay.global.rouse',
      }),
    )
  })

  it('renders appended keyword footers as clickable mechanic tokens', async () => {
    vi.mocked(useDatabasePopoverControllerContext).mockReturnValue(null)
    const onMechanicTokenClick = vi.fn()
    const referenceLayer = buildReferenceLayer({
      accessibleOverlays: [
        {
          id: 'overlay.global.retain',
          displayName: 'Retain',
          aliases: [],
          overlayType: 'mechanic',
          descriptionTemplate: 'Retain text.',
          descriptionArgs: {},
        },
        {
          id: 'overlay.global.prepare',
          displayName: 'Prepare',
          aliases: ['Prepare 2'],
          overlayType: 'mechanic',
          descriptionTemplate: 'Prepare text.',
          descriptionArgs: {},
        },
      ],
    })

    render(
      <TestDatabaseReferencePopover
        description='Gain {Counter}.'
        keywordFooterText='{Retain}, {Prepare 2}'
        label='Card · C4 · Cost 2'
        name='Symbiotic Aberration'
        onClose={vi.fn()}
        onMechanicTokenClick={onMechanicTokenClick}
        onSkillTokenClick={vi.fn()}
        referenceLayer={referenceLayer}
        stats={null}
      />,
    )

    fireEvent.click(await screen.findByRole('button', {name: 'Retain'}))
    fireEvent.click(await screen.findByRole('button', {name: 'Prepare 2'}))

    expect(screen.getByRole('button', {name: 'Retain'})).toBeInTheDocument()
    expect(screen.getByRole('button', {name: 'Prepare 2'})).toBeInTheDocument()
    expect(onMechanicTokenClick).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({id: 'overlay.global.retain'}),
    )
    expect(onMechanicTokenClick).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({id: 'overlay.global.prepare'}),
    )
  })

  it('renders overlay-backed stat mechanics like Tentacle DMG as clickable tokens', async () => {
    vi.mocked(useDatabasePopoverControllerContext).mockReturnValue(null)
    const onMechanicTokenClick = vi.fn()
    const referenceLayer = buildReferenceLayer({
      accessibleOverlays: [
        {
          id: 'overlay.global.tentacle-dmg',
          displayName: 'Tentacle DMG',
          aliases: [],
          overlayType: 'mechanic',
          descriptionTemplate: 'Increases Tentacle DMG.',
          descriptionArgs: {},
        },
      ],
    })

    render(
      <TestDatabaseReferencePopover
        description='Gain {Tentacle DMG}.'
        label='Card · C2 · Cost 1'
        name='Mediating Personalities'
        onClose={vi.fn()}
        onMechanicTokenClick={onMechanicTokenClick}
        onSkillTokenClick={vi.fn()}
        referenceLayer={referenceLayer}
        stats={null}
      />,
    )

    fireEvent.click(await screen.findByRole('button', {name: 'Tentacle DMG'}))

    expect(onMechanicTokenClick).toHaveBeenCalledWith(
      expect.objectContaining({id: 'overlay.global.tentacle-dmg'}),
    )
  })

  it('renders grouped related derived cards inline and opens them through the shared trail path', () => {
    const onSkillTokenClick = vi.fn()
    vi.mocked(useDatabasePopoverControllerContext).mockReturnValue(null)
    const referenceLayer = buildReferenceLayer({
      referenceInfoById: new Map([
        [
          'derived.test.memory-1',
          {
            kind: 'derived-skill',
            id: 'derived.test.memory-1',
            name: 'Memory One',
            label: 'Card · Derived · Cost 0',
            record: {
              id: 'derived.test.memory-1',
              displayName: 'Memory One',
              descriptionTemplate: 'Memory one.',
              descriptionArgs: {},
              childDerivedSkillIds: [],
              cardKeywords: [],
              variants: [],
            },
            description: 'Choose Memory One for a sharpened {Barrier}.',
            descriptionRank: 1,
            descriptionMaxRank: 6,
            influencingEnlightenSlots: [],
            influencingTalentIds: [],
          },
        ],
        [
          'derived.test.memory-2',
          {
            kind: 'derived-skill',
            id: 'derived.test.memory-2',
            name: 'Memory Two',
            label: 'Card · Derived · Cost 0',
            record: {
              id: 'derived.test.memory-2',
              displayName: 'Memory Two',
              descriptionTemplate: 'Memory two.',
              descriptionArgs: {},
              childDerivedSkillIds: [],
              cardKeywords: [],
              variants: [],
            },
            description: 'Deal {Fixed DMG} while guarding with Memory Two.',
            descriptionRank: 1,
            descriptionMaxRank: 6,
            influencingEnlightenSlots: [],
            influencingTalentIds: [],
          },
        ],
      ]) as ResolvedAwakenerDatabaseReferenceLayer['referenceInfoById'],
    })

    render(
      <TestDatabaseReferencePopover
        description='Choose a memory.'
        descriptionRecord={{
          id: 'derived.test.memories',
          nodeKind: 'group',
          displayName: 'Memories',
          descriptionTemplate: 'Choose a memory.',
          descriptionArgs: {},
          childDerivedSkillIds: ['derived.test.memory-1', 'derived.test.memory-2'],
          cardKeywords: [],
          variants: [],
        }}
        label='Card · Derived Group'
        name='Memories'
        onClose={vi.fn()}
        onMechanicTokenClick={vi.fn()}
        onSkillTokenClick={onSkillTokenClick}
        referenceLayer={referenceLayer}
        stats={null}
      />,
    )

    expect(screen.getByText('Related Cards')).toBeInTheDocument()
    expect(screen.getByText('Choose Memory One for a sharpened Barrier.')).toBeInTheDocument()
    expect(screen.getByText('Deal Fixed DMG while guarding with Memory Two.')).toBeInTheDocument()
    expect(screen.queryByText('Card · Derived · Cost 0')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', {name: /Memory One/i}))
    fireEvent.click(screen.getByRole('button', {name: /Memory Two/i}))

    expect(onSkillTokenClick).toHaveBeenNthCalledWith(1, 'Memory One')
    expect(onSkillTokenClick).toHaveBeenNthCalledWith(2, 'Memory Two')
  })
})
