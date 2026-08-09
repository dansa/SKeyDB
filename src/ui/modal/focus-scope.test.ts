import {describe, expect, it} from 'vitest'

import {getFocusableElements} from './focus-scope'

function makeRoot(markup: string): HTMLElement {
  const root = document.createElement('div')
  root.innerHTML = markup
  document.body.appendChild(root)
  return root
}

describe('getFocusableElements', () => {
  it('uses rendered visibility instead of treating the responsive hidden utility as permanent', () => {
    const root = makeRoot(`
      <div class="hidden md:flex" style="display: flex">
        <button data-testid="responsive">Responsive action</button>
      </div>
      <div style="display: none">
        <button data-testid="display-none">Hidden action</button>
      </div>
      <div style="visibility: hidden">
        <a data-testid="visibility-hidden" href="#hidden">Hidden link</a>
      </div>
      <div data-testid="hidden-ancestor" style="display: none">
        <div id="nested-focus-scope"><button data-testid="nested-hidden">Hidden</button></div>
      </div>
    `)

    expect(getFocusableElements(root).map((element) => element.dataset.testid)).toEqual([
      'responsive',
    ])
    const nestedScope = root.querySelector<HTMLElement>('#nested-focus-scope')
    if (!nestedScope) {
      throw new Error('Expected the nested focus scope')
    }
    expect(getFocusableElements(nestedScope)).toEqual([])

    root.remove()
  })

  it('covers native and editable focusables while excluding unavailable elements', () => {
    const root = makeRoot(`
      <a data-testid="link" href="#target">Link</a>
      <details open><summary data-testid="summary">Summary</summary></details>
      <div contenteditable="true" data-testid="editable">Editable</div>
      <button data-testid="disabled" disabled>Disabled</button>
      <input data-testid="hidden-input" type="hidden" />
      <div inert><button data-testid="inert">Inert</button></div>
      <div aria-hidden="true"><button data-testid="aria-hidden">Hidden</button></div>
      <button data-testid="negative-tab" tabindex="-1">Negative tab</button>
    `)

    expect(getFocusableElements(root).map((element) => element.dataset.testid)).toEqual([
      'link',
      'summary',
      'editable',
    ])

    root.remove()
  })
})
