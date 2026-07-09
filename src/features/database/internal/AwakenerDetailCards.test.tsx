import {fireEvent, render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import {AwakenerDetailCards} from './AwakenerDetailCards'
import {
  makeDatabaseDescribedEntry,
  makeDatabaseShellView,
  makeDerivedSkillRecord,
  makeSkillRecord,
} from './database-test-fixtures'
import {PopoverStoreContext} from './usePopoverStore'

vi.mock('./RichDescription', () => ({
  RichDescription: ({
    text,
    record,
    keywordFooterText,
  }: {
    text?: string
    record?: {descriptionTemplate?: string}
    keywordFooterText?: string
  }) => (
    <>
      {record?.descriptionTemplate ?? text}
      {keywordFooterText ? `|${keywordFooterText}` : ''}
    </>
  ),
}))

describe('AwakenerDetailCards', () => {
  it('shows enlighten influence badges for affected cards', () => {
    const openRootReferenceByName = vi.fn()
    const onToggleEnlightenSlot = vi.fn()
    const shellView = makeDatabaseShellView({
      selection: {
        soulforgeLevel: 0,
        gnosticPotentialLevel: 0,
        selectedEnlightenSlot: 'E2',
      },
      stats: null,
      exalts: [
        makeDatabaseDescribedEntry({
          key: 'Exalt',
          label: 'Card · Exalt · Cost 100',
          record: makeSkillRecord({
            id: 'skill.test.exalt',
            kind: 'exalt',
            displayName: 'Twisted Carrion Revel',
            cost: '100',
            descriptionTemplate: 'Exalt text',
          }),
          resolved: {description: 'Exalt text'} as never,
          descriptionMaxRank: 6,
          influenceBadges: [
            {
              kind: 'enlighten',
              id: 'enlighten.test.e1',
              label: 'E1',
              referenceName: 'First Enlighten',
              slot: 'E1',
            },
            {
              kind: 'talent',
              id: 'talent.test.base',
              label: 'T1',
              referenceName: 'Base Talent',
            },
          ],
          keywordFooterText: '{Retain}',
        }),
        makeDatabaseDescribedEntry({
          key: 'OverExalt',
          label: 'Card · Over Exalt · Cost 200',
          record: makeSkillRecord({
            id: 'skill.test.over-exalt',
            kind: 'over_exalt',
            displayName: 'Face Death in Fiery Resolve',
            cost: '',
            descriptionTemplate: 'Over Exalt text',
          }),
          resolved: {description: 'Over Exalt text'} as never,
          descriptionMaxRank: 6,
          keywordFooterText: undefined,
        }),
      ],
      commandCards: [
        makeDatabaseDescribedEntry({
          key: 'C1',
          label: 'Card · Rouse · Cost 2',
          record: makeSkillRecord({
            id: 'skill.test.rouse',
            kind: 'rouse',
            displayName: 'Mediating Personalities',
            cost: '2',
            descriptionTemplate: 'Rouse text',
          }),
          resolved: {description: 'Rouse text'} as never,
          descriptionMaxRank: 6,
          influenceBadges: [
            {
              kind: 'enlighten',
              id: 'enlighten.test.e1',
              label: 'E1',
              referenceName: 'First Enlighten',
              slot: 'E1',
            },
            {
              kind: 'enlighten',
              id: 'enlighten.test.e3',
              label: 'E3',
              referenceName: 'Third Enlighten',
              slot: 'E3',
            },
            {
              kind: 'talent',
              id: 'talent.test.base',
              label: 'T1',
              referenceName: 'Base Talent',
            },
          ],
          keywordFooterText: '{Retain}, {Prepare 2}',
        }),
      ],
      promotedExtras: [
        makeDatabaseDescribedEntry({
          key: 'Promoted0',
          label: 'Card · Derived · Cost 0',
          record: makeDerivedSkillRecord({
            id: 'derived.test.extra',
            displayName: 'Important Extra',
            cost: '0',
            descriptionTemplate: 'Extra text',
            childDerivedSkillIds: [],
          }),
          resolved: {description: 'Extra text'} as never,
          influenceBadges: [
            {
              kind: 'talent',
              id: 'talent.test.base',
              label: 'T1',
              referenceName: 'Base Talent',
            },
          ],
          keywordFooterText: '{Exhaust}',
        }),
      ],
    })

    const state = {
      openRootInfo: vi.fn(),
      openRootReferenceByName,
    }
    const mockStore = {
      getState: () => state,
      subscribe: vi.fn(),
    } as any

    render(
      <PopoverStoreContext.Provider value={mockStore}>
        <AwakenerDetailCards
          onToggleEnlightenSlot={onToggleEnlightenSlot}
          referenceLayer={null}
          shellView={shellView}
        />
      </PopoverStoreContext.Provider>,
    )

    expect(screen.getAllByText('E1')).toHaveLength(2)
    expect(screen.getByText('E3')).toBeInTheDocument()
    expect(screen.getAllByText('T1')).toHaveLength(3)
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('Rouse text|{Retain}, {Prepare 2}')).toBeInTheDocument()
    expect(screen.getByText('Derived Cards')).toBeInTheDocument()
    expect(screen.getByText('Important Extra')).toBeInTheDocument()
    expect(screen.getByText('Important Extra').closest('[data-card-header]')).toHaveTextContent(
      /0.*Important Extra.*Derived/,
    )
    expect(screen.getByText('Extra text|{Exhaust}')).toBeInTheDocument()
    expect(
      screen.getByText('Twisted Carrion Revel').closest('[data-card-header]'),
    ).toHaveTextContent(/100.*Twisted Carrion Revel.*Exalt/)
    expect(
      screen.getByText('Mediating Personalities').closest('[data-card-header]'),
    ).toHaveTextContent(/2.*Mediating Personalities.*Rouse/)
    expect(
      screen.getByRole('button', {name: 'Over Exalt'}).closest('[data-card-header]'),
    ).toHaveTextContent(/200.*Face Death in Fiery Resolve.*Over Exalt/)

    fireEvent.click(screen.getByRole('button', {name: 'Over Exalt'}))
    expect(openRootReferenceByName).toHaveBeenCalledWith('Over Exalt', expect.anything())

    fireEvent.click(screen.getByRole('button', {name: 'Rouse'}))
    expect(openRootReferenceByName).toHaveBeenCalledWith('Rouse', expect.anything())

    expect(onToggleEnlightenSlot).not.toHaveBeenCalled()
  })
})
