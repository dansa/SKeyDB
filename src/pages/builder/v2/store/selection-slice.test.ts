import {describe, expect, it} from 'vitest'

import {useBuilderStore} from './builder-store'

function resetStore() {
  useBuilderStore.setState(useBuilderStore.getInitialState(), true)
}

describe('selection slice', () => {
  it('starts with no selection', () => {
    resetStore()
    expect(useBuilderStore.getState().activeSelection).toBeNull()
  })

  it('toggleAwakenerSelection sets awakener selection and switches to awakeners tab', () => {
    resetStore()
    useBuilderStore.getState().toggleAwakenerSelection('slot-1')
    const state = useBuilderStore.getState()
    expect(state.activeSelection).toEqual({kind: 'awakener', slotId: 'slot-1'})
    expect(state.pickerTab).toBe('awakeners')
  })

  it('toggleAwakenerSelection deselects when same slot is toggled', () => {
    resetStore()
    useBuilderStore.getState().toggleAwakenerSelection('slot-1')
    useBuilderStore.getState().toggleAwakenerSelection('slot-1')
    expect(useBuilderStore.getState().activeSelection).toBeNull()
  })

  it('toggleAwakenerSelection switches to different slot', () => {
    resetStore()
    useBuilderStore.getState().toggleAwakenerSelection('slot-1')
    useBuilderStore.getState().toggleAwakenerSelection('slot-2')
    expect(useBuilderStore.getState().activeSelection).toEqual({kind: 'awakener', slotId: 'slot-2'})
  })

  it('toggleWheelSelection sets wheel selection and switches to wheels tab', () => {
    resetStore()
    useBuilderStore.getState().toggleWheelSelection('slot-1', 0)
    const state = useBuilderStore.getState()
    expect(state.activeSelection).toEqual({kind: 'wheel', slotId: 'slot-1', wheelIndex: 0})
    expect(state.pickerTab).toBe('wheels')
  })

  it('toggleWheelSelection deselects when same slot+index is toggled', () => {
    resetStore()
    useBuilderStore.getState().toggleWheelSelection('slot-1', 0)
    useBuilderStore.getState().toggleWheelSelection('slot-1', 0)
    expect(useBuilderStore.getState().activeSelection).toBeNull()
  })

  it('toggleCovenantSelection sets covenant selection and switches to covenants tab', () => {
    resetStore()
    useBuilderStore.getState().toggleCovenantSelection('slot-1')
    const state = useBuilderStore.getState()
    expect(state.activeSelection).toEqual({kind: 'covenant', slotId: 'slot-1'})
    expect(state.pickerTab).toBe('covenants')
  })

  it('clearSelection clears any active selection', () => {
    resetStore()
    useBuilderStore.getState().toggleAwakenerSelection('slot-1')
    useBuilderStore.getState().clearSelection()
    expect(useBuilderStore.getState().activeSelection).toBeNull()
  })

  it('setActiveSelection sets the selection directly and syncs the picker tab', () => {
    resetStore()
    useBuilderStore.getState().setActiveSelection({kind: 'wheel', slotId: 'slot-1', wheelIndex: 1})
    const state = useBuilderStore.getState()
    expect(state.activeSelection).toEqual({kind: 'wheel', slotId: 'slot-1', wheelIndex: 1})
    expect(state.pickerTab).toBe('wheels')
  })
})
