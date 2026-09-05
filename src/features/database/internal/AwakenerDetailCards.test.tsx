import {fireEvent, render, screen, within} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import {AwakenerDetailCards} from './AwakenerDetailCards'
import {DatabasePopoverContext} from './database-popover-context'
import {
  makeDatabaseDescribedEntry,
  makeDatabasePopoverContext,
  makeDatabaseShellView,
  makeDerivedSkillRecord,
  makeSkillRecord,
} from './database-test-fixtures'

vi.mock('./RichDescription', () => ({
  RichDescription: ({
    text,
    record,
    keywordFooterText,
    skillLevel,
  }: {
    text?: string
    record?: {descriptionTemplate?: string}
    keywordFooterText?: string
    skillLevel?: number
  }) => (
    <span data-skill-level={skillLevel}>
      {record?.descriptionTemplate ?? text}
      {keywordFooterText ? `|${keywordFooterText}` : ''}
    </span>
  ),
}))

const openRootReferenceByName = vi.fn()
const popoverContext = makeDatabasePopoverContext({
  openRootReferenceByName,
})

describe('AwakenerDetailCards', () => {
  it('shows enlighten influence badges for affected cards', () => {
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
        makeDatabaseDescribedEntry({
          key: 'C4',
          label: 'Card · C4 · Cost 1',
          record: makeSkillRecord({
            id: 'skill.test.mortal-blast',
            kind: 'command',
            displayName: 'Mortal Blast',
            cardFamily: 'command',
            cardTypes: ['skill'],
            countsAs: ['strike'],
            cost: '1',
            descriptionTemplate: 'Mortal Blast text',
          }),
          resolved: {description: 'Mortal Blast text'} as never,
          descriptionMaxRank: 6,
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
    render(
      <DatabasePopoverContext.Provider value={popoverContext}>
        <AwakenerDetailCards
          onToggleEnlightenSlot={onToggleEnlightenSlot}
          referenceLayer={null}
          shellView={shellView}
        />
      </DatabasePopoverContext.Provider>,
    )

    expect(screen.getAllByText('E1')).toHaveLength(2)
    expect(
      within(screen.getByRole('region', {name: 'Reading area'})).getByText('E3'),
    ).toBeInTheDocument()
    expect(screen.getAllByText('T1')).toHaveLength(3)
    expect(
      within(screen.getByRole('region', {name: 'Reading area'})).getByText('Cost 2'),
    ).toBeInTheDocument()
    expect(
      within(screen.getByRole('region', {name: 'Reading area'})).getByText(
        'Rouse text|{Retain}, {Prepare 2}',
      ),
    ).toBeInTheDocument()
    expect(
      within(screen.getByRole('region', {name: 'Reading area'})).getByText('Base Cards'),
    ).toBeInTheDocument()
    expect(
      within(screen.getByRole('region', {name: 'Reading area'})).getByText('Extra Cards'),
    ).toBeInTheDocument()
    expect(
      within(screen.getByRole('region', {name: 'Reading area'})).getByText('Important Extra'),
    ).toBeInTheDocument()
    expect(
      within(screen.getByRole('region', {name: 'Reading area'}))
        .getByText('Important Extra')
        .closest('[data-card-header]'),
    ).toHaveTextContent(/Important Extra.*Cost 0.*Command.*Derived/)
    expect(
      within(screen.getByRole('region', {name: 'Reading area'})).getByText('Extra text|{Exhaust}'),
    ).toBeInTheDocument()
    expect(
      within(screen.getByRole('region', {name: 'Reading area'}))
        .getByText('Twisted Carrion Revel')
        .closest('[data-card-header]'),
    ).toHaveTextContent(/Twisted Carrion Revel.*Cost 100.*Exalt/)
    expect(
      within(screen.getByRole('region', {name: 'Reading area'}))
        .getByText('Mediating Personalities')
        .closest('[data-card-header]'),
    ).toHaveTextContent(/Mediating Personalities.*Cost 2.*Rouse/)
    expect(
      within(screen.getByRole('region', {name: 'Reading area'}))
        .getByText('Mortal Blast')
        .closest('[data-card-header]'),
    ).toHaveTextContent(/Mortal Blast.*Cost 1.*Command.*Skill.*Counts as Strike/)
    expect(
      within(screen.getByRole('region', {name: 'Reading area'})).getByText('Counts as Strike')
        .parentElement,
    ).toHaveTextContent('·Counts as Strike')
    expect(
      screen.getByRole('button', {name: 'Over Exalt'}).closest('[data-card-header]'),
    ).toHaveTextContent(/Face Death in Fiery Resolve.*Cost 200.*Exalt.*Over Exalt/)
    expect(screen.getByRole('button', {name: 'Over Exalt'})).toHaveClass(
      'database-inherit-font-size',
    )
    expect(screen.getByRole('button', {name: 'Rouse'})).toHaveClass('database-inherit-font-size')

    fireEvent.click(screen.getByRole('button', {name: 'Over Exalt'}))
    expect(openRootReferenceByName).toHaveBeenCalledWith('Over Exalt', expect.anything())

    fireEvent.click(screen.getByRole('button', {name: 'Rouse'}))
    expect(openRootReferenceByName).toHaveBeenCalledWith('Rouse', expect.anything())

    expect(onToggleEnlightenSlot).not.toHaveBeenCalled()
  })

  it('renders temporary Orison analogues as end-of-description references', () => {
    const shellView = makeDatabaseShellView({
      skillLevel: 4,
      commandCards: [
        makeDatabaseDescribedEntry({
          key: 'C1',
          label: 'Card · Rouse · Cost 1',
          record: makeSkillRecord({
            id: 'skill.tinct.voices-from-beyond',
            kind: 'rouse',
            displayName: 'Voices from Beyond',
            cost: '1',
            descriptionTemplate: 'Localized skill description.',
            orisonApplications: [
              {
                id: 'orison-application.tinct.voices-from-beyond',
                displayName: 'Voices from Beyond Orison Effects',
                applicationMode: 'TEMPORARY_ANALOG',
                selection: 'ONE_RANDOM_PER_CARD',
                expires: 'BATTLE_END',
                members: [
                  {
                    orisonId: 'orison-0006',
                    temporaryEffect: {
                      descriptionTemplate: 'Gain [Block:Arg1] Shield',
                      descriptionArgs: {
                        Arg1: {
                          kind: 'scaling',
                          values: ['10', '12', '14', '16', '18', '20'],
                          stat: 'DEF',
                          suffix: '%',
                        },
                      },
                    },
                  },
                ],
              },
            ],
          }),
          resolved: {description: 'Localized skill description.'} as never,
          descriptionMaxRank: 6,
          descriptionRank: 4,
          keywordFooterText: '{orison:Bastion}',
        }),
      ],
    })

    render(
      <DatabasePopoverContext.Provider value={popoverContext}>
        <AwakenerDetailCards referenceLayer={null} shellView={shellView} />
      </DatabasePopoverContext.Provider>,
    )

    expect(screen.queryByRole('region', {name: 'Voices from Beyond Orison Effects'})).toBeNull()
    expect(
      within(screen.getByRole('region', {name: 'Reading area'})).getByText(
        /Localized skill description/,
      ),
    ).toHaveTextContent(/Localized skill description.*\{orison:Bastion\}/)
  })
  it('offers only present skill groups and every index entry focuses its rendered target', () => {
    const shellView = makeDatabaseShellView({
      exalts: [],
      promotedExtras: [],
      commandCards: [
        makeDatabaseDescribedEntry({
          key: 'C1',
          label: 'Rouse',
          resolved: {description: 'Navigation description'} as never,
          record: makeSkillRecord({
            id: 'skill.navigation.rouse',
            kind: 'rouse',
            displayName: 'Navigation Rouse',
          }),
        }),
      ],
    })
    const {container} = render(
      <AwakenerDetailCards
        referenceLayer={null}
        shellView={shellView}
        leadingContent={<p>Mobile progression controls</p>}
      />,
    )
    expect(screen.queryByRole('button', {name: 'Exalts'})).toBeNull()
    expect(screen.queryByRole('button', {name: 'Extra Cards'})).toBeNull()
    const controls = within(screen.getByRole('region', {name: 'Reading area'})).getByText(
      'Mobile progression controls',
    )
    expect(controls.closest('.detail-reader-scroll')).not.toBeNull()
    for (const option of container.querySelectorAll<HTMLOptionElement>('option[value]')) {
      if (!option.value) continue
      const target = document.getElementById(option.value)
      expect(target).not.toBeNull()
      fireEvent.change(screen.getByRole('combobox', {name: 'Index'}), {
        target: {value: option.value},
      })
      expect(target).toHaveFocus()
    }
  })
})
