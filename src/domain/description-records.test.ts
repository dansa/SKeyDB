import {describe, expect, it} from 'vitest'

import {loadPublicRecord} from '@/data-access/public-data/repository'

import type {AwakenerSkillRecord} from './awakener-source-schema'
import {resolveAwakenerFullRecord} from './awakeners-full-resolver'
import {resolveDescribedRecord} from './description-records'
import {loadPublicAwakenerDetailById} from './public-detail-record-adapters'
import {
  adaptPublicV3DerivedSkillRecord,
  adaptPublicV3EnlightenRecord,
  adaptPublicV3OverlayRecord,
  adaptPublicV3TalentRecord,
} from './public-v3-awakener-record-adapters'

async function loadResolvedSkill(
  awakenerId: number,
  skillId: string,
): Promise<AwakenerSkillRecord> {
  const record = await loadPublicAwakenerDetailById(awakenerId)
  if (!record) {
    throw new Error(`Missing awakener ${String(awakenerId)}`)
  }

  const resolvedRecord = resolveAwakenerFullRecord(record).record
  const cards = [
    resolvedRecord.cards.C1,
    resolvedRecord.cards.C2,
    resolvedRecord.cards.C3,
    resolvedRecord.cards.C4,
    resolvedRecord.cards.C5,
    resolvedRecord.cards.Exalt,
    ...(resolvedRecord.cards.OverExalt ? [resolvedRecord.cards.OverExalt] : []),
  ]
  const skill = cards.find((entry) => entry.id === skillId)
  if (!skill) {
    throw new Error(`Missing resolved skill ${skillId}`)
  }

  return skill
}

describe('description-records', () => {
  it('resolves a skill description and its base-scaled substat enhancement from public V3 data', async () => {
    const skill = await loadResolvedSkill(52, 'skill.wanda.necropolis-of-dreams')

    const resolved = resolveDescribedRecord(
      skill,
      {
        rank: 2,
        stats: {
          CON: '120',
          ATK: '140',
          DEF: '125',
          CritRate: '10%',
          CritDamage: '50%',
          AliemusRegen: '0',
          KeyflareRegen: '0',
          RealmMastery: '0',
          SigilYield: '0',
          DamageAmplification: '20%',
          DeathResistance: '0',
        },
      },
      {
        maxRank: 6,
        stats: {
          CON: '120',
          ATK: '140',
          DEF: '125',
          CritRate: '10%',
          CritDamage: '50%',
          AliemusRegen: '0',
          KeyflareRegen: '0',
          RealmMastery: '0',
          SigilYield: '0',
          DamageAmplification: '20%',
          DeathResistance: '0',
        },
      },
    )

    expect(resolved.description).toContain(
      'Gain 30% {DEF} Shield and 62.1% {ATK} stacks of {Counter}.',
    )
    expect(resolved.resolvedArgs.Arg2.formattedTotalValue).toBe('62.1% {ATK}')
    expect(resolved.orderedArgEntries.map((entry) => entry.key)).toEqual(['Arg1', 'Arg2'])
    expect(resolved.orderedArgEntries[1].hover).toContain('Lv2: 62.1% ATK = 87')
  })

  it('preserves template appearance order even when arg keys are not stored numerically', async () => {
    const talentRecord = await loadPublicRecord('talents', 'talent.mouchette.soulforge-aptitude')
    if (!talentRecord) {
      throw new Error('Missing talent.mouchette.soulforge-aptitude')
    }
    const talent = adaptPublicV3TalentRecord(talentRecord)

    const resolved = resolveDescribedRecord(talent, {rank: 4}, {maxRank: talent.maxLevel})

    expect(resolved.orderedArgEntries.map((entry) => entry.key)).toEqual([
      'Arg1',
      'Arg2',
      'Arg5',
      'Arg3',
      'Arg4',
    ])
    expect(resolved.description).toContain('Mouchette gains 29 Aliemus.')
    expect(resolved.orderedArgEntries[2]?.progression).toBe('20/23/26/29/32/35/38/41/44/50')
  })

  it('resolves overlays, derived skills, and enlightens through the same described-record path', async () => {
    const overlayRecord = await loadPublicRecord('overlays', 'overlay.hameln.marvelous-debuff')
    const derivedRecord = await loadPublicRecord('derived-skills', 'derived.global.embryo')
    const enlightenRecord = await loadPublicRecord('enlightens', 'enlighten.24.hysteria')

    if (!overlayRecord) {
      throw new Error('Missing overlay.hameln.marvelous-debuff')
    }
    if (!derivedRecord) {
      throw new Error('Missing derived.global.embryo')
    }
    if (!enlightenRecord) {
      throw new Error('Missing enlighten.24.hysteria')
    }
    const overlay = adaptPublicV3OverlayRecord(overlayRecord)
    const derived = adaptPublicV3DerivedSkillRecord(derivedRecord)
    const enlighten = adaptPublicV3EnlightenRecord(enlightenRecord)

    expect(resolveDescribedRecord(overlay).description).toContain('Temp. {STR▼} -13.')
    expect(resolveDescribedRecord(derived).description).toContain(
      'One Awakener gains 30 Aliemus and +10% Crit Rate this turn.',
    )
    expect(resolveDescribedRecord(enlighten).description).toContain(
      '{Frenzied Slash} increases Base DMG by 33%.',
    )
  })
})
