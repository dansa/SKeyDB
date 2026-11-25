import {expect, it} from 'vitest'

import {getPublicAwakenerCatalogRecords} from '@/data-access/public-data/catalogScopes/awakenersCatalog'

import {
  getDefaultAwakenerDatabaseSelection,
  resolveAwakenerDatabaseState,
} from './awakener-database-state'
import {resolveAwakenerFormSkillGroups} from './awakeners-database-view'
import {resolveDatabaseOverlay, resolveDatabaseReferenceInfo} from './database-reference-info'
import {parseDatabaseRichDescription} from './database-rich-text'
import {getPosseBadgeAssetById, getPosseFullArtAssetById} from './posse-assets'
import {loadPublicAwakenerDetailById} from './public-detail-record-adapters'

it('loads Theophany inside the Godking record without adding a second catalog entry', async () => {
  const catalog = getPublicAwakenerCatalogRecords()
  expect(catalog.some(({name}) => name === 'Tulu')).toBe(true)
  expect(catalog.filter(({name}) => name === 'Tulu: Godking')).toHaveLength(1)
  expect(catalog.some(({name}) => name === 'Tulu: Theophany')).toBe(false)

  const godking = await loadPublicAwakenerDetailById('awakener-0063')
  const form = godking?.forms?.alternatives[0]
  expect(godking?.cards.C1.displayName).toBe('Axis Mundis')
  expect(form?.skillGroups.find(({key}) => key === 'runes')?.entries).toHaveLength(7)
  const scutum = form?.skillGroups
    .find(({key}) => key === 'asterisms')
    ?.entries.find(({key}) => key === 'scutum')
  expect(scutum?.descriptionTemplate).toContain("enemies' {STR} by [Exhaustion:Arg2]")
  expect(scutum?.descriptionArgs.Arg2).toMatchObject({
    stat: 'DEF',
    values: ['9', '10.8', '12.6', '14.4', '16.2', '18'],
  })
  const morimens = form?.skillGroups.find(({key}) => key === 'departure')?.entries[0]
  expect(morimens?.upgrade?.slot).toBe('E3')
  expect(morimens?.upgrade?.descriptionArgs.Arg1).toMatchObject({
    values: ['12000', '14400', '16800', '19200', '21600', '24000'],
  })
})

it('uses the selected stats and shared upgrades for both form kits', async () => {
  const godking = await loadPublicAwakenerDetailById('awakener-0063')
  const form = godking?.forms?.alternatives[0]
  if (!godking || !form) throw new Error('Missing Godking preview')

  const {shellView, referenceLayer} = resolveAwakenerDatabaseState(godking, {
    ...getDefaultAwakenerDatabaseSelection(),
    skillLevel: 6,
    selectedEnlightenSlot: 'AbsoluteAxiom',
    soulforgeLevel: 10,
  })
  const decree = shellView.commandCards.find(
    ({record}) => record.displayName === 'Great Old Decree',
  )
  expect(decree?.resolved.description).toContain('\n{Resonance 3}')
  expect(decree?.resolved.description).toContain('15 percentage points')
  expect(decree?.influencingEnlightenSlots).toContain('E2')
  expect(shellView.commandCards.find(({key}) => key === 'C1')?.resolved.description).toContain(
    '100% Base Aliemus',
  )

  const groups = resolveAwakenerFormSkillGroups(form, shellView)
  const scutum = groups.flatMap(({entries}) => entries).find(({label}) => label === 'Scutum')
  expect(scutum?.resolved.resolvedArgs.Arg1.absoluteValue).toBeGreaterThan(0)
  expect(scutum?.resolved.resolvedArgs.Arg2.absoluteValue).toBeGreaterThan(0)
  const morimens = groups.flatMap(({entries}) => entries).find(({label}) => label === 'Morimens')
  expect(morimens?.influencingEnlightenSlots).toEqual(['E3'])
  expect(morimens?.resolved.description).toContain('{Fainted}')
  expect(morimens?.resolved.description).not.toContain('Aliemus')

  const morimensLink = resolveDatabaseReferenceInfo(referenceLayer, 'Morimens')
  expect(morimensLink?.id).toBe(morimens?.record.id)
  expect(morimensLink?.description).toBe(morimens?.resolved.description)
  expect(
    parseDatabaseRichDescription({record: godking.enlightens.E3, referenceLayer}),
  ).toContainEqual({type: 'skill', name: 'Morimens'})

  const asterismsLink = resolveDatabaseReferenceInfo(referenceLayer, 'Orbits')
  expect(asterismsLink?.name).toBe('Asterisms')
  expect(asterismsLink?.record).toMatchObject({
    nodeKind: 'group',
    childDerivedSkillIds: expect.arrayContaining([scutum?.record.id]),
  })
  expect(resolveDatabaseReferenceInfo(referenceLayer, 'Rune')?.name).toBe('Runes')
  expect(resolveDatabaseReferenceInfo(referenceLayer, 'Tulu: Theophany')?.name).toBe('Theophany')
  expect(resolveDatabaseReferenceInfo(referenceLayer, 'Brilliance')?.description).toContain(
    'The number on an Asterism, I to V.',
  )
  const surgeLink = resolveDatabaseReferenceInfo(referenceLayer, 'Stars Surge')
  expect(surgeLink?.description).toContain('As Theophany:')
  expect(surgeLink?.description).toContain('After {Morimens}: a random six-hit Surge')
  const surge = groups.find(({id}) => id === 'skills-theophany-surge')
  expect(surge?.entries.find(({label}) => label === 'Extra hits')?.resolved.description).toContain(
    '3–15 hits',
  )
  const perHit = surge?.entries.find(({key}) => key === 'theophany-surge-per-hit')
  expect(perHit?.resolved.description).toContain("team's {Tentacle DMG} stat")
  expect(perHit?.resolved.resolvedArgs.Arg3.absoluteValue).toBeGreaterThan(0)

  expect(resolveDatabaseOverlay(referenceLayer, 'Etched Memory')?.iconId).toBe('IconS_Buff_099')
  expect(resolveDatabaseOverlay(referenceLayer, 'Erosion')).toMatchObject({displayName: 'Erosion'})
  expect(resolveDatabaseOverlay(referenceLayer, 'Erosion')?.iconId).toBeUndefined()
  expect(resolveDatabaseOverlay(referenceLayer, 'Vulnerable')?.iconId).toBe('IconS_Buff_003')
  expect(resolveDatabaseOverlay(referenceLayer, 'Weakness')?.iconId).toBe('IconS_Buff_005')
  expect(resolveDatabaseOverlay(referenceLayer, 'Fainted')?.iconId).toBe('IconS_Buff_023')
})

it('uses the published placeholder crystal and the announced Unfallen Throne badge', () => {
  expect(getPosseFullArtAssetById('posse-0065')).toContain('KeyToken_Crystal_00.webp')
  expect(getPosseBadgeAssetById('posse-0065')).toContain('KeyToken_Props_60.webp')
})
