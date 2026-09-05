import {beforeEach, describe, expect, it, vi} from 'vitest'

import {loadPublicRecord} from '@/data-access/public-data/recordRepository'
import aurita from '@/data/public-v3/records/awakeners/awakener-0005.json'

import {loadAwakenerQuoteExchange} from './awakener-lore'
import {awakenerProfileSchema} from './awakener-lore-schema'
import type {AwakenerFullRecord, AwakenerQuote} from './awakeners-full'
import {
  adaptPublicV3SkillRecord,
  parsePublicV3SkillRecord,
} from './public-v3-awakener-record-adapters'

vi.mock('@/data-access/public-data/recordRepository', () => ({loadPublicRecord: vi.fn()}))

const local: AwakenerQuote = {id: 'local', title: 'Chat', content: 'Reply.'}
const remote: AwakenerQuote = {id: 'remote', title: 'Chat', content: 'Opening.'}
// The resolver only consumes identity and profile; combat data is intentionally absent.
const current = {
  id: 5,
  displayName: 'Aurita',
  profile: {voiceLines: {traphase: [local]}},
} as AwakenerFullRecord
const exchange: AwakenerQuote = {
  ...local,
  exchange: [
    {awakenerId: 'awakener-0001', lineId: 'remote'},
    {awakenerId: 'awakener-0005', lineId: 'local'},
  ],
}
const participant = {
  schemaVersion: 3 as const,
  kind: 'awakener' as const,
  id: 'awakener-0001',
  name: 'Other',
  profile: {voiceLines: {traphase: [remote]}},
}

beforeEach(() => vi.resetAllMocks())

describe('Awakener lore contracts', () => {
  it('accepts legacy profiles and validates current public quotes', () => {
    expect(awakenerProfileSchema.parse({})).toEqual({})
    expect(
      awakenerProfileSchema.parse(aurita.profile).voiceLines?.traphase?.length,
    ).toBeGreaterThan(0)
    expect(
      awakenerProfileSchema.safeParse({voiceLines: {daily: [{id: 'x', title: 'x', content: 2}]}})
        .success,
    ).toBe(false)
    expect(
      awakenerProfileSchema.safeParse({
        voiceLines: {daily: [{...local, exchange: [{awakenerId: 'bad', lineId: 'x'}]}]},
      }).success,
    ).toBe(false)
  })

  it('preserves and validates skill lore without requiring it on legacy records', () => {
    const raw = {
      schemaVersion: 3,
      kind: 'skill',
      id: 'skill.test',
      name: 'Test',
      ownerAwakenerId: 'awakener-0005',
      lore: 'Skill story',
    }
    expect(adaptPublicV3SkillRecord(parsePublicV3SkillRecord(raw)).lore).toBe('Skill story')
    expect(() => parsePublicV3SkillRecord({...raw, lore: 12})).toThrow()
    expect(
      adaptPublicV3SkillRecord(parsePublicV3SkillRecord({...raw, lore: undefined})).lore,
    ).toBeUndefined()
  })
})

describe('on-demand quote exchange', () => {
  it('does not load records during module initialization or without references', async () => {
    expect(loadPublicRecord).not.toHaveBeenCalled()
    await expect(loadAwakenerQuoteExchange(current, local)).resolves.toEqual([])
    expect(loadPublicRecord).not.toHaveBeenCalled()
  })

  it('resolves local-only references without fetching', async () => {
    await expect(
      loadAwakenerQuoteExchange(current, {
        ...local,
        exchange: [{awakenerId: 'awakener-0005', lineId: 'local'}],
      }),
    ).resolves.toEqual([{awakenerId: 'awakener-0005', speakerName: 'Aurita', quote: local}])
    expect(loadPublicRecord).not.toHaveBeenCalled()
  })

  it('requests only missing participant records once and preserves supplied order', async () => {
    vi.mocked(loadPublicRecord).mockResolvedValue(participant)
    const result = await loadAwakenerQuoteExchange(current, {
      ...exchange,
      exchange: [
        {awakenerId: 'awakener-0001', lineId: 'remote'},
        {awakenerId: 'awakener-0005', lineId: 'local'},
        {awakenerId: 'awakener-0001', lineId: 'remote'},
      ],
    })
    expect(result.map((line) => line.quote.content)).toEqual(['Opening.', 'Reply.', 'Opening.'])
    expect(result.map((line) => line.speakerName)).toEqual(['Other', 'Aurita', 'Other'])
    expect(loadPublicRecord).toHaveBeenCalledExactlyOnceWith('awakeners', 'awakener-0001')
  })

  it('allows retry after a missing record or transient failure', async () => {
    vi.mocked(loadPublicRecord)
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('Network'))
      .mockResolvedValueOnce(participant)
    await expect(loadAwakenerQuoteExchange(current, exchange)).rejects.toThrow('Please try again')
    await expect(loadAwakenerQuoteExchange(current, exchange)).rejects.toThrow('Network')
    await expect(loadAwakenerQuoteExchange(current, exchange)).resolves.toHaveLength(2)
  })

  it('rejects malformed profiles and unresolved line references', async () => {
    vi.mocked(loadPublicRecord)
      .mockResolvedValueOnce({...participant, profile: {voiceLines: {daily: 'bad'}}})
      .mockResolvedValueOnce(participant)
    await expect(loadAwakenerQuoteExchange(current, exchange)).rejects.toThrow('participant')
    await expect(
      loadAwakenerQuoteExchange(current, {
        ...exchange,
        exchange: [{awakenerId: 'awakener-0001', lineId: 'missing'}],
      }),
    ).rejects.toThrow('quote could not be found')
  })
})
