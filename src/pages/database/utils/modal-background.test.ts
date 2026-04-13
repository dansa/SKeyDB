import {describe, expect, it} from 'vitest'

import type {Awakener} from '@/domain/awakeners'

import {MODAL_GRADIENT_VARIANTS} from '../constants'
import {buildModalBackground, getModalBackgroundVariantIndex} from './modal-background'

describe('modal-background utilities', () => {
  it('returns a deterministic variant index for the same awakener', () => {
    const awakener = {id: 7, name: 'alpha'} as Awakener

    expect(getModalBackgroundVariantIndex(awakener)).toBe(getModalBackgroundVariantIndex(awakener))
  })

  it('keeps the variant index within the available range', () => {
    const index = getModalBackgroundVariantIndex({id: 999, name: 'beta'} as Awakener)
    expect(index).toBeGreaterThanOrEqual(0)
    expect(index).toBeLessThan(MODAL_GRADIENT_VARIANTS.length)
  })

  it('builds a layered background string using the provided tint and variant', () => {
    const background = buildModalBackground('#ffaa33', MODAL_GRADIENT_VARIANTS[0])

    expect(background).toContain('#ffaa33')
    expect(background).toContain('linear-gradient')
    expect(background.match(/radial-gradient/g)).toHaveLength(
      2 + MODAL_GRADIENT_VARIANTS[0].glows.length,
    )
  })
})
