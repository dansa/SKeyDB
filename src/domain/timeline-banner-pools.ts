import type {Awakener} from './awakeners'
import type {BannerFeaturedUnit, BannerPoolSlot} from './timeline'
import type {Wheel} from './wheels'

export type FeaturedInput =
  | string
  | {
      name: string
      kind?: 'awakener' | 'wheel' | 'wheel-auto' | 'placeholder'
      customArt?: string
      realmId?: string
      detailLink?: boolean
    }

export interface PoolSlotInput {
  pool: FeaturedInput[]
  label?: string
  linked?: boolean
  count?: number
}

export interface DerivedPoolSlotInput {
  availabilityTypes?: string[]
  count?: number
  excludeNames?: string[]
  gender?: string
  kind: 'awakener' | 'wheel'
  label?: string
  limitedAwakenerType?: string
  linked?: boolean
}

export interface DerivedPoolInput {
  availabilityTypes?: string[]
  awakenerSlots?: number
  gender?: string
  excludeNames?: string[]
  linkedPairs?: boolean
  limitedAwakenerType?: string
  slots?: DerivedPoolSlotInput[]
  slotCount?: number
  wheelSlots?: number
}

interface BannerPoolResolutionContext {
  awakeners: Awakener[]
  resolveCustomArt: (value: string | undefined) => string | undefined
  wheels: Wheel[]
}

const LIMITED_STARS_IN_FULL_BLOOM_AVAILABILITY = new Set([
  'LIMITED_ASTRAL_REIGN',
  'LIMITED_FADED_LEGACY',
])

function getAwakenerDisplayName(awakener: Awakener): string {
  return (
    awakener.aliases.find(
      (alias) => alias.toLowerCase() === awakener.name.toLowerCase() && alias !== awakener.name,
    ) ?? awakener.name
  )
}

export function resolveTimelineBannerUnit(
  input: FeaturedInput,
  context: Pick<BannerPoolResolutionContext, 'resolveCustomArt' | 'wheels'>,
): BannerFeaturedUnit {
  if (typeof input !== 'string') {
    return {
      name: input.name,
      kind: input.kind ?? 'awakener',
      customArt: context.resolveCustomArt(input.customArt),
      realmId: input.realmId,
      detailLink: input.detailLink,
    }
  }
  const lower = input.toLowerCase()
  if (context.wheels.some((wheel) => wheel.name.toLowerCase() === lower)) {
    return {name: input, kind: 'wheel'}
  }
  return {name: input, kind: 'awakener'}
}

export function resolveTimelineBannerPoolSlots(
  input: PoolSlotInput[],
  context: Pick<BannerPoolResolutionContext, 'resolveCustomArt' | 'wheels'>,
): BannerPoolSlot[] {
  const out: BannerPoolSlot[] = []
  for (const slot of input) {
    const resolved: BannerPoolSlot = {
      pool: slot.pool.map((unit) => resolveTimelineBannerUnit(unit, context)),
      label: slot.label,
      linked: slot.linked,
    }
    const copies = slot.count ?? 1
    for (let i = 0; i < copies; i++) {
      out.push({pool: [...resolved.pool], label: resolved.label, linked: resolved.linked})
    }
  }
  return out
}

function normalizeDerivedAvailabilityTypes(input: DerivedPoolInput): Set<string> {
  return new Set(
    (input.availabilityTypes ?? [...LIMITED_STARS_IN_FULL_BLOOM_AVAILABILITY]).map((availability) =>
      availability.trim().toUpperCase(),
    ),
  )
}

function resolveEligibleAwakeners(
  input: Pick<
    DerivedPoolInput,
    'availabilityTypes' | 'excludeNames' | 'gender' | 'limitedAwakenerType'
  >,
  context: Pick<BannerPoolResolutionContext, 'awakeners'>,
): Awakener[] {
  const type = input.limitedAwakenerType?.trim().toUpperCase()
  const gender = input.gender?.trim().toLowerCase()
  const availabilityTypes = normalizeDerivedAvailabilityTypes(input)
  const excludedNames = new Set(input.excludeNames?.map((name) => name.trim().toLowerCase()) ?? [])

  return context.awakeners.filter(
    (awakener) =>
      awakener.rarity === 'SSR' &&
      (!type || awakener.type === type) &&
      (!gender || awakener.gender?.trim().toLowerCase() === gender) &&
      Boolean(awakener.availabilityType && availabilityTypes.has(awakener.availabilityType)) &&
      !excludedNames.has(awakener.name.toLowerCase()) &&
      !awakener.aliases.some((alias) => excludedNames.has(alias.toLowerCase())),
  )
}

function getSignatureWheels(wheels: Wheel[]): Wheel[] {
  const seenOwners = new Set<string>()
  const signatures: Wheel[] = []

  for (const wheel of wheels) {
    if (wheel.rarity !== 'SSR' || !wheel.ownerAwakenerId || seenOwners.has(wheel.ownerAwakenerId)) {
      continue
    }
    seenOwners.add(wheel.ownerAwakenerId)
    signatures.push(wheel)
  }

  return signatures
}

