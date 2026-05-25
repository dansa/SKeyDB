import {describe, expect, it} from 'vitest'

import {
  getCurrentDzoneSeasonSummary,
  getDzoneEnemyCharacteristicById,
  getDzoneMonsterById,
  getDzoneMonsters,
  getDzoneSeasonAlertOptions,
  getDzoneSeasonSharedInitialRelicIds,
  getDzoneSeasonSummaries,
  getLatestDzoneSeasonSummary,
  loadCurrentDzoneSeason,
  loadDzoneSeasonById,
  loadDzoneSeasons,
  loadLatestDzoneSeason,
  loadLatestDzoneWaveViewModels,
  resolveDzoneWaveViewModel,
} from './dzone'
import {getDzoneSeasonRealmName} from './dzone-season-realm'
import {loadRelicRecordById} from './relics'

describe('D-zone domain boundary', () => {
  it('loads all D-zone summary records and full season archives', async () => {
    expect(getDzoneSeasonSummaries()).toHaveLength(61)
    expect(await loadDzoneSeasons()).toHaveLength(61)
    expect(getLatestDzoneSeasonSummary()).toMatchObject({
      id: 'dzone-0061',
      period: 61,
      realm: 'CARO',
      stageEffect: 'Astral Reign',
    })
    expect(await loadDzoneSeasonById('dzone-0001')).toMatchObject({
      id: 'dzone-0001',
      period: 1,
      stageEffect: 'Faded Legacy',
    })
  })

  it('loads the latest season as dzone-0061 with 5 resolved waves', async () => {
    const latestSeason = await loadLatestDzoneSeason()

    expect((await loadDzoneSeasons()).length).toBeGreaterThan(0)
    expect(latestSeason.id).toBe('dzone-0061')
    expect(latestSeason.waves).toHaveLength(5)
    expect(await loadLatestDzoneWaveViewModels()).toHaveLength(5)
  })

  it('preserves per-alert monster stats from season archives', async () => {
    const [waveOne] = (await loadLatestDzoneSeason()).waves

    expect(waveOne.alerts.map((alert) => alert.name)).toEqual([
      'Alert I',
      'Alert II',
      'Alert III',
      'Alert IV',
      'Alert V',
    ])
    expect(waveOne.alerts[0]?.monsters[0]).toMatchObject({
      monsterId: 'dzone-monster-0270',
      level: 38,
      hp: 10736,
      hpBars: 2,
    })
  })

  it('resolves selected alert stats onto alert wave monsters', async () => {
    const [waveOne] = await loadLatestDzoneWaveViewModels()
    const alertFourBoss = waveOne.alerts
      .find((alert) => alert.id === 'alert-4')
      ?.monsters.find((monster) => monster.id === 'dzone-monster-0270')

    expect(alertFourBoss).toMatchObject({
      id: 'dzone-monster-0270',
      alertStats: {
        alertId: 'alert-4',
        alertName: 'Alert IV',
        level: 73,
        hp: 175384,
        hpBars: 2,
      },
    })
  })

  it('uses season-scoped monster display snapshots when source ids are reused', async () => {
    const season = await loadDzoneSeasonById('dzone-0060')
    const waveModels = season?.waves.map(resolveDzoneWaveViewModel)
    const countess = waveModels?.[1]?.alerts[0]?.monsters.find(
      (monster) => monster.id === 'dzone-monster-0313',
    )
    const globalMonster = getDzoneMonsterById('dzone-monster-0313')

    expect(globalMonster).toMatchObject({
      id: 'dzone-monster-0313',
      name: 'The poet',
      characteristicIds: ['enemy-characteristic-0011', 'enemy-characteristic-0007'],
    })
    expect(countess).toMatchObject({
      id: 'dzone-monster-0313',
      name: 'Countess',
      badges: ['Elite'],
      characteristicIds: ['enemy-characteristic-0011', 'enemy-characteristic-0007'],
      descriptionTemplate:
        '"Dearest Countess, my once desire. Now, you have become my loyal guard. Offer her a poem on my behalf."',
    })
    expect(countess?.characteristics.map((characteristic) => characteristic.id)).toEqual([
      'enemy-characteristic-0011',
      'enemy-characteristic-0007',
    ])
  })

  it('loads dzone-0060 as the current season during its active window', () => {
    expect(getCurrentDzoneSeasonSummary(new Date('2026-05-12T12:00:00Z'))?.id).toBe('dzone-0060')
  })

  it('loads the active season archive on demand', async () => {
    await expect(loadCurrentDzoneSeason(new Date('2026-05-12T12:00:00Z'))).resolves.toMatchObject({
      id: 'dzone-0060',
      waves: expect.any(Array),
    })
  })

  it('resolves every wave monster reference', async () => {
    for (const season of await loadDzoneSeasons()) {
      for (const wave of season.waves) {
        for (const monsterId of wave.monsterIds) {
          expect(getDzoneMonsterById(monsterId), `${wave.id} monster ${monsterId}`).toBeDefined()
        }
        for (const alert of wave.alerts) {
          expect(
            alert.monsters.map((monster) => monster.monsterId),
            `${season.id} ${wave.id} ${alert.id}`,
          ).toEqual(wave.monsterIds)
          for (const monster of alert.monsters) {
            expect(
              getDzoneMonsterById(monster.monsterId),
              `${wave.id} ${alert.id} monster ${monster.monsterId}`,
            ).toBeDefined()
          }
        }
      }
    }
  })

  it('keeps alert options consistent across every wave in a season', async () => {
    for (const season of await loadDzoneSeasons()) {
      const seasonAlertOptions = getDzoneSeasonAlertOptions(season)
      const alertIds = seasonAlertOptions.map((alert) => alert.id)

      expect(new Set(alertIds).size, `${season.id} unique alert ids`).toBe(alertIds.length)

      for (const wave of season.waves) {
        expect(
          wave.alerts.map((alert) => ({id: alert.id, name: alert.name})),
          `${season.id} ${wave.id} alert set`,
        ).toEqual(seasonAlertOptions)
      }
    }
  })

  it('resolves every monster characteristic reference', () => {
    for (const monster of getDzoneMonsters()) {
      for (const characteristicId of monster.characteristicIds) {
        expect(
          getDzoneEnemyCharacteristicById(characteristicId),
          `${monster.id} characteristic ${characteristicId}`,
        ).toBeDefined()
      }
    }
  })

  it('loads every monster with a description template', () => {
    for (const monster of getDzoneMonsters()) {
      expect(monster.descriptionTemplate.trim(), monster.id).not.toBe('')
    }
  })

  it('preserves initial relic ids without resolving relic records', async () => {
    expect((await loadLatestDzoneWaveViewModels())[0]?.initialRelicIds).toEqual([
      'relic-9102',
      'relic-9041',
    ])
  })

  it('identifies the latest season-wide initial relic used by every wave', async () => {
    const latestSeason = await loadLatestDzoneSeason()
    const sharedInitialRelicIds = getDzoneSeasonSharedInitialRelicIds(latestSeason)

    expect(
      latestSeason.waves.every((wave) => wave.initialRelicIds.includes(sharedInitialRelicIds[0])),
    ).toBe(true)
    expect(getDzoneSeasonSharedInitialRelicIds(latestSeason)).toEqual(['relic-9041'])
  })

  it('resolves modern season realms and falls back for legacy seasons', async () => {
    const latestSeason = await loadLatestDzoneSeason()
    const legacySeason = await loadDzoneSeasonById('dzone-0001')

    if (!legacySeason) {
      throw new Error('Expected dzone-0001 to be loaded')
    }

    expect(getDzoneSeasonRealmName(latestSeason)).toBe('Caro Ring')
    expect(getDzoneSeasonRealmName(legacySeason)).toBe('Dissoluted Abyss')
  })

  it('preserves wave monster ids as the authoritative display order', async () => {
    const latestSeason = await loadLatestDzoneSeason()
    const resolvedWaves = await loadLatestDzoneWaveViewModels()

    for (const [index, wave] of latestSeason.waves.entries()) {
      expect(
        resolvedWaves[index]?.monsters.map((monster) => monster.id),
        wave.id,
      ).toEqual(wave.monsterIds)
    }
  })

  it('resolves every initial relic to a public relic detail record', async () => {
    const relicIds = new Set(
      (await loadDzoneSeasons()).flatMap((season) =>
        season.waves.flatMap((wave) => wave.initialRelicIds),
      ),
    )

    for (const relicId of relicIds) {
      await expect(loadRelicRecordById(relicId), relicId).resolves.toMatchObject({
        id: relicId,
        kind: 'relic',
        relicType: 'D-Zone Initial Relic',
      })
    }
  })
})
