import {describe, expect, it} from 'vitest'

import {scrollRelicVariantIntoView} from './relic-variant-scroll'

function setReadonlyNumber(element: HTMLElement, property: string, value: number) {
  Object.defineProperty(element, property, {configurable: true, value})
}

describe('scrollRelicVariantIntoView', () => {
  it('moves only the variant viewport when the selected control is below it', () => {
    const viewport = document.createElement('div')
    const selectedControl = document.createElement('button')
    viewport.scrollTop = 40
    setReadonlyNumber(viewport, 'clientHeight', 100)
    setReadonlyNumber(selectedControl, 'offsetTop', 180)
    setReadonlyNumber(selectedControl, 'offsetHeight', 30)

    scrollRelicVariantIntoView(viewport, selectedControl)

    expect(viewport.scrollTop).toBe(110)
  })

  it('does not move an already visible selected control', () => {
    const viewport = document.createElement('div')
    const selectedControl = document.createElement('button')
    viewport.scrollTop = 40
    setReadonlyNumber(viewport, 'clientHeight', 100)
    setReadonlyNumber(selectedControl, 'offsetTop', 70)
    setReadonlyNumber(selectedControl, 'offsetHeight', 30)

    scrollRelicVariantIntoView(viewport, selectedControl)

    expect(viewport.scrollTop).toBe(40)
  })
})
