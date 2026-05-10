import {fireEvent, render, screen, waitFor} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import type {
  AwakenerEnlightenRecord,
  AwakenerOverlayRecord,
  AwakenerSkillRecord,
} from '@/domain/awakener-source-schema'
import type {
  DatabaseReferenceInfo,
  ResolvedDatabaseReferenceLayer,
} from '@/domain/database-reference-layer'
import * as globalDatabaseReferenceLayer from '@/domain/global-database-reference-layer'
import type {PublicDescriptionArg} from '@/domain/public-description-args'
import type {PublicFormulaContext} from '@/domain/public-formula-context'

import type {KeyedDatabaseReferenceEntry} from './database-reference-entry'
import {DatabasePopoverRoot} from './DatabasePopoverRoot'
import {useDatabasePopoverController} from './useDatabasePopoverController'

function buildSkillReferenceInfo(
  id: string,
  name: string,
  label: string,
  description: string,
  recordKind: 'strike' | 'defense',
  selectedEnlightenSlot: AwakenerEnlightenRecord['slot'] | null = null,
): DatabaseReferenceInfo {
  return {
    kind: 'skill',
    id,
    name,
    label,
    record: {
      id,
      ownerAwakenerId: 999,
      kind: recordKind,
      displayName: name,
      descriptionTemplate: description,
      descriptionArgs: {},
      cardKeywords: [],
      variants: [],
    },
    description,
    keywordFooterText: undefined,
    descriptionRank: 1,
    descriptionMaxRank: 6,
    influencingEnlightenSlots: [],
    influencingTalentIds: [],
    influenceBadges: selectedEnlightenSlot
      ? [
          {
            kind: 'enlighten',
            id: `enlighten.test.${selectedEnlightenSlot.toLowerCase()}`,
            label: selectedEnlightenSlot,
            referenceName: `Enlighten ${selectedEnlightenSlot}`,
            slot: selectedEnlightenSlot,
          },
        ]
      : [],
  }
}

function buildReferenceLayer(
  description: string,
  selectedEnlightenSlot: AwakenerEnlightenRecord['slot'] | null = null,
): ResolvedDatabaseReferenceLayer {
  const strikeReference = buildSkillReferenceInfo(
    'skill.test.strike',
    'Strike',
    'Card · C2 · Cost 1',
    description,
    'strike',
    selectedEnlightenSlot,
  )
  const guardReference = buildSkillReferenceInfo(
    'skill.test.guard',
    'Guard',
    'Card · C3 · Cost 1',
    'Guard text.',
    'defense',
  )
  const computedReference: DatabaseReferenceInfo = {
    kind: 'skill',
    id: 'skill.test.computed',
    name: 'Computed',
    label: 'Card · C4 · Cost 1',
    record: {
      id: 'skill.test.computed',
      ownerAwakenerId: 999,
      kind: 'strike',
      displayName: 'Computed',
      descriptionTemplate: 'Gain [Arg1] charge.',
      descriptionArgs: {
        Arg1: {
          kind: 'computed',
          formulaKey: 'wheelRefinementLinear',
          baseValue: 0,
          perLevel: 3,
          inputs: ['wheelRefinementLevel'],
        } satisfies PublicDescriptionArg,
      } as unknown as AwakenerSkillRecord['descriptionArgs'],
      cardKeywords: [],
      variants: [],
    },
    description: 'Gain — charge.',
    keywordFooterText: undefined,
    descriptionRank: 1,
    descriptionMaxRank: 6,
    influencingEnlightenSlots: [],
    influencingTalentIds: [],
    influenceBadges: [],
  }
  const wheelReference: DatabaseReferenceInfo = {
    kind: 'wheel',
    id: 'B01',
    name: 'Merciful Nurturing',
    label: 'Wheel · SSR · Caro',
    record: {
      id: 'B01',
      kind: 'wheel',
      displayName: 'Merciful Nurturing',
      ownerAwakenerId: 'awakener-0001',
      descriptionTemplate: 'Wheel text.',
      descriptionArgs: {},
    },
    description: 'Wheel text.',
    keywordFooterText: undefined,
    descriptionRank: 1,
    descriptionMaxRank: 4,
    influencingEnlightenSlots: [],
    influencingTalentIds: [],
    influenceBadges: [],
  }
  const overlayReference: DatabaseReferenceInfo = {
    kind: 'overlay',
    id: 'overlay.global.counter',
    name: 'Counter',
    label: 'Mechanic',
    record: {
      id: 'overlay.global.counter',
      displayName: 'Counter',
      overlayType: 'mechanic',
      aliases: [],
      iconId: 'IconS_Buff_019',
      descriptionTemplate: '',
      descriptionArgs: {},
    },
    description: '',
    keywordFooterText: undefined,
    descriptionRank: undefined,
    descriptionMaxRank: undefined,
    influencingEnlightenSlots: [],
    influencingTalentIds: [],
    influenceBadges: [],
  }

  return {
    cardNames: new Set<string>(),
    accessibleOverlays: [overlayReference.record as AwakenerOverlayRecord],
    referenceInfoByName: new Map([
      ['strike', strikeReference],
      ['guard', guardReference],
      ['computed', computedReference],
      ['merciful nurturing', wheelReference],
      ['counter', overlayReference],
    ]),
    referenceInfoById: new Map([
      ['skill.test.strike', strikeReference],
      ['skill.test.guard', guardReference],
      ['skill.test.computed', computedReference],
      ['B01', wheelReference],
      ['overlay.global.counter', overlayReference],
    ]),
    overlayByName: new Map([['counter', overlayReference.record as AwakenerOverlayRecord]]),
  }
}

