import {describe, expect, it} from 'vitest'

import vortice from '@/data/public-v3/records/derived-skills/derived.vortice.vortex-shell.json'
import salvador from '@/data/public-v3/records/skills/skill.salvador.end-of-suffering.json'

import {
  buildDescriptionArgHover,
  formatDescriptionArgProgression,
  getDescriptionArgProgression,
  resolveDescriptionArg,
  resolveDescriptionTemplate,
} from './description-args'
import {resolveDescribedRecord} from './description-records'
import {publicDescriptionArgSchema} from './public-description-args.schema'
import {
  buildRichScalingHover,
  computeRichScalingStatValue,
  formatRichScalingRange,
} from './rich-scaling'
import {fmtNum} from './scaling'

describe('source-semantic numeric display', () => {
  const patch = vortice.upgrades[0].patch
  const args = Object.fromEntries(
    Object.entries(patch.descriptionArgs).map(([key, arg]) => [
      key,
      publicDescriptionArgSchema.parse(arg),
    ]),
  )
  const salvadorArg = publicDescriptionArgSchema.parse(salvador.descriptionArgs.Arg2)

  it.each([
    [0, '0.5'],
    [24, '0.62'],
    [101, '1.005'],
  ])('preserves Vortice E1 at %s Realm Mastery', (mastery, expected) => {
    const context = {channel: 'Float', stats: {RealmMastery: String(mastery)}}
    const resolved = resolveDescriptionArg(args.Arg3, context)
    expect(resolved.formattedTotalValue).toBe(`${expected}%`)
    const recordContext = {stats: context.stats}
    expect(resolveDescriptionTemplate(patch.descriptionTemplate, args, recordContext)).toContain(
      `equal to ${expected}% of`,
    )
    expect(formatDescriptionArgProgression(args.Arg3, context)).toBe(`${expected}%`)
    expect(buildDescriptionArgHover(args.Arg3, context)).toBe('0.5% + Realm Mastery × 0.005%')
    const record = resolveDescribedRecord(
      {
        id: 'vortice-e1',
        kind: 'relic',
        displayName: vortice.name,
        descriptionTemplate: patch.descriptionTemplate,
        descriptionArgs: args,
      },
      recordContext,
      recordContext,
    )
    expect(record.resolvedArgs.Arg3.formattedTotalValue).toBe(`${expected}%`)
    expect(record.orderedArgEntries.find((entry) => entry.key === 'Arg3')?.progression).toBe(
      `${expected}%`,
    )
  })

  it('preserves Salvador Float values in every rank, summary, and tooltip', () => {
    const context = {channel: 'Float'}
    expect(
      getDescriptionArgProgression(salvadorArg, context).map((entry) => entry.formattedTotalValue),
    ).toEqual(['0.75', '0.8', '0.85', '0.9', '0.95', '1'])
    expect(formatDescriptionArgProgression(salvadorArg, context)).toBe('0.75 (+0.05/Lv)')
    expect(buildDescriptionArgHover(salvadorArg, context)).toBe(
      'Lv1: 0.75\nLv2: 0.8\nLv3: 0.85\nLv4: 0.9\nLv5: 0.95\nLv6: 1',
    )
    for (const source of [salvador, salvador.upgrades[0].patch]) {
      const descriptionArgs = Object.fromEntries(
        Object.entries(source.descriptionArgs).map(([key, arg]) => [
          key,
          publicDescriptionArgSchema.parse(arg),
        ]),
      )
      const record = resolveDescribedRecord({
        id: salvador.id,
        kind: 'relic',
        displayName: salvador.name,
        descriptionTemplate: source.descriptionTemplate,
        descriptionArgs,
      })
      expect(record.description).toContain('increase DMG by 0.75')
      expect(record.resolvedArgs.Arg2.formattedTotalValue).toBe('0.75')
      expect(record.orderedArgEntries.find((entry) => entry.key === 'Arg2')?.progression).toBe(
        '0.75 (+0.05/Lv)',
      )
      expect(record.orderedArgEntries.find((entry) => entry.key === 'Arg2')?.hover).toContain(
        'Lv3: 0.85',
      )
    }
  })

  it('supports arg channel fallback and token channel precedence without changing formula/count ceilings', () => {
    const arg = {...args.Arg3, channel: 'Float'}
    expect(resolveDescriptionArg(arg, {stats: {RealmMastery: '101'}}).formattedTotalValue).toBe(
      '1.005%',
    )
    expect(
      resolveDescriptionTemplate(
        '[{Float}:Arg3] [Energy:Arg3]',
        {Arg3: arg},
        {stats: {RealmMastery: '101'}},
      ),
    ).toBe('1.005% 2%')
    expect(
      resolveDescriptionArg(args.Arg3, {stats: {RealmMastery: '101'}}).formattedTotalValue,
    ).toBe('2%')
    expect(
      resolveDescriptionArg(
        {kind: 'fixed', value: '0.75', suffix: '%', stat: 'ATK'},
        {channel: 'Float', stats: {ATK: '101'}},
      ).absoluteValue,
    ).toBe(1)
    const computed = publicDescriptionArgSchema.parse({
      kind: 'computed',
      formulaKey: 'realmMasteryLinear',
      baseValue: 0.5,
      perPoint: 0.005,
      inputs: ['realmMasteryFinal'],
      suffix: '%',
    })
    const context = {channel: 'Float', formulaContext: {realmMasteryFinal: 101}}
    expect(resolveDescriptionArg(computed, context).formattedTotalValue).toBe('1.005%')
    expect(buildDescriptionArgHover(computed, context)).toContain('Per Realm Mastery: +0.005%')
    expect(
      resolveDescriptionArg(
        publicDescriptionArgSchema.parse({...computed, rounding: 'ceil'}),
        context,
      ).formattedTotalValue,
    ).toBe('2%')
  })

  it('preserves analogous literal percentage scaling and suppresses arithmetic noise', () => {
    const segment = {type: 'scaling' as const, values: [0.75, 0.8, 0.85], suffix: '%', stat: null}
    expect(formatRichScalingRange(segment)).toBe('0.75% (+0.05%/Lv)')
    expect(buildRichScalingHover(segment, null)).toBe('Lv1: 0.75%\nLv2: 0.8%\nLv3: 0.85%')
    expect(computeRichScalingStatValue(0.75, '%', 'ATK', null)).toBeNull()
    expect(fmtNum(0.1 + 0.2, true)).toBe('0.3')
    expect(fmtNum(1.005, true)).toBe('1.005')
    expect(fmtNum(0.75)).toBe('0.8')
  })
})
