import {fireEvent, render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import {AwakenerDetailUpgrades} from './AwakenerDetailUpgrades'
import {
  makeDatabaseDescribedEntry,
  makeDatabaseShellView,
  makeEnlightenRecord,
  makeSkillRecord,
  makeTalentRecord,
  makeTestAwakener,
  makeTestFullStats,
} from './database-test-fixtures'
import {PopoverStoreContext} from './usePopoverStore'

vi.mock('@/domain/relics', () => ({
  getPortraitRelicByAwakenerId: () => null,
  loadRelicDescriptionById: vi.fn(),
}))

const TEST_AWAKENER = makeTestAwakener({id: 1, name: 'test'})

const TEST_SHELL_VIEW = makeDatabaseShellView({
  selection: {
    selectedEnlightenSlot: null,
    soulforgeLevel: 0,
    gnosticPotentialLevel: 1,
  },
  stats: makeTestFullStats(),
  talents: [
    makeDatabaseDescribedEntry({
      key: 'T1',
      label: 'First Talent',
      record: makeTalentRecord({
        id: 'talent.test.first',
        displayName: 'First Talent',
      }),
      resolved: {description: 'First desc'} as never,
      descriptionRank: 10,
      descriptionMaxRank: 10,
    }),
    makeDatabaseDescribedEntry({
      key: 'T2',
      label: 'Second Talent',
      record: makeTalentRecord({
        id: 'talent.test.second',
        displayName: 'Second Talent',
      }),
      resolved: {description: 'Second desc'} as never,
      descriptionRank: 0,
      descriptionMaxRank: 10,
    }),
    makeDatabaseDescribedEntry({
      key: 'T3',
      label: 'Third Talent',
      record: makeTalentRecord({
        id: 'talent.test.third',
        displayName: 'Third Talent',
        family: 'soulforge_aptitude',
        maxLevel: 10,
      }),
      resolved: {description: 'Third desc'} as never,
      descriptionRank: 1,
      descriptionMaxRank: 10,
    }),
    makeDatabaseDescribedEntry({
      key: 'T4',
      label: 'Fourth Talent',
      record: makeTalentRecord({
        id: 'talent.test.fourth',
        displayName: 'Fourth Talent',
        maxLevel: 5,
      }),
      resolved: {description: 'Fourth desc'} as never,
      descriptionRank: 5,
      descriptionMaxRank: 5,
    }),
  ],
  overExalt: makeDatabaseDescribedEntry({
    key: 'OverExalt',
    label: 'Over Exalt',
    record: makeSkillRecord({
      id: 'skill.test.over-exalt',
      kind: 'over_exalt',
      displayName: 'Face Death in Fiery Resolve',
      descriptionTemplate: 'Over Exalt text',
    }),
    resolved: {description: 'Over Exalt text'} as never,
    descriptionRank: 1,
    descriptionMaxRank: 6,
  }),
  enlightens: [
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

describe('AwakenerDetailUpgrades', () => {
  it('renders fourth talent entries and over exalt progression rows when they exist in the full data', () => {
    const openRootReferenceByName = vi.fn()
    const state = {
      openRootReferenceByName,
    }
    const mockStore = {
      getState: () => state,
      subscribe: vi.fn(),
    } as any

    render(
      <PopoverStoreContext.Provider value={mockStore}>
        <AwakenerDetailUpgrades
          awakener={TEST_AWAKENER}
          fontScale={'medium'}
          referenceLayer={null}
          shellView={TEST_SHELL_VIEW}
        />
      </PopoverStoreContext.Provider>,
    )

    expect(screen.getByText('First Talent')).toBeInTheDocument()
    expect(screen.getByText('Second Talent')).toBeInTheDocument()
    expect(screen.getByText('Third Talent')).toBeInTheDocument()
    expect(screen.getByText('Fourth Talent')).toBeInTheDocument()
    expect(screen.getByText('First Talent')).toHaveTextContent(/^First Talent$/)
    expect(screen.queryByText('T1')).not.toBeInTheDocument()
    expect(screen.getByText('Off')).toBeInTheDocument()
    expect(screen.queryByText('Lv. 1/10')).not.toBeInTheDocument()
    expect(screen.getByText('Lv. 5/5')).toBeInTheDocument()
    expect(screen.queryByText('T4')).not.toBeInTheDocument()
    expect(screen.getByRole('button', {name: 'Over-Exaltation'})).toBeInTheDocument()
    expect(screen.getByText('Face Death in Fiery Resolve').closest('div')).toHaveTextContent(
      /Over-Exaltation.*Face Death in Fiery Resolve/,
    )
    expect(screen.getByRole('button', {name: 'Absolute Axiom'})).toBeInTheDocument()
    expect(screen.getByText('Infinite Singularity').closest('div')).toHaveTextContent(
      /Absolute Axiom.*Infinite Singularity/,
    )

    fireEvent.click(screen.getByRole('button', {name: 'Over-Exaltation'}))
    expect(openRootReferenceByName).toHaveBeenCalledWith('Over Exalt', expect.anything())
  })

  it('renders every talent entry provided by the shell view', () => {
    const state = {
      openRootReferenceByName: vi.fn(),
    }
    const mockStore = {
      getState: () => state,
      subscribe: vi.fn(),
    } as any

    render(
      <PopoverStoreContext.Provider value={mockStore}>
        <AwakenerDetailUpgrades
          awakener={TEST_AWAKENER}
          fontScale={'medium'}
          referenceLayer={null}
          shellView={makeDatabaseShellView({
            ...TEST_SHELL_VIEW,
            talents: [
              ...TEST_SHELL_VIEW.talents,
              makeDatabaseDescribedEntry({
                key: 'talent:talent.doresain.festering-grace',
                label: 'Talent',
                record: makeTalentRecord({
                  id: 'talent.doresain.festering-grace',
                  displayName: 'Festering Grace',
                }),
                resolved: {description: 'After Doresain gains a Corpse, add a Revel.'} as never,
                descriptionRank: 1,
                descriptionMaxRank: 1,
              }),
            ],
          })}
        />
      </PopoverStoreContext.Provider>,
    )

    expect(screen.getByText('Fourth Talent')).toBeInTheDocument()
    expect(screen.getByText('Festering Grace')).toBeInTheDocument()
    expect(screen.getByText('Festering Grace')).toHaveTextContent(/^Festering Grace$/)
  })
})
