import {z} from 'zod'

import {getAwakenerOverlays} from './awakener-overlays'
import {
  cardKeywordsSchema,
  descriptionArgsSchema,
  descriptionArgSubstatBonusesSchema,
  ENLIGHTEN_SLOT_KEYS,
  enlightenPatchSchema,
  type AwakenerEnlightenRecord,
  type AwakenerOverlayRecord,
  type AwakenerSkillRecord,
  type AwakenerTalentRecord,
  type CardKeyword,
  type DerivedSkillRecord,
  type DescriptionArg,
  type UpgradePatch,
} from './awakener-source-schema'
import {
  type AwakenerFullRecord,
  type PublicRecordUpgrade,
  type PublicUpgradeableDerivedSkillRecord,
  type PublicUpgradeableOverlayRecord,
  type PublicUpgradeableSkillRecord,
} from './awakeners-full'
import {
  isGnosticPotentialTalent,
  isSoulforgeTalent,
  selectedEnlightenSlotSchema,
} from './awakeners-full-contract'

export const awakenerFullResolveOptionsSchema = z.object({
  soulforgeLevel: z.number().int().min(0).default(0),
  gnosticPotentialLevel: z.number().int().min(0).default(0),
  selectedEnlightenSlot: selectedEnlightenSlotSchema.default(null),
})

export type AwakenerFullResolveOptions = z.infer<typeof awakenerFullResolveOptionsSchema>

export interface ResolvedAwakenerFullRecord {
  selection: AwakenerFullResolveOptions
  activeTalentIds: string[]
  activeEnlightenIds: string[]
  record: AwakenerFullRecord
  overlayOverridesById: Record<string, AwakenerOverlayRecord>
}

type PatchableCardRecord = AwakenerSkillRecord | DerivedSkillRecord
type PublicPatchTargetType = 'skill' | 'derived-skill' | 'overlay'
type PublicUpgradeableTarget =
  | PublicUpgradeableSkillRecord
  | PublicUpgradeableDerivedSkillRecord
  | PublicUpgradeableOverlayRecord
const publicUpgradePatchPayloadSchema = z.looseObject({
  descriptionTemplate: z.string().optional(),
  descriptionArgs: descriptionArgsSchema.optional(),
  argSubstatBonuses: descriptionArgSubstatBonusesSchema.optional(),
  cardKeywords: cardKeywordsSchema.optional(),
  removeCardKeywordIds: z.array(z.string().trim().min(1)).optional(),
})
type PublicUpgradePatchPayload = z.infer<typeof publicUpgradePatchPayloadSchema>
type ResolverUpgradeOperation = UpgradePatch['operation']

function cloneDescriptionArgs(
  descriptionArgs: Record<string, DescriptionArg>,
): Record<string, DescriptionArg> {
  return Object.fromEntries(
    Object.entries(descriptionArgs).map(([key, arg]) => [
      key,
      {
        ...arg,
        ...(arg.substatBonus ? {substatBonus: {...arg.substatBonus}} : {}),
      },
    ]),
  )
}

function cloneCardKeywords(keywords: CardKeyword[]): CardKeyword[] {
  return keywords.map((keyword) => ({...keyword}))
}

function cloneSkillRecord(record: AwakenerSkillRecord): AwakenerSkillRecord {
  return {
    ...record,
    descriptionArgs: cloneDescriptionArgs(record.descriptionArgs),
    cardKeywords: cloneCardKeywords(record.cardKeywords),
    variants: record.variants.map((variant) => ({
      ...variant,
      descriptionArgs: cloneDescriptionArgs(variant.descriptionArgs),
      cardKeywords: cloneCardKeywords(variant.cardKeywords),
    })),
  }
}

