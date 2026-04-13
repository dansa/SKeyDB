import fs from 'node:fs/promises'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')

const awakenersLitePath = path.join(repoRoot, 'src', 'data', 'awakeners-lite.json')
const awakenersFullPath = path.join(repoRoot, 'src', 'data', 'awakeners-full.json')

const FULL_STAT_KEYS = [
  'CON',
  'ATK',
  'DEF',
  'CritRate',
  'CritDamage',
  'AliemusRegen',
  'KeyflareRegen',
  'RealmMastery',
  'SigilYield',
  'DamageAmplification',
  'DeathResistance',
  'BaseAliemus',
]
const CARD_KEYS = ['C1', 'C2', 'C3', 'C4', 'C5']
const TALENT_KEYS = ['T1', 'T2', 'T3', 'T4']
const ENLIGHTEN_KEYS = ['E1', 'E2', 'E3', 'E15']
const DEFAULT_SECONDARY_STATS = {
  CritRate: '5%',
  CritDamage: '50%',
  AliemusRegen: '0',
  KeyflareRegen: '15',
  RealmMastery: '0',
  SigilYield: '0%',
  DamageAmplification: '0%',
  DeathResistance: '0%',
  BaseAliemus: '100',
}

function toStringStat(value, fallback = '0') {
  if (value === null || value === undefined) {
    return fallback
  }
  return String(value)
}

function createPlaceholderEntries(keys) {
  return Object.fromEntries(
    keys
      .map((key) => [
        key,
        {
          name: 'TBD',
          cost: key.startsWith('C') ? '0' : undefined,
          description: 'TBD',
        },
      ])
      .map(([key, value]) =>
        value.cost === undefined
          ? [key, {name: value.name, description: value.description}]
          : [key, value],
      ),
  )
}

function createDefaultStatScaling() {
  return {
    CON: 0,
    ATK: 0,
    DEF: 0,
  }
}

function createDefaultPrimaryScalingBase() {
  return 20
}

function mergeSectionWithTemplate(existingSection, templateSection) {
  return {
    ...templateSection,
    ...(existingSection ?? {}),
  }
}

function createSkeletonFromLite(liteAwakener) {
  const cardsTemplate = createPlaceholderEntries(CARD_KEYS)
  const talentsTemplate = createPlaceholderEntries(TALENT_KEYS)
  const enlightensTemplate = createPlaceholderEntries(ENLIGHTEN_KEYS)

  return {
    id: liteAwakener.id,
    name: liteAwakener.name,
    ingameId: liteAwakener.ingameId,
    stats: {
      CON: toStringStat(liteAwakener.stats?.CON),
      ATK: toStringStat(liteAwakener.stats?.ATK),
      DEF: toStringStat(liteAwakener.stats?.DEF),
      ...DEFAULT_SECONDARY_STATS,
    },
    primaryScalingBase: createDefaultPrimaryScalingBase(),
    statScaling: createDefaultStatScaling(),
    substatScaling: {},
    cards: cardsTemplate,
    exalts: {
      exalt: {
        name: 'TBD',
        description: 'TBD',
      },
      over_exalt: {
        name: 'TBD',
        description: 'TBD',
      },
    },
    talents: talentsTemplate,
    enlightens: enlightensTemplate,
  }
}

function mergeLiteIntoFull(liteAwakener, fullAwakener) {
  const cardsTemplate = createPlaceholderEntries(CARD_KEYS)
  const talentsTemplate = createPlaceholderEntries(TALENT_KEYS)
  const enlightensTemplate = createPlaceholderEntries(ENLIGHTEN_KEYS)

  const fullAwakenerWithoutLiteOwnedFields = {...fullAwakener}
  delete fullAwakenerWithoutLiteOwnedFields.aliases
  delete fullAwakenerWithoutLiteOwnedFields.faction
  delete fullAwakenerWithoutLiteOwnedFields.realm
  delete fullAwakenerWithoutLiteOwnedFields.rarity
  delete fullAwakenerWithoutLiteOwnedFields.type
  delete fullAwakenerWithoutLiteOwnedFields.tags

  const next = {
    ...fullAwakenerWithoutLiteOwnedFields,
    id: liteAwakener.id,
    name: liteAwakener.name,
    ingameId: liteAwakener.ingameId ?? fullAwakener.ingameId,
  }

  const mergedStats = {...(fullAwakener.stats ?? {})}
  for (const key of FULL_STAT_KEYS) {
    if (key === 'CON' || key === 'ATK' || key === 'DEF') {
      mergedStats[key] = toStringStat(liteAwakener.stats?.[key], mergedStats[key] ?? '0')
    } else if (mergedStats[key] === undefined) {
      mergedStats[key] = DEFAULT_SECONDARY_STATS[key]
    }
  }

  next.stats = mergedStats
  next.primaryScalingBase = fullAwakener.primaryScalingBase ?? createDefaultPrimaryScalingBase()
  next.statScaling = fullAwakener.statScaling ?? createDefaultStatScaling()
  next.substatScaling = fullAwakener.substatScaling ?? {}
  next.cards = mergeSectionWithTemplate(fullAwakener.cards, cardsTemplate)
  next.exalts = fullAwakener.exalts ?? {
    exalt: {name: 'TBD', description: 'TBD'},
    over_exalt: {name: 'TBD', description: 'TBD'},
  }
  next.talents = mergeSectionWithTemplate(fullAwakener.talents, talentsTemplate)
  next.enlightens = mergeSectionWithTemplate(fullAwakener.enlightens, enlightensTemplate)

  return next
}

async function main() {
  const liteAwakeners = JSON.parse(await fs.readFile(awakenersLitePath, 'utf8'))
  const fullAwakeners = JSON.parse(await fs.readFile(awakenersFullPath, 'utf8'))

  const fullById = new Map(fullAwakeners.map((awakener) => [awakener.id, awakener]))

  const merged = []
  const addedIds = []
  for (const liteAwakener of liteAwakeners) {
    const existing = fullById.get(liteAwakener.id)
    if (existing) {
      merged.push(mergeLiteIntoFull(liteAwakener, existing))
      continue
    }
    merged.push(createSkeletonFromLite(liteAwakener))
    addedIds.push(liteAwakener.id)
  }

  await fs.writeFile(awakenersFullPath, `${JSON.stringify(merged, null, 2)}\n`)

  console.log(`Synced awakeners full data from lite source. Total entries: ${merged.length}.`)
  if (addedIds.length > 0) {
    console.log(`Added full skeletons for ids: ${addedIds.join(', ')}`)
  } else {
    console.log('No new full skeletons were required.')
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
