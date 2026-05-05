import {describe, expect, it, vi} from 'vitest'

import type {Awakener} from '@/domain/awakeners'

import {createBuilderAwakenerActions} from './createBuilderAwakenerActions'
import type {ActiveSelection, TeamSlot} from './types'

const awakenerById = new Map<string, Awakener>([
  [
    'awakener-0021',
    {
      id: 'awakener-0021',
      name: 'Goliath',
      faction: 'Among the Stars',
      realm: 'AEQUOR',
      aliases: ['Goliath'],
      tags: [],
      lineupToken: 'a',
    },
  ],
  [
    'awakener-0042',
    {
      id: 'awakener-0042',
      name: 'Ramona',
      faction: 'The Fools',
      realm: 'CHAOS',
      aliases: ['Ramona'],
      tags: [],
      lineupToken: 'b',
    },
  ],
])

function buildSlots(): TeamSlot[] {
  return [
    {
      slotId: 'slot-1',
      awakenerId: 'awakener-0021',
      realm: 'AEQUOR',
      level: 60,
      wheels: [null, null],
    },
    {slotId: 'slot-2', wheels: [null, null]},
  ]
}

function createActions(options?: {
  teamSlots?: TeamSlot[]
  resolvedActiveSelection?: ActiveSelection
  usedAwakenerByIdentityKey?: Map<string, string>
  allowDupes?: boolean
  hasSupportAwakener?: boolean
}) {
  const setActiveTeamSlots = vi.fn()
  const setActiveSelection = vi.fn()
  const requestAwakenerTransfer = vi.fn()
  const clearPendingDelete = vi.fn()
  const clearTransfer = vi.fn()
  const notifyViolation = vi.fn()

  return {
    actions: createBuilderAwakenerActions({
      teamSlots: options?.teamSlots ?? buildSlots(),
      awakenerById,
      effectiveActiveTeamId: 'team-1',
      usedAwakenerByIdentityKey: options?.usedAwakenerByIdentityKey ?? new Map(),
      resolvedActiveSelection: options?.resolvedActiveSelection ?? null,
      setActiveTeamSlots,
      setActiveSelection,
      requestAwakenerTransfer,
      clearPendingDelete,
      clearTransfer,
      notifyViolation,
      allowDupes: options?.allowDupes ?? false,
      hasSupportAwakener: options?.hasSupportAwakener ?? false,
    }),
    setActiveTeamSlots,
    setActiveSelection,
    requestAwakenerTransfer,
    clearPendingDelete,
    clearTransfer,
    notifyViolation,
  }
}

describe('createBuilderAwakenerActions', () => {
  it('handles drop assignment and activates dropped slot', () => {
    const {actions, setActiveTeamSlots, setActiveSelection} = createActions({
      teamSlots: [
        {slotId: 'slot-1', wheels: [null, null]},
        {slotId: 'slot-2', wheels: [null, null]},
      ],
    })

    actions.handleDropPickerAwakener('awakener-0021', 'slot-2')

    expect(setActiveTeamSlots).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({slotId: 'slot-1'}),
        expect.objectContaining({slotId: 'slot-2', awakenerId: 'awakener-0021'}),
      ]),
    )
    expect(setActiveSelection).toHaveBeenCalledWith({kind: 'awakener', slotId: 'slot-2'})
  })

  it('requests transfer for owning team instead of applying state update', () => {
    const {actions, requestAwakenerTransfer, setActiveTeamSlots} = createActions({
      usedAwakenerByIdentityKey: new Map([['ramona', 'team-2']]),
    })

    actions.handleDropPickerAwakener('awakener-0042', 'slot-2')

    expect(setActiveTeamSlots).not.toHaveBeenCalled()
    expect(requestAwakenerTransfer).toHaveBeenCalledWith({
      awakenerName: 'Ramona',
      awakenerId: 'awakener-0042',
      canUseSupport: true,
      fromTeamId: 'team-2',
      toTeamId: 'team-1',
      targetSlotId: 'slot-2',
    })
  })

  it('does not offer support when a support awakener is already used elsewhere in the build', () => {
    const {actions, requestAwakenerTransfer} = createActions({
      usedAwakenerByIdentityKey: new Map([['ramona', 'team-2']]),
      hasSupportAwakener: true,
    })

    actions.handleDropPickerAwakener('awakener-0042', 'slot-2')

    expect(requestAwakenerTransfer).toHaveBeenCalledWith({
      awakenerName: 'Ramona',
      awakenerId: 'awakener-0042',
      canUseSupport: false,
      fromTeamId: 'team-2',
      toTeamId: 'team-1',
      targetSlotId: 'slot-2',
    })
  })

  it('click assignment respects active awakener target slot', () => {
    const {actions, setActiveTeamSlots} = createActions({
      teamSlots: [
        {
          slotId: 'slot-1',
          awakenerId: 'awakener-0021',
          realm: 'AEQUOR',
          level: 60,
          wheels: [null, null],
        },
        {slotId: 'slot-2', wheels: [null, null]},
      ],
      resolvedActiveSelection: {kind: 'awakener', slotId: 'slot-2'},
    })

    actions.handlePickerAwakenerClick('awakener-0042')

    expect(setActiveTeamSlots).toHaveBeenCalledWith([
      expect.objectContaining({slotId: 'slot-1', awakenerId: 'awakener-0021'}),
      expect.objectContaining({slotId: 'slot-2', awakenerId: 'awakener-0042'}),
    ])
  })

  it('allows same-identity assignment without transfer when dupes are enabled', () => {
    const {actions, requestAwakenerTransfer, setActiveTeamSlots} = createActions({
      teamSlots: [
        {
          slotId: 'slot-1',
          awakenerId: 'awakener-0021',
          realm: 'AEQUOR',
          level: 60,
          wheels: [null, null],
        },
        {slotId: 'slot-2', wheels: [null, null]},
      ],
      usedAwakenerByIdentityKey: new Map([['goliath', 'team-2']]),
      allowDupes: true,
    })

    actions.handleDropPickerAwakener('awakener-0021', 'slot-2')

    expect(requestAwakenerTransfer).not.toHaveBeenCalled()
    expect(setActiveTeamSlots).toHaveBeenCalledWith([
      expect.objectContaining({slotId: 'slot-1', awakenerId: 'awakener-0021'}),
      expect.objectContaining({slotId: 'slot-2', awakenerId: 'awakener-0021'}),
    ])
  })
})