function cloneDerivedSkillRecord(record: DerivedSkillRecord): DerivedSkillRecord {
  return {
    ...record,
    descriptionArgs: cloneDescriptionArgs(record.descriptionArgs),
    childDerivedSkillIds: [...record.childDerivedSkillIds],
    cardKeywords: cloneCardKeywords(record.cardKeywords),
    variants: record.variants.map((variant) => ({
      ...variant,
      descriptionArgs: cloneDescriptionArgs(variant.descriptionArgs),
      cardKeywords: cloneCardKeywords(variant.cardKeywords),
    })),
  }
}

function cloneOverlayRecord(record: AwakenerOverlayRecord): AwakenerOverlayRecord {
  return {
    ...record,
    aliases: [...record.aliases],
    descriptionArgs: cloneDescriptionArgs(record.descriptionArgs),
  }
}

function mergeDescriptionArgs<T extends {descriptionArgs: Record<string, unknown>}>(
  record: T,
  nextArgs: Record<string, unknown> | undefined,
): T {
  if (!nextArgs) {
    return record
  }

  return {
    ...record,
    descriptionArgs: {
      ...record.descriptionArgs,
      ...nextArgs,
    },
  }
}

function mergeCardKeywords(
  baseKeywords: CardKeyword[],
  addCardKeywords: CardKeyword[] | undefined,
  removeCardKeywordIds: string[] | undefined,
): CardKeyword[] {
  const next = new Map(baseKeywords.map((keyword) => [keyword.id, {...keyword}]))

  for (const keywordId of removeCardKeywordIds ?? []) {
    next.delete(keywordId)
  }

  for (const keyword of addCardKeywords ?? []) {
    next.set(keyword.id, {...keyword})
  }

  return [...next.values()]
}

function applyArgSubstatBonuses(
  descriptionArgs: Record<string, DescriptionArg>,
  argSubstatBonuses: NonNullable<UpgradePatch['argSubstatBonuses']>,
): Record<string, DescriptionArg> {
  const nextArgs = cloneDescriptionArgs(descriptionArgs)

  for (const [argKey, substatBonus] of Object.entries(argSubstatBonuses)) {
    if (!Object.hasOwn(nextArgs, argKey)) {
      throw new Error(`Cannot apply substat bonus patch to missing arg "${argKey}".`)
    }
    const currentArg = nextArgs[argKey]

    nextArgs[argKey] = {
      ...currentArg,
      substatBonus: {...substatBonus},
    }
  }

  return nextArgs
}

function applyPatchToCardRecord<T extends PatchableCardRecord>(record: T, patch: UpgradePatch): T {
  let next: T = record

  if (patch.descriptionTemplate) {
    next = {
      ...next,
      descriptionTemplate: patch.descriptionTemplate,
    }
  }

  next = mergeDescriptionArgs(next, patch.descriptionArgs)

  if (patch.argSubstatBonuses) {
    next = {
      ...next,
      descriptionArgs: applyArgSubstatBonuses(next.descriptionArgs, patch.argSubstatBonuses),
    }
  }

  if (patch.addCardKeywords || patch.removeCardKeywordIds) {
    next = {
      ...next,
      cardKeywords: mergeCardKeywords(
        next.cardKeywords,
        patch.addCardKeywords,
        patch.removeCardKeywordIds,
      ),
    }
  }

  return next
}

function applyPatchToOverlayRecord(
  record: AwakenerOverlayRecord,
  patch: UpgradePatch,
): AwakenerOverlayRecord {
  if (patch.addCardKeywords || patch.removeCardKeywordIds) {
    throw new Error(`Overlay patch "${patch.targetId}" cannot modify card keywords.`)
  }

  let next = record

  if (patch.descriptionTemplate) {
    next = {
      ...next,
      descriptionTemplate: patch.descriptionTemplate,
    }
  }

  next = mergeDescriptionArgs(next, patch.descriptionArgs)

  if (patch.argSubstatBonuses) {
    return {
      ...next,
      descriptionArgs: applyArgSubstatBonuses(next.descriptionArgs, patch.argSubstatBonuses),
    }
  }

  return next
}

