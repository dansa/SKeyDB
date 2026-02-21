import { z } from 'zod'
import awakenersLite from '../data/awakeners-lite.json'

const rawAwakenersSchema = z.array(
  z.object({
    id: z.number().int().positive(),
    name: z.string().trim().min(1),
    faction: z.string().trim().min(1),
  }),
)

const canonicalNameBySource: Record<string, string> = {
  'g-ramona': 'ramona: timeworn',
  'g-doll': 'doll: inferno',
  'g-helot': 'helot: catena',
  'g-murphy': 'murphy: fauxborn',
  'twenty-four': '24',
}

const aliasesByCanonicalName: Record<string, string[]> = {
  'ramona: timeworn': ['g-ramona', 'g ramona', 'gramona'],
  'doll: inferno': ['g-doll', 'g doll', 'gdoll'],
  'helot: catena': ['g-helot', 'g helot', 'ghelot'],
  'murphy: fauxborn': ['g-murphy', 'g murphy', 'gmurphy'],
  '24': ['twenty-four'],
}

export type Awakener = {
  id: number
  name: string
  faction: string
  aliases: string[]
}

const parsedAwakeners = rawAwakenersSchema.parse(awakenersLite).map((awakener): Awakener => {
  const canonicalName = canonicalNameBySource[awakener.name] ?? awakener.name
  const aliases = Array.from(
    new Set([awakener.name, canonicalName, ...(aliasesByCanonicalName[canonicalName] ?? [])]),
  )

  return {
    id: awakener.id,
    name: canonicalName,
    faction: awakener.faction,
    aliases,
  }
})

export function getAwakeners(): Awakener[] {
  return parsedAwakeners
}
