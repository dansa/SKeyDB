import {fireEvent, render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import type {AwakenerEnlightenRecord} from '@/domain/awakener-source-schema'
import type {
  DatabaseReferenceInfo,
  ResolvedDatabaseReferenceLayer,
} from '@/domain/database-reference-layer'

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
  const wheelReference: DatabaseReferenceInfo = {
    kind: 'wheel',
    id: 'B01',
    name: 'Merciful Nurturing',
    label: 'Wheel · SSR · Caro',
    record: {
      id: 'B01',
      kind: 'wheel',
      displayName: 'Merciful Nurturing',
      ownerAwakenerId: 1,
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

  return {
    cardNames: new Set<string>(),
    accessibleOverlays: [],
    referenceInfoByName: new Map([
      ['strike', strikeReference],
      ['guard', guardReference],
      ['merciful nurturing', wheelReference],
    ]),
    referenceInfoById: new Map([
      ['skill.test.strike', strikeReference],
      ['skill.test.guard', guardReference],
      ['B01', wheelReference],
    ]),
    overlayByName: new Map(),
  } as unknown as ResolvedDatabaseReferenceLayer
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
}: {
  referenceLayer: ResolvedDatabaseReferenceLayer | null
  selectedEnlightenSlot?: AwakenerEnlightenRecord['slot'] | null
  onNavigateToWheelPage?: (wheel: {name: string}) => void
  onOuterClick?: () => void
}) {
  const popoverController = useDatabasePopoverController({
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

    expect(onNavigateToWheelPage).toHaveBeenCalledWith({name: 'Merciful Nurturing'})
  })
})
