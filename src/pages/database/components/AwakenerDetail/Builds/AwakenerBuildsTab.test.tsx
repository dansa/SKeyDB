import {fireEvent, render, screen, waitFor} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {AwakenerBuildsTab} from './AwakenerBuildsTab'

const {useAwakenerBuildEntries} = vi.hoisted(() => ({
  useAwakenerBuildEntries: vi.fn(),
}))

vi.mock('../../../../../domain/useAwakenerBuildEntries', () => ({
  useAwakenerBuildEntries,
}))

describe('AwakenerBuildsTab', () => {
  beforeEach(() => {
    useAwakenerBuildEntries.mockReset()
  })

  it('shows a loading state while curated build data is resolving', () => {
    useAwakenerBuildEntries.mockReturnValue(null)

    render(<AwakenerBuildsTab awakenerId={27} />)

    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('renders all configured builds and groups wheel recommendations by line', () => {
    useAwakenerBuildEntries.mockReturnValue([
      {
        awakenerId: 27,
        primaryBuildId: 'dps',
        builds: [
          {
            id: 'dps',
            label: 'DPS',
            summary: 'Damage-first setup.',
            substatPriorityGroups: [['CRIT_DMG'], ['DMG_AMP', 'CRIT_RATE'], ['ATK']],
            recommendedWheels: [
              {tier: 'BIS_SSR', wheelIds: ['C16']},
              {tier: 'ALT_SSR', wheelIds: ['ZL02']},
              {tier: 'BIS_SR', wheelIds: ['SR43']},
              {tier: 'GOOD', wheelIds: ['SR11']},
            ],
            recommendedCovenantIds: ['005', '010'],
          },
          {
            id: 'tank',
            label: 'Tank',
            note: 'Flexible filler support. Use this slot to carry the wheels or covenants your team needs.',
            substatPriorityGroups: [['DEATH_RESISTANCE'], ['CON', 'DEF']],
            recommendedWheels: [
              {tier: 'BIS_SSR', wheelIds: ['ZL04']},
              {tier: 'GOOD', wheelIds: ['SR05']},
            ],
            recommendedCovenantIds: ['001'],
          },
        ],
      },
    ])

    render(<AwakenerBuildsTab awakenerId={27} />)

    expect(screen.getByText('DPS')).toBeInTheDocument()
    expect(screen.getByText('Tank')).toBeInTheDocument()
    expect(screen.getByText('Damage-first setup.')).toBeInTheDocument()
    expect(screen.getByAltText('Crit DMG')).toBeInTheDocument()
    expect(screen.getByAltText('DMG Amp')).toBeInTheDocument()
    expect(screen.getByAltText('Crit Rate')).toBeInTheDocument()
    expect(screen.getAllByText('BiS SSR')).toHaveLength(2)
    expect(screen.getByText('Amber-Tinted Death')).toBeInTheDocument()
    expect(screen.getByAltText(/amber-tinted death wheel/i)).toBeInTheDocument()
    expect(screen.getAllByText('Good')).toHaveLength(2)
    expect(screen.getByText('Critical Point')).toBeInTheDocument()
    expect(screen.getByAltText(/crimson pulse covenant/i)).toBeInTheDocument()
    expect(screen.getByAltText(/cursed rabbit covenant/i)).toBeInTheDocument()
    expect(screen.getByText('Notes')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Flexible filler support. Use this slot to carry the wheels or covenants your team needs.',
      ),
    ).toBeInTheDocument()
  })

  it('hides a redundant build heading when only one build exists', async () => {
    useAwakenerBuildEntries.mockReturnValue([
      {
        awakenerId: 18,
        primaryBuildId: 'core',
        builds: [
          {
            id: 'core',
            label: 'Core',
            substatPriorityGroups: [['ALIEMUS_REGEN'], ['KEYFLARE_REGEN']],
            recommendedWheels: [{tier: 'BIS_SSR', wheelIds: ['C02EX']}],
            recommendedCovenantIds: ['001'],
          },
        ],
      },
    ])

    render(<AwakenerBuildsTab awakenerId={18} />)

    await waitFor(() => {
      expect(screen.getByText('Manikin of Oblivion')).toBeInTheDocument()
    })
    expect(screen.queryByText('Core')).not.toBeInTheDocument()
  })

  it('allows multi-build entries to collapse and expand by heading', async () => {
    useAwakenerBuildEntries.mockReturnValue([
      {
        awakenerId: 27,
        primaryBuildId: 'dps',
        builds: [
          {
            id: 'dps',
            label: 'DPS',
            summary: 'Damage-first setup.',
            substatPriorityGroups: [['CRIT_DMG']],
            recommendedWheels: [{tier: 'BIS_SSR', wheelIds: ['C16']}],
            recommendedCovenantIds: ['005'],
          },
          {
            id: 'tank',
            label: 'Tank',
            summary: 'Frontline setup.',
            substatPriorityGroups: [['DEF']],
            recommendedWheels: [{tier: 'BIS_SSR', wheelIds: ['ZL04']}],
            recommendedCovenantIds: ['001'],
          },
        ],
      },
    ])

    render(<AwakenerBuildsTab awakenerId={27} />)

    const headingButton = await screen.findByRole('button', {name: /DPS/i})
    fireEvent.click(headingButton)
    expect(screen.queryByText('Damage-first setup.')).not.toBeInTheDocument()

    fireEvent.click(headingButton)
    expect(screen.getByText('Damage-first setup.')).toBeInTheDocument()
  })

  it('shows an empty state when no curated builds exist for the awakener', () => {
    useAwakenerBuildEntries.mockReturnValue([])

    render(<AwakenerBuildsTab awakenerId={99} />)

    expect(screen.getByText('No curated builds available yet.')).toBeInTheDocument()
  })
})
