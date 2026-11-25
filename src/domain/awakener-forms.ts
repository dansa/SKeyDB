import {z} from 'zod'

import {descriptionArgsSchema, type DerivedSkillRecord} from './awakener-source-schema'

const label = z.string().trim().min(1)
const key = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
const description = {
  descriptionTemplate: label,
  descriptionArgs: descriptionArgsSchema,
}
const entry = z.strictObject({
  ...description,
  key,
  title: label,
  cost: label.optional(),
  upgrade: z.strictObject({...description, slot: z.enum(['E1', 'E2', 'E3'])}).optional(),
})
const group = z.strictObject({
  key,
  title: label,
  intro: label.optional(),
  reference: z.strictObject({name: label, aliases: z.array(label).optional()}).optional(),
  entries: z.array(entry).min(1),
})

export const awakenerFormsSchema = z.strictObject({
  baseLabel: label,
  alternatives: z
    .array(
      z.strictObject({
        key,
        label,
        name: label,
        assetKey: key,
        skillGroups: z.array(group).min(1),
        upgradeGroups: z.array(group),
      }),
    )
    .min(1),
})

export type AwakenerForms = z.infer<typeof awakenerFormsSchema>
export type AwakenerForm = AwakenerForms['alternatives'][number]
export type AwakenerFormGroup = AwakenerForm['skillGroups'][number]

export function buildAwakenerFormSkillRecord(
  ownerAwakenerId: number,
  groupId: string,
  entry: AwakenerFormGroup['entries'][number],
  copy: Pick<typeof entry, 'descriptionTemplate' | 'descriptionArgs'> = entry,
): DerivedSkillRecord {
  return {
    id: `${groupId}-${entry.key}`,
    displayName: entry.title,
    descriptionTemplate: copy.descriptionTemplate,
    descriptionArgs: copy.descriptionArgs,
    cost: entry.cost,
    ownerAwakenerId,
    aliases: [],
    cardKeywords: [],
    childDerivedSkillIds: [],
    variants: [],
  }
}

export function buildAwakenerFormGroupRecord(
  ownerAwakenerId: number,
  groupId: string,
  group: Pick<AwakenerFormGroup, 'intro' | 'reference'>,
  childDerivedSkillIds: string[],
): DerivedSkillRecord | undefined {
  if (!group.reference) return undefined
  return {
    id: `form-${String(ownerAwakenerId)}-${groupId}`,
    displayName: group.reference.name,
    ownerAwakenerId,
    nodeKind: 'group',
    descriptionTemplate: group.intro ?? '',
    descriptionArgs: {},
    aliases: group.reference.aliases ?? [],
    childDerivedSkillIds,
    cardKeywords: [],
    variants: [],
  }
}

export function buildAwakenerFormReferenceRecords(
  ownerAwakenerId: number,
  forms: AwakenerForms,
): DerivedSkillRecord[] {
  return forms.alternatives.flatMap((form) =>
    form.skillGroups.flatMap((group) => {
      const groupId = `${form.key}-${group.key}`
      const entries = group.entries.map((entry) =>
        buildAwakenerFormSkillRecord(ownerAwakenerId, groupId, entry),
      )
      const groupRecord = buildAwakenerFormGroupRecord(
        ownerAwakenerId,
        `skills-${groupId}`,
        group,
        entries.map(({id}) => id),
      )
      return groupRecord ? [groupRecord, ...entries] : entries
    }),
  )
}
