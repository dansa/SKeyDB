import fs from 'fs'

const awakenersFull = JSON.parse(fs.readFileSync('src/data/awakeners-full.json', 'utf8'))
const existingTags = JSON.parse(fs.readFileSync('src/data/tags.json', 'utf8'))

const KNOWN_STATS = new Set([
  'ATK', 'DEF', 'CON', 'HP', 'Crit Rate', 'Crit DMG',
  'STR', 'Aliemus Regen', 'Keyflare Regen', 'Sigil Yield',
  'DMG Amplification', 'Death Resistance', 'Tentacle DMG',
])

const allSkillNames = new Set()
for (const aw of awakenersFull) {
  if (aw.cards) for (const c of Object.values(aw.cards)) if (c?.name) {
    const clean = c.name.replace(/^Rouse:\s*/, '')
    allSkillNames.add(clean)
    allSkillNames.add(c.name)
  }
  if (aw.talents) for (const t of Object.values(aw.talents)) if (t?.name) {
    const clean = t.name.replace(/^Innate:\s*/, '')
    allSkillNames.add(clean)
    allSkillNames.add(t.name)
  }
  if (aw.enlightens) for (const e of Object.values(aw.enlightens)) if (e?.name) allSkillNames.add(e.name)
  if (aw.exalts) for (const e of Object.values(aw.exalts)) if (e?.name) allSkillNames.add(e.name)
}
allSkillNames.delete('None')

const tokenRe = /\{([^}]+)\}/g
const mechanicTokens = new Map()
const skillRefs = new Set()
const statRefs = new Set()

function scan(desc) {
  if (!desc) return
  for (const m of desc.matchAll(tokenRe)) {
    const t = m[1].trim()
    if (t.includes('{') || t.length > 60) continue
    if (KNOWN_STATS.has(t)) { statRefs.add(t); continue }
    if (allSkillNames.has(t)) { skillRefs.add(t); continue }
    mechanicTokens.set(t, (mechanicTokens.get(t) || 0) + 1)
  }
}

for (const aw of awakenersFull) {
  if (aw.cards) for (const c of Object.values(aw.cards)) scan(c?.description)
  if (aw.talents) for (const t of Object.values(aw.talents)) scan(t?.description)
  if (aw.enlightens) for (const e of Object.values(aw.enlightens)) scan(e?.description)
  if (aw.exalts) for (const e of Object.values(aw.exalts)) scan(e?.description)
}

const existingLabels = new Set(existingTags.map(t => t.label))

const newMechanics = [...mechanicTokens.entries()]
  .filter(([label]) => !existingLabels.has(label))
  .sort((a, b) => a[0].localeCompare(b[0]))

console.log('=== Classification Results ===')
console.log('Skill/talent/enlighten/exalt name refs:', skillRefs.size)
console.log('Stat refs:', statRefs.size)
console.log('Mechanic tokens (total unique):', mechanicTokens.size)
console.log('Already in tags.json:', mechanicTokens.size - newMechanics.length)
console.log('New mechanics to add:', newMechanics.length)
console.log()

console.log('=== Skill Name Refs (will become popovers) ===')
;[...skillRefs].sort().forEach(s => console.log('  ', s))
console.log()

console.log('=== New Mechanic Tags ===')
newMechanics.forEach(([label, count]) => console.log(`  ${label} (${count}x)`))
console.log()

const toKey = (label) => label.toUpperCase().replace(/['']/g, '').replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, '')

const newEntries = newMechanics.map(([label]) => ({
  key: toKey(label),
  label,
  description: '',
  iconId: '',
  aliases: []
}))

const addDesc = (tags) => tags.map(t => t.description !== undefined ? t : { ...t, description: '' })

const merged = [...addDesc(existingTags), ...newEntries]
  .sort((a, b) => a.label.localeCompare(b.label))

if (process.argv.includes('--write')) {
  fs.writeFileSync('src/data/tags.json', JSON.stringify(merged, null, 2) + '\n')
  console.log(`Wrote ${merged.length} tags to src/data/tags.json`)
} else {
  console.log(`Total merged tags: ${merged.length} (run with --write to save)`)
}
