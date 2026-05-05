import {describe, expect, it} from 'vitest'

import {
  buildWheelDatabaseDescriptionRecord,
  resolveDescribedRecord,
  resolveDescriptionTemplate,
} from './description'

describe('entity description facade', () => {
  it('centralizes rich description builders and formula-safe resolution helpers', () => {
    const record = buildWheelDatabaseDescriptionRecord({
      id: 'wheel-0001',
      name: 'Oracle',
      descriptionTemplate: 'Gain [Arg1] ATK.',
      descriptionArgs: {Arg1: {kind: 'fixed', value: '12'}},
    })

    expect(record.kind).toBe('wheel')
    expect(resolveDescriptionTemplate(record.descriptionTemplate, record.descriptionArgs)).toBe(
      'Gain 12 ATK.',
    )
    expect(resolveDescribedRecord(record).description).toBe('Gain 12 ATK.')
  })
})
