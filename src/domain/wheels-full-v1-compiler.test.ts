import {describe, expect, it} from 'vitest'

import awakenerRoster from '@/data/awakeners/awakener-roster.json'
import wheelMainstatScaling from '@/data/wheels/wheel-mainstat-scaling.json'
import wheelSource from '@/data/wheels/wheel-source.json'

import {awakenerRosterSchema} from './awakener-source-schema'
import {wheelMainstatScalingSourceSchema, wheelSourceDatasetSchema} from './wheel-source-schema'
import {compileWheelsFullV1} from './wheels-full-v1-compiler'

const parsedWheelSource = wheelSourceDatasetSchema.parse(wheelSource)
const parsedAwakenerRoster = awakenerRosterSchema.array().parse(awakenerRoster)
const parsedWheelMainstatScaling = wheelMainstatScalingSourceSchema.parse(wheelMainstatScaling)

describe('compileWheelsFullV1', () => {
  it('converts tracked wheel source into normalized full records', () => {
    const compiled = compileWheelsFullV1({
      sourceRecords: parsedWheelSource,
      awakeners: parsedAwakenerRoster,
      mainstatScaling: parsedWheelMainstatScaling,
    })

    expect(compiled).toHaveLength(parsedWheelSource.length)

    const b03 = compiled.find((record) => record.id === 'B03')
    expect(b03?.descriptionTemplate).toContain('{Vulnerable}')
    expect(b03?.descriptionTemplate).toContain('{STR}')
    expect(b03?.descriptionTemplate).toContain('Exalt')
    expect(b03?.descriptionTemplate).not.toContain('{Exalt}')
    expect(b03?.searchTags).toEqual([])
    expect(b03?.descriptionArgs.StateArg1).toMatchObject({
      kind: 'scaling',
      values: ['6', '8', '10', '12'],
    })
  })

  it('keeps wheel-only generic card names out of canonical references', () => {
    const compiled = compileWheelsFullV1({
      sourceRecords: parsedWheelSource,
      awakeners: parsedAwakenerRoster,
      mainstatScaling: parsedWheelMainstatScaling,
    })

    expect(compiled.some((record) => record.descriptionTemplate.includes('{Exalt}'))).toBe(false)
    expect(compiled.some((record) => record.descriptionTemplate.includes('{Strike}'))).toBe(false)
    expect(compiled.some((record) => record.descriptionTemplate.includes('{Defense}'))).toBe(false)
    expect(compiled.every((record) => record.searchTags.length === 0)).toBe(true)
  })

  it('preserves manual wheel text fixes for death resistance, devour, and orisons wording', () => {
    const compiled = compileWheelsFullV1({
      sourceRecords: parsedWheelSource,
      awakeners: parsedAwakenerRoster,
      mainstatScaling: parsedWheelMainstatScaling,
    })

    expect(compiled.find((record) => record.id === 'SR17')?.descriptionTemplate).toContain(
      '{Death Resistance}',
    )
    expect(compiled.find((record) => record.id === 'SR24')?.descriptionTemplate).toContain(
      '{Death Resistance}',
    )
    expect(compiled.find((record) => record.id === 'O10')?.descriptionTemplate).toContain(
      '{Death Resistance}',
    )
    expect(compiled.find((record) => record.id === 'SR25')?.descriptionTemplate).toContain(
      '{Devour}',
    )
    expect(compiled.find((record) => record.id === 'P10')?.descriptionTemplate).toContain('Orisons')
    expect(compiled.find((record) => record.id === 'P10')?.descriptionTemplate).not.toContain(
      '{Painted Orisons}',
    )
  })

  it('keeps constant wheel args as fixed canonical args in tracked source', () => {
    const compiled = compileWheelsFullV1({
      sourceRecords: parsedWheelSource,
      awakeners: parsedAwakenerRoster,
      mainstatScaling: parsedWheelMainstatScaling,
    })

    expect(compiled.find((record) => record.id === 'C06')?.descriptionArgs.StateArg1).toMatchObject(
      {
        kind: 'fixed',
        value: '60',
      },
    )
  })

  it('assigns the special N wheel mainstat series bucket', () => {
    const compiled = compileWheelsFullV1({
      sourceRecords: parsedWheelSource,
      awakeners: parsedAwakenerRoster,
      mainstatScaling: parsedWheelMainstatScaling,
    })

    expect(compiled.find((record) => record.id === 'N01')?.mainstatSeriesKey).toBe(
      'N:KEYFLARE_REGEN',
    )
    expect(compiled.find((record) => record.id === 'N02')?.mainstatSeriesKey).toBe(
      'N:KEYFLARE_REGEN',
    )
  })
})
