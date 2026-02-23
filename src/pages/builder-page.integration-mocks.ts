import { afterEach, beforeEach, vi } from 'vitest'
import { BUILDER_PERSISTENCE_KEY } from './builder/builder-persistence'

vi.mock('../domain/wheel-assets', () => ({
  getWheelAssetById: (wheelId: string) => `/mock/wheels/${wheelId}.png`,
}))

vi.mock('../domain/covenant-assets', () => ({
  getCovenantAssetById: (covenantId: string) => `/mock/covenants/${covenantId}.png`,
}))

beforeEach(() => {
  window.localStorage.removeItem(BUILDER_PERSISTENCE_KEY)
})

afterEach(() => {
  window.localStorage.removeItem(BUILDER_PERSISTENCE_KEY)
})
