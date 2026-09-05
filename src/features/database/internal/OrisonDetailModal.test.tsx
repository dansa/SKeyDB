import {fireEvent, render, screen} from '@testing-library/react'
import {MemoryRouter} from 'react-router'
import {beforeAll, describe, expect, it, vi} from 'vitest'

import {getOrisonById, loadOrisonRecordById} from '@/domain/orisons'

let OrisonDetailModal: (typeof import('./OrisonDetailModal'))['OrisonDetailModal']
let fixture: {
  item: NonNullable<ReturnType<typeof getOrisonById>>
  fullData: NonNullable<Awaited<ReturnType<typeof loadOrisonRecordById>>>
}

beforeAll(async () => {
  ;({OrisonDetailModal} = await import('./OrisonDetailModal'))
  const item = getOrisonById('orison-0001')
  const fullData = await loadOrisonRecordById('orison-0001')
  if (!item || !fullData) throw new Error('Missing Finesse fixture')
  fixture = {item, fullData}
})

describe('OrisonDetailModal artwork', () => {
  it.each([390, 1024])(
    'follows the selected variant at %ipx, including invalid selection fallback',
    (width) => {
      Object.defineProperty(window, 'innerWidth', {configurable: true, value: width})
      fireEvent(window, new Event('resize'))
      const view = (selectedVariantId?: string) => (
        <MemoryRouter>
          <OrisonDetailModal {...fixture} selectedVariantId={selectedVariantId} onClose={vi.fn()} />
        </MemoryRouter>
      )
      const {rerender} = render(view())
      const art = () =>
        screen.getByRole('button', {name: 'View full art for Finesse'}).querySelector('img')
      expect(art()).toHaveAttribute('src', expect.stringContaining('UI_Rune_3_Big.webp'))
      rerender(view('orison-variant-0002'))
      expect(art()).toHaveAttribute('src', expect.stringContaining('UI_Rune_3_Big_High.webp'))
      rerender(view('orison-variant-9999'))
      expect(art()).toHaveAttribute('src', expect.stringContaining('UI_Rune_3_Big.webp'))
    },
  )
})
