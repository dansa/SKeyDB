import {z} from 'zod'

import rawTags from '@/data/tags.json'

const tagSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  description: z.string(),
  iconId: z.string(),
  aliases: z.array(z.string()),
  source: z.string().optional(),
  tint: z.string().optional(),
  category: z.string().optional(),
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

const tagIconsRaw = import.meta.glob<string>(
  [
    '@/assets/icons/tags/*.png',
    '@/assets/icons/UI_Battle_White_Buff_*.png',
    '@/assets/icons/Battle_Card_Buff_*.png',
  ],
  {
    eager: true,
    import: 'default',
  },
)

export const TAG_ICONS_BY_ID: Record<string, string> = {}

for (const [path, url] of Object.entries(tagIconsRaw)) {
  const filename = path.split('/').pop()?.replace('.png', '')
  if (filename) {
    TAG_ICONS_BY_ID[filename] = url
  }
}

export function getTagColor(tag: Tag): string | undefined {
  return tag.tint
}

export function getTagIcon(iconId: string): string | undefined {
  if (!iconId) return undefined
  if (/^\d{3}$/.test(iconId)) {
    return (
      TAG_ICONS_BY_ID[`UI_Battle_White_Buff_${iconId}`] ??
      TAG_ICONS_BY_ID[`Battle_Card_Buff_${iconId}`]
    )
  }
  return TAG_ICONS_BY_ID[iconId]
}

export function getTags(): Tag[] {
  return parsedTags
}

export function resolveTag(name: string): Tag | null {
  return tagByLabel.get(name) ?? tagByAlias.get(name) ?? null
}