function buildCardsById(record: AwakenerFullRecord): Map<string, PatchableCardRecord> {
  const byId = new Map<string, PatchableCardRecord>()

  byId.set(record.cards.C1.id, cloneSkillRecord(record.cards.C1))
  byId.set(record.cards.C2.id, cloneSkillRecord(record.cards.C2))
  byId.set(record.cards.C3.id, cloneSkillRecord(record.cards.C3))
  byId.set(record.cards.C4.id, cloneSkillRecord(record.cards.C4))
  byId.set(record.cards.C5.id, cloneSkillRecord(record.cards.C5))
  byId.set(record.cards.Exalt.id, cloneSkillRecord(record.cards.Exalt))

  if (record.cards.OverExalt) {
    byId.set(record.cards.OverExalt.id, cloneSkillRecord(record.cards.OverExalt))
  }

  for (const card of record.cards.promotedExtras) {
    byId.set(card.id, cloneDerivedSkillRecord(card))
  }

  for (const card of record.derivedSkills) {
    byId.set(card.id, cloneDerivedSkillRecord(card))
  }

  return byId
}

function buildAccessibleOverlaysById(
  record: AwakenerFullRecord,
  overlays: AwakenerOverlayRecord[],
): Map<string, AwakenerOverlayRecord> {
  const byId = new Map<string, AwakenerOverlayRecord>()

  for (const overlay of overlays) {
    if (overlay.ownerAwakenerId === undefined || overlay.ownerAwakenerId === record.id) {
      byId.set(overlay.id, overlay)
    }
  }
  for (const overlay of record.overlays ?? []) {
    byId.set(overlay.id, overlay)
  }

  return byId
}

function getActiveEnlightens(
  record: AwakenerFullRecord,
  selectedEnlightenSlot: AwakenerFullResolveOptions['selectedEnlightenSlot'],
): AwakenerEnlightenRecord[] {
  if (!selectedEnlightenSlot) {
    return []
  }

  const orderedSlots: AwakenerEnlightenRecord['slot'][] = []
  for (const slot of ENLIGHTEN_SLOT_KEYS) {
    orderedSlots.push(slot)
    if (slot === selectedEnlightenSlot) {
      break
    }
  }

  const active: AwakenerEnlightenRecord[] = []

  for (const slot of orderedSlots) {
    const entry =
      slot === 'AbsoluteAxiom' ? record.enlightens.AbsoluteAxiom : record.enlightens[slot]

    if (entry) {
      active.push(entry)
    }
  }

  return active
}

function getActiveTalentEntries(
  record: AwakenerFullRecord,
  soulforgeLevel: number,
  gnosticPotentialLevel: number,
): AwakenerTalentRecord[] {
  const active: AwakenerTalentRecord[] = []

  for (const talent of getOrderedTalentRecords(record.talents)) {
    if (isSoulforgeTalent(talent) && soulforgeLevel <= 0) {
      continue
    }
    if (isGnosticPotentialTalent(talent) && !talent.defaultMaxed && gnosticPotentialLevel <= 0) {
      continue
    }
    active.push(talent)
  }

  return active
}

function getOrderedTalentRecords(talents: AwakenerFullRecord['talents']): AwakenerTalentRecord[] {
  return uniqueTalentRecords(
    talents.orderedTalents ??
      [talents.T1, talents.T2, talents.T3, talents.T4]
        .filter((talent): talent is AwakenerTalentRecord => Boolean(talent))
        .concat(talents.extraTalents),
  )
}

function uniqueTalentRecords(talents: AwakenerTalentRecord[]): AwakenerTalentRecord[] {
  const seenTalentIds = new Set<string>()
  return talents.filter((talent) => {
    if (seenTalentIds.has(talent.id)) {
      return false
    }
    seenTalentIds.add(talent.id)
    return true
  })
}

