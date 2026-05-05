import {render, screen, waitFor} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {AwakenerBuildsTab} from './AwakenerBuildsTab'
import {useDatabasePopoverControllerContext} from './database-popover-context'

const {getAwakenerBuildEntries} = vi.hoisted(() => ({
  getAwakenerBuildEntries: vi.fn(),
}))

const {loadPublicCovenantDetailById, loadPublicWheelDetailById} = vi.hoisted(() => ({
  loadPublicCovenantDetailById: vi.fn(),
  loadPublicWheelDetailById: vi.fn(),
}))

vi.mock('@/domain/awakener-builds', async () => {
  const actual = await vi.importActual<typeof import('@/domain/awakener-builds')>(
    '@/domain/awakener-builds',
  )

  return {
    ...actual,
    getAwakenerBuildEntries,
  }
})

vi.mock('./database-popover-context', () => ({
  useDatabasePopoverControllerContext: vi.fn(),
}))

vi.mock('@/domain/public-detail-record-adapters', () => ({
  loadPublicCovenantDetailById,
  loadPublicWheelDetailById,
}))

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((promiseResolve) => {
    resolve = promiseResolve
  })
  return {promise, resolve}
}

describe('AwakenerBuildsTab', () => {
  beforeEach(() => {
    getAwakenerBuildEntries.mockReset()
    loadPublicCovenantDetailById.mockReset()
    loadPublicWheelDetailById.mockReset()
    vi.mocked(useDatabasePopoverControllerContext).mockReturnValue(null)
  })

  it('renders all configured builds and groups wheel recommendations by line', () => {
    getAwakenerBuildEntries.mockReturnValue([
      {
        id: 'awakener-build-0027',
        awakenerId: 'awakener-0027',
        primaryBuildId: 'dps',
        builds: [
          {
            id: 'dps',
            label: 'DPS',
            summary: 'Damage-first setup.',
            substatPriorityGroups: [['CRIT_DMG'], ['DMG_AMP', 'CRIT_RATE'], ['ATK']],
            recommendedWheels: [
              {tier: 'BIS_SSR', wheelIds: ['wheel-0028']},
              {tier: 'ALT_SSR', wheelIds: ['wheel-0121']},
              {tier: 'BIS_SR', wheelIds: ['wheel-0116']},
              {tier: 'GOOD', wheelIds: ['wheel-0087']},
            ],
            recommendedCovenantIds: ['covenant-0004', 'covenant-0008'],
          },
          {
            id: 'tank',
            label: 'Tank',
            note: 'Flexible filler support. Use this slot to carry the wheels or covenants your team needs.',
            substatPriorityGroups: [['DEATH_RESISTANCE'], ['CON', 'DEF']],
            recommendedWheels: [
              {tier: 'BIS_SSR', wheelIds: ['wheel-0123']},
              {tier: 'GOOD', wheelIds: ['wheel-0081']},
            ],
            recommendedCovenantIds: ['covenant-0001'],
          },
        ],
      },
    ])

    render(<AwakenerBuildsTab awakenerId='awakener-0027' />)

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
    getAwakenerBuildEntries.mockReturnValue([
      {
        id: 'awakener-build-0018',
        awakenerId: 'awakener-0018',
        primaryBuildId: 'core',
        builds: [
          {
            id: 'core',
            label: 'Core',
            substatPriorityGroups: [['ALIEMUS_REGEN'], ['KEYFLARE_REGEN']],
            recommendedWheels: [{tier: 'BIS_SSR', wheelIds: ['wheel-0016']}],
            recommendedCovenantIds: ['covenant-0001'],
          },
        ],
      },
    ])

    render(<AwakenerBuildsTab awakenerId='awakener-0018' />)

    await waitFor(() => {
      expect(screen.getByText('Manikin of Oblivion')).toBeInTheDocument()
    })
    expect(screen.queryByText('Core')).not.toBeInTheDocument()
  })

  it('shows an empty state when no curated builds exist for the awakener', () => {
    getAwakenerBuildEntries.mockReturnValue([])

    render(<AwakenerBuildsTab awakenerId='awakener-0099' />)

    expect(screen.getByText('No curated builds available yet.')).toBeInTheDocument()
  })

  it('opens a wheel preview popover entry from recommended wheel tiles', async () => {
    const openRootInfo = vi.fn()
    vi.mocked(useDatabasePopoverControllerContext).mockReturnValue({
      closeAllPopovers: vi.fn(),
      hasOpenPopovers: false,
      openNestedOverlay: vi.fn(),
      openNestedReferenceByName: vi.fn(),
      openRootInfo,
      openRootOverlay: vi.fn(),
      openRootReferenceByName: vi.fn(),
    })
    getAwakenerBuildEntries.mockReturnValue([
      {
        id: 'awakener-build-0027',
        awakenerId: 'awakener-0027',
        primaryBuildId: 'dps',
        builds: [
          {
            id: 'dps',
            label: 'DPS',
            substatPriorityGroups: [['CRIT_DMG'], ['ATK']],
            recommendedWheels: [{tier: 'BIS_SSR', wheelIds: ['wheel-0028']}],
            recommendedCovenantIds: ['covenant-0004'],
          },
        ],
      },
    ])

    render(<AwakenerBuildsTab awakenerId='awakener-0027' />)

    loadPublicWheelDetailById.mockResolvedValue({
      aliases: ['Amber-Tinted Death'],
      awakener: 'Kathigua',
      descriptionArgs: {},
      descriptionTemplate: 'Deals damage.',
      id: 'wheel-0028',
      mainstatKey: 'CRIT_DMG',
      mainstatSeriesKey: 'SSR:CRIT_DMG',
      name: 'Amber-Tinted Death',
      ownerAwakenerId: 'awakener-0027',
      rarity: 'SSR',
      realm: 'Lumina',
      searchTags: [],
    })

    screen.getByRole('button', {name: /Amber-Tinted Death/i}).click()

    await waitFor(() => {
      expect(loadPublicWheelDetailById).toHaveBeenCalledWith('wheel-0028')
    })

    expect(openRootInfo).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Amber-Tinted Death',
        navigationLabel: 'Open in Wheels DB',
        navigationTarget: {
          kind: 'wheel-page',
          wheelName: 'Amber-Tinted Death',
        },
        attributeRows: [
          expect.objectContaining({
            label: 'Crit DMG',
            value: expect.any(String),
          }),
        ],
        referenceLayerOverride: expect.objectContaining({
          referenceInfoById: expect.any(Map),
        }),
      }),
      expect.any(Object),
    )
  })

  it('opens wheel preview popovers for canonical wheel ids backed by lazy detail records', async () => {
    const openRootInfo = vi.fn()
    vi.mocked(useDatabasePopoverControllerContext).mockReturnValue({
      closeAllPopovers: vi.fn(),
      hasOpenPopovers: false,
      openNestedOverlay: vi.fn(),
      openNestedReferenceByName: vi.fn(),
      openRootInfo,
      openRootOverlay: vi.fn(),
      openRootReferenceByName: vi.fn(),
    })
    getAwakenerBuildEntries.mockReturnValue([
      {
        id: 'awakener-build-0018',
        awakenerId: 'awakener-0018',
        primaryBuildId: 'core',
        builds: [
          {
            id: 'core',
            label: 'Core',
            substatPriorityGroups: [['ALIEMUS_REGEN']],
            recommendedWheels: [{tier: 'BIS_SSR', wheelIds: ['wheel-0016']}],
            recommendedCovenantIds: [],
          },
        ],
      },
    ])

    render(<AwakenerBuildsTab awakenerId='awakener-0018' />)

    loadPublicWheelDetailById.mockResolvedValue({
      aliases: ['Manikin of Oblivion'],
      awakener: 'Ghislaine',
      descriptionArgs: {},
      descriptionTemplate: 'Restores Aliemus.',
      id: 'wheel-0016',
      mainstatKey: 'ALIEMUS_REGEN',
      mainstatSeriesKey: 'SSR:ALIEMUS_REGEN',
      name: 'Manikin of Oblivion',
      ownerAwakenerId: 'awakener-0018',
      rarity: 'SSR',
      realm: 'Gnosis',
      searchTags: [],
    })

    screen.getByRole('button', {name: /Manikin of Oblivion/i}).click()

    await waitFor(() => {
      expect(loadPublicWheelDetailById).toHaveBeenCalledWith('wheel-0016')
    })

    expect(openRootInfo).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Manikin of Oblivion',
        attributeRows: expect.arrayContaining([
          expect.objectContaining({
            label: 'Aliemus Regen',
            value: expect.any(String),
          }),
        ]),
      }),
      expect.any(Object),
    )
  })

  it('keeps only the latest lazy wheel preview request active', async () => {
    const openRootInfo = vi.fn()
    vi.mocked(useDatabasePopoverControllerContext).mockReturnValue({
      closeAllPopovers: vi.fn(),
      hasOpenPopovers: false,
      openNestedOverlay: vi.fn(),
      openNestedReferenceByName: vi.fn(),
      openRootInfo,
      openRootOverlay: vi.fn(),
      openRootReferenceByName: vi.fn(),
    })
    getAwakenerBuildEntries.mockReturnValue([
      {
        id: 'awakener-build-0027',
        awakenerId: 'awakener-0027',
        primaryBuildId: 'dps',
        builds: [
          {
            id: 'dps',
            label: 'DPS',
            substatPriorityGroups: [['CRIT_DMG']],
            recommendedWheels: [{tier: 'BIS_SSR', wheelIds: ['wheel-0028', 'wheel-0016']}],
            recommendedCovenantIds: [],
          },
        ],
      },
    ])

    const firstRequest = deferred<Awaited<ReturnType<typeof loadPublicWheelDetailById>>>()
    const secondRequest = deferred<Awaited<ReturnType<typeof loadPublicWheelDetailById>>>()
    loadPublicWheelDetailById
      .mockReturnValueOnce(firstRequest.promise)
      .mockReturnValueOnce(secondRequest.promise)

    render(<AwakenerBuildsTab awakenerId='awakener-0027' />)

    screen.getByRole('button', {name: /Amber-Tinted Death/i}).click()
    screen.getByRole('button', {name: /Manikin of Oblivion/i}).click()

    secondRequest.resolve({
      aliases: ['Manikin of Oblivion'],
      awakener: 'Ghislaine',
      descriptionArgs: {},
      descriptionTemplate: 'Restores Aliemus.',
      id: 'wheel-0016',
      mainstatKey: 'ALIEMUS_REGEN',
      mainstatSeriesKey: 'SSR:ALIEMUS_REGEN',
      name: 'Manikin of Oblivion',
      ownerAwakenerId: 18,
      rarity: 'SSR',
      realm: 'Gnosis',
      searchTags: [],
    })
    firstRequest.resolve({
      aliases: ['Amber-Tinted Death'],
      awakener: 'Kathigua',
      descriptionArgs: {},
      descriptionTemplate: 'Deals damage.',
      id: 'wheel-0028',
      mainstatKey: 'CRIT_DMG',
      mainstatSeriesKey: 'SSR:CRIT_DMG',
      name: 'Amber-Tinted Death',
      ownerAwakenerId: 27,
      rarity: 'SSR',
      realm: 'Lumina',
      searchTags: [],
    })

    await waitFor(() => {
      expect(openRootInfo).toHaveBeenCalledTimes(1)
    })
    expect(openRootInfo).toHaveBeenCalledWith(
      expect.objectContaining({name: 'Manikin of Oblivion'}),
      expect.any(Object),
    )
  })
})