const TEST_SCALING_INFO_ENTRY: KeyedDatabaseReferenceEntry = {
  key: 'info.scaling',
  name: 'Scaling Information',
  label: 'Database Guide',
  description: 'Scaling info text.',
  detailLinks: [
    {
      label: 'Show exact breakpoints',
      entry: {
        key: 'info.scaling.breakdown',
        name: 'Scaling Breakdown',
        label: 'Level & Psyche Surge Values',
        description: 'Detailed scaling text.',
      },
    },
  ],
}

const TEST_WHEEL_PREVIEW_ENTRY: KeyedDatabaseReferenceEntry = {
  key: 'wheel.preview.B01',
  name: 'Merciful Nurturing',
  label: 'Wheel · SSR · Caro',
  description: 'Wheel text.',
  navigationLabel: 'Open in Wheels DB',
  navigationTarget: {
    kind: 'wheel-page',
    wheelName: 'Merciful Nurturing',
  },
}

function ControllerHarness({
  referenceLayer,
  selectedEnlightenSlot = null,
  onNavigateToWheelPage,
  onOuterClick,
  formulaContext,
}: {
  referenceLayer: ResolvedDatabaseReferenceLayer | null
  selectedEnlightenSlot?: AwakenerEnlightenRecord['slot'] | null
  onNavigateToWheelPage?: (wheel: {id: string; name: string}) => void
  onOuterClick?: () => void
  formulaContext?: PublicFormulaContext
}) {
  const popoverController = useDatabasePopoverController({
    formulaContext,
    onNavigateToWheelPage,
    referenceLayer,
    selectedEnlightenSlot,
  })

  return (
    <>
      <div onClick={onOuterClick}>
        <button
          onClick={(event) => {
            popoverController.contextValue.openRootReferenceByName('Strike', event)
          }}
          type='button'
        >
          Open Strike
        </button>
        <button
          onClick={(event) => {
            popoverController.contextValue.openRootReferenceByName('Guard', event)
          }}
          type='button'
        >
          Open Guard
        </button>
        <button
          onClick={(event) => {
            popoverController.contextValue.openRootReferenceByName('Merciful Nurturing', event)
          }}
          type='button'
        >
          Open Wheel
        </button>
        <button
          onClick={(event) => {
            popoverController.contextValue.openRootReferenceByName('Computed', event)
          }}
          type='button'
        >
          Open Computed
        </button>
        <button
          onClick={(event) => {
            const overlay = referenceLayer?.overlayByName.get('counter')
            if (!overlay) {
              throw new Error('Expected Counter overlay')
            }
            popoverController.contextValue.openRootOverlay(overlay, event)
          }}
          type='button'
        >
          Open Counter
        </button>
        <button
          onClick={(event) => {
            const openRootInfo = popoverController.contextValue.openRootInfo
            if (!openRootInfo) {
              throw new Error('Expected openRootInfo to be available')
            }
            openRootInfo(TEST_SCALING_INFO_ENTRY, event)
          }}
          type='button'
        >
          Open Scaling Info
        </button>
        <button
          onClick={(event) => {
            const openRootInfo = popoverController.contextValue.openRootInfo
            if (!openRootInfo) {
              throw new Error('Expected openRootInfo to be available')
            }
            openRootInfo(TEST_WHEEL_PREVIEW_ENTRY, event)
          }}
          type='button'
        >
          Open Wheel Preview
        </button>
      </div>
      <DatabasePopoverRoot {...popoverController.popoverRootProps} />
    </>
  )
}

