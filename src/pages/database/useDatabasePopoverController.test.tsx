import {fireEvent, render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import type {AwakenerEnlightenRecord} from '@/domain/awakener-source-schema'
import type {
  DatabaseReferenceInfo,
  ResolvedAwakenerDatabaseReferenceLayer,
} from '@/domain/awakeners-database-view'

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
): ResolvedAwakenerDatabaseReferenceLayer {
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

  return {
    cardNames: new Set<string>(),
    accessibleOverlays: [],
    referenceInfoByName: new Map([
      ['strike', strikeReference],
      ['guard', guardReference],
    ]),
    referenceInfoById: new Map([
      ['skill.test.strike', strikeReference],
      ['skill.test.guard', guardReference],
    ]),
    overlayByName: new Map(),
  } as unknown as ResolvedAwakenerDatabaseReferenceLayer
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

function ControllerHarness({
  referenceLayer,
  selectedEnlightenSlot = null,
  onOuterClick,
}: {
  referenceLayer: ResolvedAwakenerDatabaseReferenceLayer | null
  selectedEnlightenSlot?: AwakenerEnlightenRecord['slot'] | null
  onOuterClick?: () => void
}) {
  const popoverController = useDatabasePopoverController({referenceLayer, selectedEnlightenSlot})

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
})
