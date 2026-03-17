import {create} from 'zustand'
import {devtools} from 'zustand/middleware'
import {immer} from 'zustand/middleware/immer'

import {createOwnershipSlice, subscribeCollectionOwnership} from './ownership-slice'
import {loadInitialBuilderState, subscribeAutosave} from './persistence'
import {createPickerSlice} from './picker-slice'
import {createQuickLineupSlice} from './quick-lineup-slice'
import {createSelectionSlice} from './selection-slice'
import {createTeamsSlice} from './teams-slice'
import {createTransferSlice} from './transfer-slice'
import type {BuilderStore} from './types'

export const useBuilderStore = create<BuilderStore>()(
  devtools(
    immer((set, get) => {
      const initial = loadInitialBuilderState()
      const teamsSlice = createTeamsSlice(set, get)

      return {
        ...teamsSlice,
        teams: initial.teams,
        activeTeamId: initial.activeTeamId,
        ...createSelectionSlice(set),
        ...createPickerSlice(set),
        ...createQuickLineupSlice(set, get),
        ...createTransferSlice(set),
        ...createOwnershipSlice(set),
      }
    }),
    {name: 'builder-v2'},
  ),
)

subscribeAutosave(useBuilderStore)
subscribeCollectionOwnership(useBuilderStore)
