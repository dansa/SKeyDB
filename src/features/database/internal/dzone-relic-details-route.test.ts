import {describe, expect, it} from 'vitest'

import {loadRelicRecordById} from '@/domain/relics'

import {buildDzoneRelicPopoverEntry} from './dzone-popover-entries'

describe('D-Zone relic detail action', () => {
  it('keeps the quick popover and exposes the exact variant database route', async () => {
    const record = await loadRelicRecordById('relic-0207')
    if (!record) throw new Error('Missing Malignant Child fixture')

    const entry = buildDzoneRelicPopoverEntry({
      record,
      variantId: 'relic-variant-0340',
    })

    expect(entry.name).toBe('Painted Malignant Child')
    expect(entry.navigationLabel).toBe('Open relic details')
    expect(entry.navigationHref).toBe('/database/relics/malignant-child?variant=relic-variant-0340')
    expect(entry.descriptionSections?.map((section) => section.label)).toEqual(['Effect', 'Lore'])
  })
})