function cloneTalentRecord(record: AwakenerTalentRecord): AwakenerTalentRecord {
  return {
    ...record,
    descriptionArgs: cloneDescriptionArgs(record.descriptionArgs),
  }
}

function cloneOptionalTalentRecord(
  record: AwakenerTalentRecord | undefined,
): AwakenerTalentRecord | undefined {
  return record ? cloneTalentRecord(record) : undefined
}

function resolveTalents(
  record: AwakenerFullRecord,
  _soulforgeLevel: number,
): AwakenerFullRecord['talents'] {
  return {
    T1: cloneOptionalTalentRecord(record.talents.T1),
    T2: cloneOptionalTalentRecord(record.talents.T2),
    T3: cloneOptionalTalentRecord(record.talents.T3),
    T4: cloneOptionalTalentRecord(record.talents.T4),
    orderedTalents: record.talents.orderedTalents?.map((entry) => cloneTalentRecord(entry)),
    extraTalents: record.talents.extraTalents.map((entry) => cloneTalentRecord(entry)),
  }
}

function rebuildRecordFromMaps(
  record: AwakenerFullRecord,
  cardsById: Map<string, PatchableCardRecord>,
  resolvedTalents: AwakenerFullRecord['talents'],
): AwakenerFullRecord {
  const requireCardRecord = (id: string): PatchableCardRecord => {
    const next = cardsById.get(id)
    if (!next) {
      throw new Error(`Resolved compiled record is missing patched card "${id}".`)
    }
    return next
  }
  const requireSkillRecord = (id: string): AwakenerSkillRecord => {
    const next = requireCardRecord(id)
    if ('kind' in next) {
      return next
    }
    throw new Error(`Resolved compiled record card "${id}" is not an awakener skill record.`)
  }
  const requireDerivedRecord = (id: string): DerivedSkillRecord => {
    const next = requireCardRecord(id)
    if ('childDerivedSkillIds' in next) {
      return next
    }
    throw new Error(`Resolved compiled record card "${id}" is not a derived skill record.`)
  }

  return {
    ...record,
    cards: {
      C1: requireSkillRecord(record.cards.C1.id),
      C2: requireSkillRecord(record.cards.C2.id),
      C3: requireSkillRecord(record.cards.C3.id),
      C4: requireSkillRecord(record.cards.C4.id),
      C5: requireSkillRecord(record.cards.C5.id),
      Exalt: requireSkillRecord(record.cards.Exalt.id),
      OverExalt: record.cards.OverExalt ? requireSkillRecord(record.cards.OverExalt.id) : undefined,
      promotedExtras: record.cards.promotedExtras.map((entry) => requireDerivedRecord(entry.id)),
    },
    talents: resolvedTalents,
    derivedSkills: record.derivedSkills.map((entry) => requireDerivedRecord(entry.id)),
  }
}

function cloneUpgradePatch(patch: UpgradePatch): UpgradePatch {
  return {
    ...patch,
    ...(patch.descriptionArgs
      ? {descriptionArgs: cloneDescriptionArgs(patch.descriptionArgs)}
      : {}),
    ...(patch.argSubstatBonuses ? {argSubstatBonuses: {...patch.argSubstatBonuses}} : {}),
    ...(patch.addCardKeywords
      ? {addCardKeywords: patch.addCardKeywords.map((keyword) => ({...keyword}))}
      : {}),
    ...(patch.removeCardKeywordIds ? {removeCardKeywordIds: [...patch.removeCardKeywordIds]} : {}),
  }
}

function parsePublicUpgradePatchPayload(upgrade: PublicRecordUpgrade): PublicUpgradePatchPayload {
  return publicUpgradePatchPayloadSchema.parse(upgrade.patch ?? {})
}

function isResolverUpgradeOperation(
  operation: PublicRecordUpgrade['operation'],
): operation is ResolverUpgradeOperation {
  return (
    operation === 'replace_description' ||
    operation === 'override_args' ||
    operation === 'arg_substat_bonuses' ||
    operation === 'card_keywords' ||
    operation === 'mixed'
  )
}

