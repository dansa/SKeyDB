import {afterEach, describe, expect, it} from 'vitest'

import {
  resetAwakenerDetailModalStore,
  useAwakenerDetailModalStore,
} from './useAwakenerDetailModalStore'

afterEach(() => {
  localStorage.clear()
  resetAwakenerDetailModalStore()
})

describe('useAwakenerDetailModalStore', () => {
  it('updates modal state through store actions and persists them', () => {
    const store = useAwakenerDetailModalStore.getState()

    store.initialize(1)
    store.setActiveTab('builds')
    store.setAwakenerLevel(90)
    store.setPsycheSurgeOffset(1)
    store.setSkillLevel(6)
    store.toggleScalingMenu()
    store.toggleTagsMenu()

    const nextState = useAwakenerDetailModalStore.getState()

    expect(nextState.activeTab).toBe('builds')
    expect(nextState.awakenerLevel).toBe(90)
    expect(nextState.psycheSurgeOffset).toBe(1)
    expect(nextState.skillLevel).toBe(6)
    expect(nextState.isScalingMenuOpen).toBe(true)
    expect(nextState.isTagsMenuOpen).toBe(true)

    const stored = JSON.parse(localStorage.getItem('awk-detail-settings-1') ?? '{}')
    expect(stored.awakenerLevel).toBe(90)
    expect(stored.psycheSurgeOffset).toBe(1)
    expect(stored.skillLevel).toBe(6)
  })

  it('loads character-specific settings on initialization', () => {
    localStorage.setItem(
      'awk-detail-settings-7',
      JSON.stringify({awakenerLevel: 45, psycheSurgeOffset: 5, skillLevel: 3}),
    )

    const store = useAwakenerDetailModalStore.getState()
    store.initialize(7)

    const nextState = useAwakenerDetailModalStore.getState()
    expect(nextState.awakenerLevel).toBe(45)
    expect(nextState.psycheSurgeOffset).toBe(5)
    expect(nextState.skillLevel).toBe(3)
  })

  it('maintains separate settings for different characters', () => {
    const store = useAwakenerDetailModalStore.getState()

    store.initialize(1)
    store.setAwakenerLevel(90)

    store.initialize(2)
    store.setAwakenerLevel(1)

    store.initialize(1)
    expect(useAwakenerDetailModalStore.getState().awakenerLevel).toBe(90)

    store.initialize(2)
    expect(useAwakenerDetailModalStore.getState().awakenerLevel).toBe(1)
  })

  it('resets to the modal defaults and reloads persisted font scale', () => {
    const store = useAwakenerDetailModalStore.getState()

    store.initialize(1)
    store.setActiveTab('teams')
    store.setAwakenerLevel(1)
    store.setPsycheSurgeOffset(1)
    store.setSkillLevel(4)
    store.setFontScale('large')
    store.toggleScalingMenu()
    store.toggleTagsMenu()

    expect(localStorage.getItem('modal-font-scale')).toBe('large')

    store.reset()

    const resetState = useAwakenerDetailModalStore.getState()
    expect(resetState.activeTab).toBe('cards')
    expect(resetState.awakenerLevel).toBe(60)
    expect(resetState.psycheSurgeOffset).toBe(0)
    expect(resetState.skillLevel).toBe(1)
    expect(resetState.fontScale).toBe('large')
    expect(resetState.isScalingMenuOpen).toBe(false)
    expect(resetState.isTagsMenuOpen).toBe(false)
  })

  it('clamps level and psyche surge values and closes menus explicitly', () => {
    const store = useAwakenerDetailModalStore.getState()

    store.initialize(1)
    store.setAwakenerLevel(999)
    store.setPsycheSurgeOffset(999)
    store.toggleScalingMenu()
    store.toggleTagsMenu()
    store.closeScalingMenu()
    store.closeTagsMenu()
    store.toggleScalingMenu()
    store.toggleTagsMenu()
    store.closeMenus()

    const nextState = useAwakenerDetailModalStore.getState()
    expect(nextState.awakenerLevel).toBe(90)
    expect(nextState.psycheSurgeOffset).toBe(12)
    expect(nextState.isScalingMenuOpen).toBe(false)
    expect(nextState.isTagsMenuOpen).toBe(false)
  })

  it('falls back to the default font scale for invalid stored values during initialization', () => {
    localStorage.setItem('modal-font-scale', 'giant')

    useAwakenerDetailModalStore.getState().initialize(1)

    expect(useAwakenerDetailModalStore.getState().fontScale).toBe('small')
  })
})
