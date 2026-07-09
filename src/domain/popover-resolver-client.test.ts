import {describe, expect, it} from 'vitest'

import type {DescribedRecord} from './description-records'
import {
  resolveDescribedRecordAsync,
  resolveDescriptionTemplateAsync,
} from './popover-resolver-client'

describe('popover-resolver-client', () => {
  it('resolves templates asynchronously using fallback in test environment', async () => {
    const template = 'Deal [Arg1]% {ATK} DMG.'
    const args = {
      Arg1: {
        kind: 'linear' as const,
        base: '10',
        gainPerLevel: '2',
      },
    }
    const context = {rank: 3} // rank 3 = 10 + 2 * (3 - 1) = 14

    const result = await resolveDescriptionTemplateAsync(template, args, context)
    expect(result).toBe('Deal 14% {ATK} DMG.')
  })

  it('resolves described records asynchronously using fallback in test environment', async () => {
    const record: DescribedRecord = {
      id: 'test-skill',
      kind: 'strike' as const,
      displayName: 'Test Skill',
      descriptionTemplate: 'Gain [Arg1] charge and deal [Arg2]% DMG.',
      descriptionArgs: {
        Arg1: {
          kind: 'linear' as const,
          base: '1',
          gainPerLevel: '1',
        },
        Arg2: {
          kind: 'linear' as const,
          base: '50',
          gainPerLevel: '10',
        },
      },
      cardKeywords: [],
      variants: [],
      ownerAwakenerId: 999,
    }

    const result = await resolveDescribedRecordAsync(record, {rank: 2})
    expect(result.description).toBe('Gain 2 charge and deal 60% DMG.')
    expect(result.resolvedArgs.Arg1.totalValue).toBe(2)
    expect(result.resolvedArgs.Arg2.totalValue).toBe(60)
  })
})