function toResolverCardKeywordPatch(
  target: PublicUpgradeableTarget,
  targetType: PublicPatchTargetType,
  payload: PublicUpgradePatchPayload,
): UpgradePatch | null {
  if (!payload.cardKeywords?.length && !payload.removeCardKeywordIds?.length) {
    return null
  }

  return enlightenPatchSchema.parse({
    targetId: target.id,
    targetType,
    operation: 'card_keywords',
    ...(payload.cardKeywords ? {addCardKeywords: payload.cardKeywords} : {}),
    ...(payload.removeCardKeywordIds ? {removeCardKeywordIds: payload.removeCardKeywordIds} : {}),
  })
}

function toResolverPayloadPatch(
  target: PublicUpgradeableTarget,
  targetType: PublicPatchTargetType,
  operation: ResolverUpgradeOperation,
  payload: PublicUpgradePatchPayload,
): UpgradePatch | null {
  if (operation === 'card_keywords') {
    return toResolverCardKeywordPatch(target, targetType, payload)
  }

  return enlightenPatchSchema.parse({
    targetId: target.id,
    targetType,
    operation,
    ...(payload.descriptionTemplate !== undefined
      ? {descriptionTemplate: payload.descriptionTemplate}
      : {}),
    ...(payload.descriptionArgs ? {descriptionArgs: payload.descriptionArgs} : {}),
    ...(payload.argSubstatBonuses ? {argSubstatBonuses: payload.argSubstatBonuses} : {}),
    ...(payload.cardKeywords ? {addCardKeywords: payload.cardKeywords} : {}),
    ...(payload.removeCardKeywordIds ? {removeCardKeywordIds: payload.removeCardKeywordIds} : {}),
  })
}

function toResolverUpgradePatch(
  target: PublicUpgradeableTarget,
  targetType: PublicPatchTargetType,
  upgrade: PublicRecordUpgrade,
): UpgradePatch | null {
  if (upgrade.operation === 'link_only') {
    return null
  }

  if (upgrade.operation === 'override_card_keywords') {
    return toResolverCardKeywordPatch(target, targetType, parsePublicUpgradePatchPayload(upgrade))
  }

  if (!isResolverUpgradeOperation(upgrade.operation)) {
    return null
  }

  return toResolverPayloadPatch(
    target,
    targetType,
    upgrade.operation,
    parsePublicUpgradePatchPayload(upgrade),
  )
}

function collectUpgradePatchesForUpgraders(
  targets: PublicUpgradeableTarget[],
  targetType: PublicPatchTargetType,
  activeUpgraderIds: Set<string>,
): UpgradePatch[] {
  const patches: UpgradePatch[] = []
  for (const target of targets) {
    for (const upgrade of target.upgrades ?? []) {
      if (typeof upgrade.upgraderId !== 'string' || !activeUpgraderIds.has(upgrade.upgraderId)) {
        continue
      }
      const patch = toResolverUpgradePatch(target, targetType, upgrade)
      if (patch) {
        patches.push(cloneUpgradePatch(patch))
      }
    }
  }
  return patches
}

function getSkillUpgradeTargets(record: AwakenerFullRecord): PublicUpgradeableSkillRecord[] {
  return [
    record.cards.C1,
    record.cards.C2,
    record.cards.C3,
    record.cards.C4,
    record.cards.C5,
    record.cards.Exalt,
    ...(record.cards.OverExalt ? [record.cards.OverExalt] : []),
  ]
}

function getDerivedUpgradeTargets(
  record: AwakenerFullRecord,
): PublicUpgradeableDerivedSkillRecord[] {
  return [...record.cards.promotedExtras, ...record.derivedSkills]
}