describe('useDatabasePopoverController', () => {
  it('live updates open popovers when the database view changes', async () => {
    const {rerender} = render(
      <ControllerHarness referenceLayer={buildReferenceLayer('Base text.')} />,
    )

    fireEvent.click(screen.getByRole('button', {name: 'Open Strike'}))
    expect(await screen.findByText('Base text.')).toBeInTheDocument()

    rerender(
      <ControllerHarness
        referenceLayer={buildReferenceLayer('E1 text.', 'E1')}
        selectedEnlightenSlot='E1'
      />,
    )

    expect(screen.queryByText('Base text.')).not.toBeInTheDocument()
    expect(await screen.findByText('E1 text.')).toBeInTheDocument()
    expect(await screen.findByText('E1')).toBeInTheDocument()
  })

  it('replaces the open root stack when clicking a different root trigger and stops bubbling', async () => {
    const onOuterClick = vi.fn()

    render(
      <ControllerHarness
        onOuterClick={onOuterClick}
        referenceLayer={buildReferenceLayer('Base text.')}
      />,
    )

    fireEvent.click(screen.getByRole('button', {name: 'Open Strike'}))
    expect(await screen.findByText('Base text.')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', {name: 'Open Guard'}))

    expect(screen.queryByText('Base text.')).not.toBeInTheDocument()
    expect(await screen.findByText('Guard text.')).toBeInTheDocument()
    expect(onOuterClick).not.toHaveBeenCalled()
  })

  it('opens generic info entries through the shared root popover path', async () => {
    render(<ControllerHarness referenceLayer={buildReferenceLayer('Base text.')} />)

    fireEvent.click(screen.getByRole('button', {name: 'Open Scaling Info'}))

    expect(await screen.findByText('Scaling info text.')).toBeInTheDocument()
    expect(screen.getByText('Scaling Information')).toBeInTheDocument()
    expect(screen.getByText('Database Guide')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', {name: /Show exact breakpoints/i}))
    expect(await screen.findByText('Detailed scaling text.')).toBeInTheDocument()
    expect(screen.getByText('Scaling Breakdown')).toBeInTheDocument()
  })

  it('opens wheel references through the shared root popover path', async () => {
    render(<ControllerHarness referenceLayer={buildReferenceLayer('Base text.')} />)

    fireEvent.click(screen.getByRole('button', {name: 'Open Wheel'}))

    expect(await screen.findByText('Wheel text.')).toBeInTheDocument()
    expect(screen.getByText('Merciful Nurturing')).toBeInTheDocument()
    expect(screen.getByText('Wheel · SSR · Caro')).toBeInTheDocument()
  })

  it('ignores stale root hydration after another root opens', async () => {
    let resolveHydration: ((reference: DatabaseReferenceInfo) => void) | undefined
    vi.spyOn(
      globalDatabaseReferenceLayer,
      'hydrateGlobalDatabaseReferenceInfo',
    ).mockImplementationOnce(
      (reference) =>
        new Promise<DatabaseReferenceInfo>((resolve) => {
          resolveHydration = () => {
            resolve({...reference, description: 'Hydrated wheel text.'})
          }
        }),
    )
    const referenceLayer = buildReferenceLayer('Base text.')
    const wheelReference = referenceLayer.referenceInfoByName.get('merciful nurturing')
    if (!wheelReference) {
      throw new Error('Expected test wheel reference')
    }
    wheelReference.description = ''

    render(<ControllerHarness referenceLayer={referenceLayer} />)

    fireEvent.click(screen.getByRole('button', {name: 'Open Wheel'}))
    fireEvent.click(screen.getByRole('button', {name: 'Open Guard'}))
    expect(await screen.findByText('Guard text.')).toBeInTheDocument()

    resolveHydration?.(wheelReference)

    await waitFor(() => {
      expect(screen.queryByText('Hydrated wheel text.')).not.toBeInTheDocument()
      expect(screen.getByText('Guard text.')).toBeInTheDocument()
    })
  })

  it('hydrates catalog-backed root overlay popovers before opening them', async () => {
    const hydrateGlobalDatabaseReferenceInfo = vi.spyOn(
      globalDatabaseReferenceLayer,
      'hydrateGlobalDatabaseReferenceInfo',
    )
    const referenceLayer = buildReferenceLayer('Base text.')

    render(<ControllerHarness referenceLayer={referenceLayer} />)

    fireEvent.click(screen.getByRole('button', {name: 'Open Counter'}))

    await waitFor(() => {
      expect(hydrateGlobalDatabaseReferenceInfo).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'overlay.global.counter',
          kind: 'overlay',
        }),
        undefined,
        null,
      )
    })
    expect(await screen.findByText(/When attacked/)).toBeInTheDocument()
    expect(screen.queryByText('Details coming soon')).not.toBeInTheDocument()
  })

  it('threads formula context from controller options into popover content', async () => {
    render(
      <ControllerHarness
        formulaContext={{wheelRefinementLevel: 4}}
        referenceLayer={buildReferenceLayer('Base text.')}
      />,
    )

    fireEvent.click(screen.getByRole('button', {name: 'Open Computed'}))

    expect(await screen.findByTitle(/Wheel Enlighten Bonus/)).toHaveTextContent('12')
    expect(screen.queryByText('—')).not.toBeInTheDocument()
  })

  it('routes explicit wheel preview entries to the wheel database page', async () => {
    const onNavigateToWheelPage = vi.fn()

    render(
      <ControllerHarness
        onNavigateToWheelPage={onNavigateToWheelPage}
        referenceLayer={buildReferenceLayer('Base text.')}
      />,
    )

    fireEvent.click(screen.getByRole('button', {name: 'Open Wheel Preview'}))
    fireEvent.click(await screen.findByRole('button', {name: /Open in Wheels DB/i}))

    expect(onNavigateToWheelPage).toHaveBeenCalledWith({
      id: 'wheel.preview.B01',
      name: 'Merciful Nurturing',
    })
  })
})
