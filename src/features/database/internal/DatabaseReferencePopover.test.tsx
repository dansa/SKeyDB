import type {ComponentProps} from 'react'

import {fireEvent, render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import type {AwakenerOverlayRecord} from '@/domain/awakener-source-schema'
import type {ResolvedDatabaseReferenceLayer} from '@/domain/database-reference-layer'
import type {PublicDescriptionArg} from '@/domain/public-description-args'
import type {PublicFormulaContext} from '@/domain/public-formula-context'

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
  attributeRows?: DatabaseReferencePopoverEntry['attributeRows']
  thumbnail?: DatabaseReferencePopoverEntry['thumbnail']
  detailLinks?: DatabaseReferencePopoverEntry['detailLinks']
  descriptionSections?: DatabaseReferencePopoverEntry['descriptionSections']
  navigationLabel?: DatabaseReferencePopoverEntry['navigationLabel']
  descriptionRecord?: DatabaseReferencePopoverEntry['record']
  descriptionRank?: number
  descriptionMaxRank?: number
  formulaContext?: PublicFormulaContext
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
  attributeRows,
  thumbnail,
  detailLinks,
  descriptionSections,
  navigationLabel,
  descriptionRecord,
  descriptionRank,
  descriptionMaxRank,
  formulaContext,
  influenceBadges,
  ...props
}: TestPopoverProps) {
  const entry = {
    name,
    label,
    description,
    keywordFooterText,
    attributeRows,
    thumbnail,
    detailLinks,
    descriptionSections,
    navigationLabel,
    record: descriptionRecord,
    descriptionRank,
    descriptionMaxRank,
    influenceBadges,
  } as DatabaseReferencePopoverEntry

  return <DatabaseReferencePopover {...props} entry={entry} formulaContext={formulaContext} />
}

