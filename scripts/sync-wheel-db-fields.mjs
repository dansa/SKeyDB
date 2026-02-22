import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')

const wheelsDbPath = path.join(repoRoot, 'untracked', 'wheelsDB.html')
const wheelsDataPath = path.join(repoRoot, 'src', 'data', 'wheels-lite.json')
const mainstatsPath = path.join(repoRoot, 'src', 'data', 'mainstats.json')
const awakenersPath = path.join(repoRoot, 'src', 'data', 'awakeners-lite.json')

function normalizeToken(value) {
  return value.trim().toLowerCase()
}

function decodeHtmlEntities(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

function buildMainstatMap(mainstats) {
  const byKey = new Set(mainstats.map((mainstat) => mainstat.key))
  const map = new Map()
  if (byKey.has('CRIT_RATE')) map.set('crit_rate', 'CRIT_RATE')
  if (byKey.has('CRIT_DMG')) map.set('crit_damage', 'CRIT_DMG')
  if (byKey.has('REALM_MASTERY')) map.set('realm_mastery', 'REALM_MASTERY')
  if (byKey.has('DMG_AMP')) map.set('damage_amp', 'DMG_AMP')
  if (byKey.has('ALIEMUS_REGEN')) {
    map.set('aliemus_regen_level', 'ALIEMUS_REGEN')
    map.set('aliemus_recharge', 'ALIEMUS_REGEN')
  }
  if (byKey.has('KEYFLARE_REGEN')) {
    map.set('keyflare_regen_level', 'KEYFLARE_REGEN')
    map.set('silver_key_recharge', 'KEYFLARE_REGEN')
  }
  if (byKey.has('SIGIL_YIELD')) map.set('sigil_yield', 'SIGIL_YIELD')
  if (byKey.has('DEATH_RESISTANCE')) map.set('death_resistance', 'DEATH_RESISTANCE')
  if (byKey.has('ATK')) map.set('attack', 'ATK')
  if (byKey.has('DEF')) map.set('defense', 'DEF')
  if (byKey.has('CON')) map.set('constitution', 'CON')
  return map
}

function buildAwakenerMap(awakeners) {
  return new Map(awakeners.map((awakener) => [normalizeToken(awakener.name), awakener.name]))
}

function normalizeAwakenerName(value, canonicalAwakeners) {
  const normalized = normalizeToken(value)
  if (!normalized) {
    return ''
  }
  return canonicalAwakeners.get(normalized) ?? null
}

function parseWheelCards(html, mainstatByAttributeType) {
  const segments = html.split(/<div class="col-12 col-md-6 morimens-wheel-card\b/g).slice(1)
  const result = new Map()

  for (const segment of segments) {
    const attributeTypeMatch = segment.match(/data-attribute-type="([^"]+)"/i)
    const wheelIdMatch = segment.match(/Weapon_Full_([A-Z0-9]+(?:EX)?)\.png/i)
    if (!attributeTypeMatch || !wheelIdMatch) {
      continue
    }

    const wheelId = wheelIdMatch[1].toUpperCase()
    const attributeType = normalizeToken(attributeTypeMatch[1])
    const mainstatKey = mainstatByAttributeType.get(attributeType) ?? ''
    const awakenerMatch = segment.match(/<div class="char-name">([^<]+)<\/div>/i)
    const awakener = awakenerMatch ? decodeHtmlEntities(awakenerMatch[1].trim()) : ''

    result.set(wheelId, {
      mainstatKey,
      awakener,
    })
  }

  return result
}

async function main() {
  const [dbHtmlRaw, wheelsRaw, mainstatsRaw, awakenersRaw] = await Promise.all([
    fs.readFile(wheelsDbPath, 'utf8'),
    fs.readFile(wheelsDataPath, 'utf8'),
    fs.readFile(mainstatsPath, 'utf8'),
    fs.readFile(awakenersPath, 'utf8'),
  ])
  const wheels = JSON.parse(wheelsRaw)
  const mainstats = JSON.parse(mainstatsRaw)
  const awakeners = JSON.parse(awakenersRaw)
  const mainstatByAttributeType = buildMainstatMap(mainstats)
  const canonicalAwakeners = buildAwakenerMap(awakeners)
  const parsedById = parseWheelCards(dbHtmlRaw, mainstatByAttributeType)

  let updatedCount = 0
  const missingInDb = []
  const unknownAwakeners = new Set()

  const nextWheels = wheels.map((wheel) => {
    const parsed = parsedById.get(String(wheel.id).toUpperCase())
    const normalizedCurrentAwakener = normalizeAwakenerName(wheel.awakener ?? '', canonicalAwakeners)
    if (!parsed) {
      missingInDb.push(wheel.id)
      return {
        ...wheel,
        awakener: normalizedCurrentAwakener ?? wheel.awakener ?? '',
      }
    }

    const canonicalAwakenerFromDb = normalizeAwakenerName(parsed.awakener, canonicalAwakeners)
    if (parsed.awakener && !canonicalAwakenerFromDb) {
      unknownAwakeners.add(parsed.awakener)
    }

    const nextWheel = {
      ...wheel,
      mainstatKey: parsed.mainstatKey || wheel.mainstatKey || '',
      awakener: canonicalAwakenerFromDb ?? normalizedCurrentAwakener ?? parsed.awakener ?? '',
    }

    if (nextWheel.mainstatKey !== wheel.mainstatKey || nextWheel.awakener !== wheel.awakener) {
      updatedCount += 1
    }
    return nextWheel
  })

  await fs.writeFile(wheelsDataPath, `${JSON.stringify(nextWheels, null, 2)}\n`)

  console.log(`Updated ${updatedCount} wheels from wheelsDB.`)
  if (missingInDb.length > 0) {
    console.log(`Missing ${missingInDb.length} IDs in wheelsDB: ${missingInDb.join(', ')}`)
  }
  if (unknownAwakeners.size > 0) {
    console.log(`Unknown awakener names from wheelsDB: ${Array.from(unknownAwakeners).join(', ')}`)
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