function resolveFilteredSlot(
  input: DerivedPoolSlotInput,
  bannerId: string,
  context: Pick<BannerPoolResolutionContext, 'awakeners' | 'wheels'>,
): BannerPoolSlot {
  const awakeners = resolveEligibleAwakeners(input, context)
  const awakenerIds = new Set(awakeners.map((awakener) => awakener.id))
  const signatureWheels = getSignatureWheels(context.wheels)
  if (input.linked) {
    const wheelOwnerIds = new Set(
      signatureWheels.flatMap((wheel) => (wheel.ownerAwakenerId ? [wheel.ownerAwakenerId] : [])),
    )
    const missingWheelAwakeners = awakeners.filter((awakener) => !wheelOwnerIds.has(awakener.id))
    if (missingWheelAwakeners.length > 0) {
      throw new Error(
        `Timeline banner "${bannerId}" derived slot "${input.label ?? input.kind}" includes awakeners without SSR wheels: ${missingWheelAwakeners
          .map((awakener) => awakener.name)
          .join(', ')}.`,
      )
    }
  }
  const pool: BannerFeaturedUnit[] = []
  if (input.kind === 'awakener') {
    for (const awakener of awakeners) {
      pool.push({name: getAwakenerDisplayName(awakener), kind: 'awakener'})
    }
  } else {
    for (const wheel of signatureWheels) {
      if (wheel.ownerAwakenerId && awakenerIds.has(wheel.ownerAwakenerId)) {
        pool.push({name: wheel.name, kind: 'wheel'})
      }
    }
  }

  if (pool.length === 0) {
    throw new Error(
      `Timeline banner "${bannerId}" derived slot "${input.label ?? input.kind}" produced an empty pool.`,
    )
  }

  return {pool, label: input.label, linked: input.linked}
}

export function resolveTimelineBannerDerivedPool(
  input: DerivedPoolInput,
  bannerId: string,
  context: Pick<BannerPoolResolutionContext, 'awakeners' | 'wheels'>,
): BannerPoolSlot[] {
  if (input.slots) {
    return input.slots.flatMap((slot) => {
      const mergedSlot = {
        ...slot,
        availabilityTypes: slot.availabilityTypes ?? input.availabilityTypes,
        excludeNames: [...(input.excludeNames ?? []), ...(slot.excludeNames ?? [])],
      }
      const resolved = resolveFilteredSlot(mergedSlot, bannerId, context)
      return Array.from({length: slot.count ?? 1}, () => ({
        ...resolved,
        pool: [...resolved.pool],
      }))
    })
  }

  const awakeners = resolveEligibleAwakeners(input, context)
  const awakenerIds = new Set(awakeners.map((awakener) => awakener.id))
  const wheels = getSignatureWheels(context.wheels).filter((wheel) =>
    Boolean(wheel.ownerAwakenerId && awakenerIds.has(wheel.ownerAwakenerId)),
  )

  const awakenerPool = awakeners.map((awakener) => ({
    name: getAwakenerDisplayName(awakener),
    kind: 'awakener' as const,
  }))

  if (input.linkedPairs) {
    const wheelOwnerIds = new Set(
      wheels.flatMap((wheel) => (wheel.ownerAwakenerId ? [wheel.ownerAwakenerId] : [])),
    )
    const missingWheelAwakeners = awakeners.filter((awakener) => !wheelOwnerIds.has(awakener.id))
    if (missingWheelAwakeners.length > 0) {
      throw new Error(
        `Timeline banner "${bannerId}" linkedPairs derivedPool includes awakeners without SSR wheels: ${missingWheelAwakeners
          .map((awakener) => awakener.name)
          .join(', ')}.`,
      )
    }
    if (awakenerPool.length === 0) {
      throw new Error(`Timeline banner "${bannerId}" derivedPool produced an empty linked pool.`)
    }
    return [{pool: awakenerPool, linked: true}]
  }

  const wheelPool = wheels.map((wheel) => ({name: wheel.name, kind: 'wheel' as const}))
  const slotCount = Math.max(2, input.slotCount ?? 2)
  const awakenerSlots = Math.min(
    slotCount,
    Math.max(0, input.awakenerSlots ?? Math.ceil(slotCount / 2)),
  )
  const wheelSlots = Math.min(
    slotCount - awakenerSlots,
    Math.max(0, input.wheelSlots ?? slotCount - awakenerSlots),
  )

  const slots = [
    ...Array.from({length: awakenerSlots}, () => ({pool: awakenerPool})),
    ...Array.from({length: wheelSlots}, () => ({pool: wheelPool})),
  ]
  const emptyPools: string[] = []
  if (awakenerSlots > 0 && awakenerPool.length === 0) emptyPools.push('awakener')
  if (wheelSlots > 0 && wheelPool.length === 0) emptyPools.push('wheel')
  if (emptyPools.length > 0) {
    throw new Error(
      `Timeline banner "${bannerId}" derivedPool produced empty ${emptyPools.join('/')} pool(s).`,
    )
  }

  return slots
}