function collectRecordUpgradePatches(
  record: AwakenerFullRecord,
  accessibleOverlaysById: Map<string, AwakenerOverlayRecord>,
  activeUpgraderIds: Set<string>,
): UpgradePatch[] {
  return [
    ...collectUpgradePatchesForUpgraders(
      getSkillUpgradeTargets(record),
      'skill',
      activeUpgraderIds,
    ),
    ...collectUpgradePatchesForUpgraders(
      getDerivedUpgradeTargets(record),
      'derived-skill',
      activeUpgraderIds,
    ),
    ...collectUpgradePatchesForUpgraders(
      [...accessibleOverlaysById.values()] as PublicUpgradeableOverlayRecord[],
      'overlay',
      activeUpgraderIds,
    ),
  ]
}

export function resolveAwakenerFullRecord(
  record: AwakenerFullRecord,
  options: Partial<AwakenerFullResolveOptions> = {},
  overlays: AwakenerOverlayRecord[] = getAwakenerOverlays(),
): ResolvedAwakenerFullRecord {
  const selection = awakenerFullResolveOptionsSchema.parse(options)
  const cardsById = buildCardsById(record)
  const accessibleOverlaysById = buildAccessibleOverlaysById(record, overlays)
  const overlayOverridesById = new Map<string, AwakenerOverlayRecord>()
  const activeTalents = getActiveTalentEntries(
    record,
    selection.soulforgeLevel,
    selection.gnosticPotentialLevel,
  )
  const activeEnlightens = getActiveEnlightens(record, selection.selectedEnlightenSlot)

  for (const patch of collectRecordUpgradePatches(
    record,
    accessibleOverlaysById,
    new Set(activeTalents.map((entry) => entry.id)),
  )) {
    if (patch.targetType === 'overlay') {
      const currentOverlay =
        overlayOverridesById.get(patch.targetId) ?? accessibleOverlaysById.get(patch.targetId)
      if (!currentOverlay) {
        throw new Error(
          `Missing overlay "${patch.targetId}" for awakener ${String(record.id)} while applying public talent upgrade.`,
        )
      }
      overlayOverridesById.set(
        patch.targetId,
        applyPatchToOverlayRecord(cloneOverlayRecord(currentOverlay), patch),
      )
      continue
    }

    const currentCard = cardsById.get(patch.targetId)
    if (!currentCard) {
      throw new Error(
        `Missing ${patch.targetType} "${patch.targetId}" for awakener ${String(record.id)} while applying public talent upgrade.`,
      )
    }
    cardsById.set(patch.targetId, applyPatchToCardRecord(currentCard, patch))
  }

  for (const patch of collectRecordUpgradePatches(
    record,
    accessibleOverlaysById,
    new Set(activeEnlightens.map((entry) => entry.id)),
  )) {
    if (patch.targetType === 'overlay') {
      const currentOverlay =
        overlayOverridesById.get(patch.targetId) ?? accessibleOverlaysById.get(patch.targetId)
      if (!currentOverlay) {
        throw new Error(
          `Missing overlay "${patch.targetId}" for awakener ${String(record.id)} while applying public enlighten upgrade.`,
        )
      }
      overlayOverridesById.set(
        patch.targetId,
        applyPatchToOverlayRecord(cloneOverlayRecord(currentOverlay), patch),
      )
      continue
    }

    const currentCard = cardsById.get(patch.targetId)
    if (!currentCard) {
      throw new Error(
        `Missing ${patch.targetType} "${patch.targetId}" for awakener ${String(record.id)} while applying public enlighten upgrade.`,
      )
    }
    cardsById.set(patch.targetId, applyPatchToCardRecord(currentCard, patch))
  }

  const resolvedTalents = resolveTalents(record, selection.soulforgeLevel)

  return {
    selection,
    activeTalentIds: activeTalents.map((entry) => entry.id),
    activeEnlightenIds: activeEnlightens.map((entry) => entry.id),
    record: rebuildRecordFromMaps(record, cardsById, resolvedTalents),
    overlayOverridesById: Object.fromEntries(overlayOverridesById),
  }
}
