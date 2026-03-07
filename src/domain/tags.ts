import {z} from 'zod'

import rawTags from '@/data/tags.json'

const tagSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  description: z.string(),
  iconId: z.string(),
  aliases: z.array(z.string()),
  source: z.string().optional(),
})

const parsedTags = z.array(tagSchema).parse(rawTags)

export type Tag = (typeof parsedTags)[number]

const tagByLabel = new Map<string, Tag>()
const tagByAlias = new Map<string, Tag>()

for (const tag of parsedTags) {
  tagByLabel.set(tag.label, tag)
  for (const alias of tag.aliases) {
    tagByAlias.set(alias, tag)
  }
}

export function getTags(): Tag[] {
  return parsedTags
}

export function resolveTag(name: string): Tag | null {
  return tagByLabel.get(name) ?? tagByAlias.get(name) ?? null
}
