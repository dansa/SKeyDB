import {fireEvent, render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import {AwakenerDetailOverview} from './AwakenerDetailOverview'
import {DatabasePopoverContext} from './database-popover-context'
import {
  makeDatabaseDescribedEntry,
  makeDatabaseShellView,
  makeEnlightenRecord,
  makeSkillRecord,
  makeTalentRecord,
  makeTestAwakener,
  makeTestFullStats,
} from './database-test-fixtures'

vi.mock('../../domain/relics', () => ({
  getPortraitRelicByAwakenerIngameId: () => null,
}))

vi.mock('../../domain/relic-assets', () => ({
  getRelicPortraitAssetByAssetId: () => null,
}))

vi.mock('./RichDescription', () => ({
  RichDescription: ({text, record}: {text?: string; record?: {descriptionTemplate?: string}}) => (
    <span>{record?.descriptionTemplate ?? text}</span>
  ),
}))

const TEST_AWAKENER = makeTestAwakener({id: 1, name: 'salvador', realm: 'CHAOS'})
const TEST_STATS = makeTestFullStats()

const TEST_SHELL_VIEW = makeDatabaseShellView({
  stats: TEST_STATS,
  overExalt: makeDatabaseDescribedEntry({
    key: 'OverExalt',
    label: 'Card · Over Exalt · Cost 200',
    record: makeSkillRecord({
      id: 'skill.over-exalt',
      kind: 'over_exalt',
      displayName: 'Face Death in Fiery Resolve',
      descriptionTemplate: 'Over Exalt description',
    }),
    resolved: {description: 'Over Exalt description'} as never,
    descriptionRank: 1,
    descriptionMaxRank: 6,
  }),
  talents: [
    makeDatabaseDescribedEntry({
      key: 'T1',
      label: 'Talent · T1',
      record: makeTalentRecord({id: 'talent.first', displayName: 'First Talent'}),
      resolved: {description: 'First description'} as never,
    }),
    makeDatabaseDescribedEntry({
      key: 'T2',
      label: 'Talent · T2',
      record: makeTalentRecord({id: 'talent.second', displayName: 'Second Talent'}),
      resolved: {description: 'Second description'} as never,
    }),
    makeDatabaseDescribedEntry({
      key: 'T3',
      label: 'Talent · T3',
      record: makeTalentRecord({id: 'talent.third', displayName: 'Third Talent'}),
      resolved: {description: 'Third description'} as never,
    }),
    makeDatabaseDescribedEntry({
      key: 'T4',
      label: 'Talent · T4',
      record: makeTalentRecord({id: 'talent.fourth', displayName: 'Fourth Talent'}),
      resolved: {description: 'Fourth description'} as never,
    }),
  ],
  enlightens: [
    makeDatabaseDescribedEntry({
      key: 'E1',
      label: 'Enlighten · E1',
      record: makeEnlightenRecord({id: 'enlighten.e1', displayName: 'E1', slot: 'E1'}),
      resolved: {description: 'E1 desc'} as never,
      descriptionRank: undefined,
      descriptionMaxRank: undefined,
    }),
    makeDatabaseDescribedEntry({
      key: 'E2',
      label: 'Enlighten · E2',
      record: makeEnlightenRecord({id: 'enlighten.e2', displayName: 'E2', slot: 'E2'}),
      resolved: {description: 'E2 desc'} as never,
      descriptionRank: undefined,
      descriptionMaxRank: undefined,
    }),
    makeDatabaseDescribedEntry({
      key: 'E3',
      label: 'Enlighten · E3',
      record: makeEnlightenRecord({id: 'enlighten.e3', displayName: 'E3', slot: 'E3'}),
      resolved: {description: 'E3 desc'} as never,
      descriptionRank: undefined,
      descriptionMaxRank: undefined,
    }),
    makeDatabaseDescribedEntry({
      key: 'AbsoluteAxiom',
      label: 'Absolute Axiom',
      record: makeEnlightenRecord({
        id: 'enlighten.aa',
        displayName: 'Infinite Singularity',
        slot: 'AbsoluteAxiom',
      }),
      resolved: {description: 'AA desc'} as never,
      descriptionRank: undefined,
      descriptionMaxRank: undefined,
    }),
  ],
})

describe('AwakenerDetailOverview', () => {
  it('renders fourth talent entries and over exalt progression rows when they exist in the full data', () => {
    const openRootReferenceByName = vi.fn()

    render(
      <DatabasePopoverContext.Provider
        value={{
          openRootReferenceByName,
          openRootOverlay: vi.fn(),
          openNestedReferenceByName: vi.fn(),
          openNestedOverlay: vi.fn(),
          hasOpenPopovers: false,
          closeAllPopovers: vi.fn(),
        }}
      >
        <AwakenerDetailOverview
          awakener={TEST_AWAKENER}
          fontScale={'medium'}
          referenceLayer={null}
          shellView={TEST_SHELL_VIEW}
        />
      </DatabasePopoverContext.Provider>,
    )

    expect(screen.getByText('First Talent')).toBeInTheDocument()
    expect(screen.getByText('Second Talent')).toBeInTheDocument()
    expect(screen.getByText('Third Talent')).toBeInTheDocument()
    expect(screen.getByText('Fourth Talent')).toBeInTheDocument()
    expect(screen.getByText('T4')).toBeInTheDocument()
    expect(screen.getByRole('button', {name: 'Over-Exaltation'})).toBeInTheDocument()
    expect(screen.getByText('Face Death in Fiery Resolve').closest('p')).toHaveTextContent(
      /Face Death in Fiery Resolve.*Over-Exaltation/,
    )
    expect(screen.getByRole('button', {name: 'Absolute Axiom'})).toBeInTheDocument()
    expect(screen.getByText('Infinite Singularity').closest('p')).toHaveTextContent(
      /Infinite Singularity.*Absolute Axiom/,
    )

    fireEvent.click(screen.getByRole('button', {name: 'Over-Exaltation'}))
    expect(openRootReferenceByName).toHaveBeenCalledWith('Over Exalt', expect.anything())
  })
})