describe('DatabaseReferencePopover', () => {
  function buildReferenceLayer(
    overrides: Partial<ResolvedDatabaseReferenceLayer> = {},
  ): ResolvedDatabaseReferenceLayer {
    const accessibleOverlays = overrides.accessibleOverlays ?? []
    const overlayByName =
      overrides.overlayByName ??
      new Map(
        accessibleOverlays.flatMap((overlay) => [
          [overlay.displayName.toLowerCase(), overlay] as const,
          ...overlay.aliases.map((alias) => [alias.toLowerCase(), overlay] as const),
        ]),
      )

    return {
      cardNames: new Set<string>(),
      referenceInfoById: new Map(),
      referenceInfoByName: new Map(),
      ...overrides,
      accessibleOverlays,
      overlayByName,
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
    expect(screen.getByRole('button', {name: 'Close database popover'})).toHaveClass('size-8')
  })

  it('renders lore markup and optional thumbnails in the popover header', () => {
    vi.mocked(useDatabasePopoverControllerContext).mockReturnValue(null)

    render(
      <TestDatabaseReferencePopover
        description='Monster text'
        label='D-Zone Monster'
        name='@2 Blesser'
        onClose={vi.fn()}
        onMechanicTokenClick={vi.fn()}
        onSkillTokenClick={vi.fn()}
        referenceLayer={buildReferenceLayer()}
        stats={null}
        thumbnail={{src: '/monster-preview/blesser.webp', alt: 'Blesser'}}
      />,
    )

    expect(screen.getByText('Blesser')).toBeInTheDocument()
    expect(screen.getByLabelText('Redacted lore text')).toBeInTheDocument()
    expect(screen.getByAltText('Blesser')).toHaveAttribute('src', '/monster-preview/blesser.webp')
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

  it('renders wheel attribute rows and an explicit database navigation link', () => {
    const onClose = vi.fn()
    const onNavigate = vi.fn()
    vi.mocked(useDatabasePopoverControllerContext).mockReturnValue(null)

    render(
      <TestDatabaseReferencePopover
        attributeRows={[
          {
            label: 'Crit DMG',
            value: '18%',
          },
        ]}
        description='Wheel text'
        label='Wheel · SSR · Caro'
        name='Amber-Tinted Death'
        navigationLabel='Open in Wheels DB'
        onClose={onClose}
        onMechanicTokenClick={vi.fn()}
        onNavigate={onNavigate}
        onSkillTokenClick={vi.fn()}
        referenceLayer={buildReferenceLayer()}
        stats={null}
      />,
    )

    expect(screen.getByText('Crit DMG')).toBeInTheDocument()
    expect(screen.getByText('18%')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', {name: /Open in Wheels DB/i}))

    expect(onNavigate).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('resolves computed description args in popover content with the provided formula context', async () => {
    vi.mocked(useDatabasePopoverControllerContext).mockReturnValue(null)

    render(
      <TestDatabaseReferencePopover
        description='Computed text.'
        descriptionRecord={{
          id: 'overlay.test.computed',
          displayName: 'Forbidden Lore',
          overlayType: 'mechanic',
          aliases: [],
          descriptionTemplate: 'Gain [Arg1] Forbidden Lore.',
          descriptionArgs: {
            Arg1: {
              kind: 'computed',
              formulaKey: 'wheelRefinementLinear',
              baseValue: 0,
              perLevel: 3,
              inputs: ['wheelRefinementLevel'],
            } satisfies PublicDescriptionArg,
          } as unknown as AwakenerOverlayRecord['descriptionArgs'],
        }}
        formulaContext={{wheelRefinementLevel: 4}}
        label='Mechanic'
        name='Forbidden Lore'
        onClose={vi.fn()}
        onMechanicTokenClick={vi.fn()}
        onSkillTokenClick={vi.fn()}
        referenceLayer={buildReferenceLayer()}
        stats={null}
      />,
    )

    expect(await screen.findByText('12')).toHaveAttribute(
      'title',
      [
        'Wheel Enlighten Bonus',
        'Current Enlighten tier: 4',
        'Base value: 0',
        'Per tier: +3',
        '',
        '0 + (4 × 3) = 12',
      ].join('\n'),
    )
    expect(screen.queryByText('—')).not.toBeInTheDocument()
  })

  it('resolves computed description args in popover description sections', async () => {
    vi.mocked(useDatabasePopoverControllerContext).mockReturnValue(null)

    render(
      <TestDatabaseReferencePopover
        description='Summary text.'
        descriptionSections={[
          {
            label: 'Triggered Effect',
            description: 'Fallback section text.',
            record: {
              id: 'overlay.test.section-computed',
              displayName: 'Section Effect',
              overlayType: 'mechanic',
              aliases: [],
              descriptionTemplate: 'Gain [Arg1] charge.',
              descriptionArgs: {
                Arg1: {
                  kind: 'computed',
                  formulaKey: 'wheelRefinementLinear',
                  baseValue: 0,
                  perLevel: 3,
                  inputs: ['wheelRefinementLevel'],
                } satisfies PublicDescriptionArg,
              } as unknown as AwakenerOverlayRecord['descriptionArgs'],
            },
          },
        ]}
        formulaContext={{wheelRefinementLevel: 4}}
        label='Mechanic'
        name='Sectioned Lore'
        onClose={vi.fn()}
        onMechanicTokenClick={vi.fn()}
        onSkillTokenClick={vi.fn()}
        referenceLayer={buildReferenceLayer()}
        stats={null}
      />,
    )

    expect(await screen.findByText('Triggered Effect')).toBeInTheDocument()
    expect(await screen.findByTitle(/Wheel Enlighten Bonus/)).toHaveTextContent('12')
    expect(screen.queryByText('—')).not.toBeInTheDocument()
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
      ]),
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
      expect.any(Object),
    )
  })

  it('resolves typed overlay tokens through overlays when a card has the same name', async () => {
    vi.mocked(useDatabasePopoverControllerContext).mockReturnValue(null)
    const onMechanicTokenClick = vi.fn()
    const onSkillTokenClick = vi.fn()
    const duplicateNameOverlay = {
      id: 'overlay.doll-inferno.illusions-end',
      displayName: "Illusion's End",
      aliases: [],
      overlayType: 'mechanic',
      descriptionTemplate: 'Overlay state text.',
      descriptionArgs: {},
    } satisfies AwakenerOverlayRecord
    const referenceLayer = buildReferenceLayer({
      accessibleOverlays: [duplicateNameOverlay],
      cardNames: new Set<string>(["Illusion's End"]),
    })

    render(
      <TestDatabaseReferencePopover
        description="{overlay:Illusion's End}"
        descriptionRecord={{
          id: 'skill.test.terminal',
          ownerAwakenerId: 1,
          kind: 'exalt',
          displayName: 'Terminal',
          cost: '4',
          descriptionTemplate: "{overlay:Illusion's End}",
          descriptionArgs: {},
          cardKeywords: [],
          variants: [],
        }}
        label='Card · Exalt · Cost 4'
        name='Terminal'
        onClose={vi.fn()}
        onMechanicTokenClick={onMechanicTokenClick}
        onSkillTokenClick={onSkillTokenClick}
        referenceLayer={referenceLayer}
        stats={null}
      />,
    )

    fireEvent.click(await screen.findByRole('button', {name: "Illusion's End"}))

    expect(onSkillTokenClick).not.toHaveBeenCalled()
    expect(onMechanicTokenClick).toHaveBeenCalledWith(duplicateNameOverlay, expect.any(Object))
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
      expect.any(Object),
    )
    expect(onMechanicTokenClick).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({id: 'overlay.global.prepare'}),
      expect.any(Object),
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
      expect.any(Object),
    )
  })

  it('renders grouped related derived cards inline and opens them through the shared trail path', () => {
    const onInfoEntryClick = vi.fn()
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
              aliases: [],
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
              aliases: [],
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
      ]),
    })

    render(
      <TestDatabaseReferencePopover
        description='Choose a memory.'
        descriptionRecord={{
          id: 'derived.test.memories',
          nodeKind: 'group',
          displayName: 'Memories',
          aliases: [],
          descriptionTemplate: 'Choose a memory.',
          descriptionArgs: {},
          childDerivedSkillIds: ['derived.test.memory-1', 'derived.test.memory-2'],
          cardKeywords: [],
          variants: [],
        }}
        label='Card · Derived Group'
        name='Memories'
        onClose={vi.fn()}
        onInfoEntryClick={onInfoEntryClick}
        onMechanicTokenClick={vi.fn()}
        onSkillTokenClick={onSkillTokenClick}
        referenceLayer={referenceLayer}
        stats={null}
      />,
    )

    expect(screen.getByText('Related Skills')).toBeInTheDocument()
    expect(screen.getByText('Choose Memory One for a sharpened Barrier.')).toBeInTheDocument()
    expect(screen.getByText('Deal Fixed DMG while guarding with Memory Two.')).toBeInTheDocument()
    expect(screen.queryByText('Card · Derived · Cost 0')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', {name: /Memory One/i}))
    fireEvent.click(screen.getByRole('button', {name: /Memory Two/i}))

    expect(onSkillTokenClick).not.toHaveBeenCalled()
    expect(onInfoEntryClick).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        key: 'derived-skill:derived.test.memory-1',
        name: 'Memory One',
        record: expect.objectContaining({id: 'derived.test.memory-1'}),
      }),
    )
    expect(onInfoEntryClick).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        key: 'derived-skill:derived.test.memory-2',
        name: 'Memory Two',
        record: expect.objectContaining({id: 'derived.test.memory-2'}),
      }),
    )
  })

  it('opens duplicate-named related derived skills by id instead of display name', async () => {
    vi.mocked(useDatabasePopoverControllerContext).mockReturnValue(null)
    const onInfoEntryClick = vi.fn()
    const onSkillTokenClick = vi.fn()
    const referenceLayer = buildReferenceLayer({
      referenceInfoById: new Map([
        [
          'derived.test.choice-a',
          {
            kind: 'derived-skill',
            id: 'derived.test.choice-a',
            name: 'Thousand Mirage',
            label: 'Card · Derived',
            record: {
              id: 'derived.test.choice-a',
              displayName: 'Thousand Mirage',
              aliases: [],
              descriptionTemplate: 'Choice A.',
              descriptionArgs: {},
              childDerivedSkillIds: [],
              cardKeywords: [],
              variants: [],
            },
            description: 'Choice A.',
            descriptionRank: 1,
            descriptionMaxRank: 1,
            influencingEnlightenSlots: [],
            influencingTalentIds: [],
          },
        ],
        [
          'derived.test.choice-b',
          {
            kind: 'derived-skill',
            id: 'derived.test.choice-b',
            name: 'Thousand Mirage',
            label: 'Card · Derived',
            record: {
              id: 'derived.test.choice-b',
              displayName: 'Thousand Mirage',
              aliases: [],
              descriptionTemplate: 'Choice B.',
              descriptionArgs: {},
              childDerivedSkillIds: [],
              cardKeywords: [],
              variants: [],
            },
            description: 'Choice B.',
            descriptionRank: 1,
            descriptionMaxRank: 1,
            influencingEnlightenSlots: [],
            influencingTalentIds: [],
          },
        ],
      ]),
      referenceInfoByName: new Map([
        [
          'thousand mirage',
          {
            kind: 'derived-skill',
            id: 'derived.test.parent',
            name: 'Thousand Mirage',
            label: 'Card · Derived Group',
            record: {
              id: 'derived.test.parent',
              nodeKind: 'group',
              displayName: 'Thousand Mirage',
              aliases: [],
              descriptionTemplate: 'Parent.',
              descriptionArgs: {},
              childDerivedSkillIds: ['derived.test.choice-a', 'derived.test.choice-b'],
              cardKeywords: [],
              variants: [],
            },
            description: 'Parent.',
            descriptionRank: 1,
            descriptionMaxRank: 1,
            influencingEnlightenSlots: [],
            influencingTalentIds: [],
          },
        ],
      ]),
    })

    render(
      <TestDatabaseReferencePopover
        description='Parent.'
        descriptionRecord={{
          id: 'derived.test.parent',
          nodeKind: 'group',
          displayName: 'Thousand Mirage',
          aliases: [],
          descriptionTemplate: 'Parent.',
          descriptionArgs: {},
          childDerivedSkillIds: ['derived.test.choice-a', 'derived.test.choice-b'],
          cardKeywords: [],
          variants: [],
        }}
        label='Card · Derived Group'
        name='Thousand Mirage'
        onClose={vi.fn()}
        onInfoEntryClick={onInfoEntryClick}
        onMechanicTokenClick={vi.fn()}
        onSkillTokenClick={onSkillTokenClick}
        referenceLayer={referenceLayer}
        stats={null}
      />,
    )

    fireEvent.click(screen.getByRole('button', {name: /Choice B/i}))

    expect(onSkillTokenClick).not.toHaveBeenCalled()
    expect(onInfoEntryClick).toHaveBeenCalledWith(
      expect.objectContaining({
        key: 'derived-skill:derived.test.choice-b',
        name: 'Thousand Mirage',
        record: expect.objectContaining({id: 'derived.test.choice-b'}),
      }),
    )
  })
})
