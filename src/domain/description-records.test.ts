import {describe, expect, it} from 'vitest'

import {getAwakenerEnlightenById, getAwakenerEnlightens} from './awakener-enlightens'
import {getAwakenerOverlays, resolveAwakenerOverlay} from './awakener-overlays'
import type {AwakenerSkillRecord} from './awakener-source-schema'
import {getAwakenerTalentById, getAwakenerTalents} from './awakener-talents'
import {resolveAwakenerFullV2Record} from './awakeners-full-v2-resolver'
import {getDerivedSkillById, getDerivedSkills} from './derived-skills'
import {resolveDescribedRecord} from './description-records'
import {loadPublicV2AwakenerFullById} from './public-v2-detail-loaders'

async function loadResolvedSkill(
  awakenerId: number,
  skillId: string,
): Promise<AwakenerSkillRecord> {
  const record = await loadPublicV2AwakenerFullById(awakenerId)
  if (!record) {
    throw new Error(`Missing awakener ${String(awakenerId)}`)
  }

  const resolvedRecord = resolveAwakenerFullV2Record(record).record
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
  it('resolves a skill description and its base-scaled substat enhancement from public V2 data', async () => {
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
      'Gain 30% {DEF} Shield and 41.4% {ATK} stacks of {Counter}.',
    )
    expect(resolved.resolvedArgs.Arg2.formattedTotalValue).toBe('41.4% {ATK}')
    expect(resolved.orderedArgEntries.map((entry) => entry.key)).toEqual(['Arg1', 'Arg2'])
    expect(resolved.orderedArgEntries[1].hover).toContain('Lv2: 41.4% ATK = 58')
  })

  it('preserves template appearance order even when arg keys are not stored numerically', () => {
    const talent = getAwakenerTalentById(
      'talent.mouchette.soulforge-aptitude',
      getAwakenerTalents(),
    )
    if (!talent) {
      throw new Error('Missing talent.mouchette.soulforge-aptitude')
    }

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

  it('resolves overlays, derived skills, and enlightens through the same described-record path', () => {
    const overlay = resolveAwakenerOverlay('Marvelous Debuff', getAwakenerOverlays())
    const derived = getDerivedSkillById('derived.global.embryo', getDerivedSkills())
    const enlighten = getAwakenerEnlightenById('enlighten.24.hysteria', getAwakenerEnlightens())

    if (!overlay) {
      throw new Error('Missing overlay.hameln.marvelous-debuff')
    }
    if (!derived) {
      throw new Error('Missing derived.global.embryo')
    }
    if (!enlighten) {
      throw new Error('Missing enlighten.24.hysteria')
    }

    expect(resolveDescribedRecord(overlay).description).toContain('Temp. {STR⯆} -13.')
    expect(resolveDescribedRecord(derived).description).toContain(
      'One Awakener gains 30 Aliemus and +10% Crit Rate this turn.',
    )
    expect(resolveDescribedRecord(enlighten).description).toContain(
      '{Frenzied Slash} increases Base DMG by 33%.',
    )
  })
})
