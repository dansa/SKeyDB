import type {BuilderSet, SelectionSlice} from './types'

function syncPickerTabForSelection(
  state: {
    activeSelection: SelectionSlice['activeSelection']
    pickerTab: 'awakeners' | 'wheels' | 'posses' | 'covenants'
  },
  selection: SelectionSlice['activeSelection'],
) {
  state.activeSelection = selection
  if (selection?.kind === 'awakener') {
    state.pickerTab = 'awakeners'
  } else if (selection?.kind === 'wheel') {
    state.pickerTab = 'wheels'
  } else if (selection?.kind === 'covenant') {
    state.pickerTab = 'covenants'
  }
}

export function createSelectionSlice(set: BuilderSet): SelectionSlice {
  return {
    activeSelection: null,

    setActiveSelection: (selection) => {
      set((state) => {
        syncPickerTabForSelection(state, selection)
      })
    },

    toggleAwakenerSelection: (slotId: string) => {
      set((state) => {
        if (state.activeSelection?.kind === 'awakener' && state.activeSelection.slotId === slotId) {
          state.activeSelection = null
        } else {
          syncPickerTabForSelection(state, {kind: 'awakener', slotId})
        }
      })
    },

    toggleWheelSelection: (slotId: string, wheelIndex: number) => {
      set((state) => {
        if (
          state.activeSelection?.kind === 'wheel' &&
          state.activeSelection.slotId === slotId &&
          state.activeSelection.wheelIndex === wheelIndex
        ) {
          state.activeSelection = null
        } else {
          syncPickerTabForSelection(state, {kind: 'wheel', slotId, wheelIndex})
        }
      })
    },

    toggleCovenantSelection: (slotId: string) => {
      set((state) => {
        if (state.activeSelection?.kind === 'covenant' && state.activeSelection.slotId === slotId) {
          state.activeSelection = null
        } else {
          syncPickerTabForSelection(state, {kind: 'covenant', slotId})
        }
      })
    },

    clearSelection: () => {
      set((state) => {
        state.activeSelection = null
      })
    },
  }
}
