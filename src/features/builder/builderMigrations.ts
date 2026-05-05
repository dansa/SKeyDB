import {getPublicBuilderCatalog} from '@/data-access/public-data/collectionRepository'
import {isPublicEntityId} from '@/domain/entities/types'
import {
  COVENANT_ID_V1_TO_CURRENT,
  migrateAwakenerNameV1ToCurrent,
  migrateCovenantIdV1ToCurrent,
  migratePosseIdV1ToCurrent,
  migrateWheelIdV1ToCurrent,
  POSSE_ID_V1_TO_CURRENT,
  WHEEL_ID_V1_TO_CURRENT,
} from '@/domain/persistence-id-migration'
import type {Team, TeamSlot} from '@/features/builder/types'

export interface BuilderDraftPayload {
  teams: Team[]
  activeTeamId: string
}

export interface PersistedBuilderEnvelope<TPayload = BuilderDraftPayload> {
  version: number
  updatedAt: string
  payload: TPayload
}

export interface PersistedBuilderSlot {
  slotId: string
  awakenerId?: string
  realm?: TeamSlot['realm']
  level?: number
  isSupport?: boolean
  wheels: [string | null, string | null]
  covenantId?: string
}

export interface PersistedBuilderTeam {
  id: string
  name: string
  slots: PersistedBuilderSlot[]
  posseId?: string
}

export interface PersistedBuilderPayload {
  teams: PersistedBuilderTeam[]
  activeTeamId: string
}

const VALID_REALMS = new Set(['AEQUOR', 'CARO', 'CHAOS', 'ULTRA', 'NEUTRAL', 'OTHER'])

const WHEEL_ID_TO_LEGACY_ID = reverseIdMap(WHEEL_ID_V1_TO_CURRENT)
const COVENANT_ID_TO_LEGACY_ID = reverseIdMap(COVENANT_ID_V1_TO_CURRENT)
const POSSE_ID_TO_LEGACY_ID = reverseIdMap(POSSE_ID_V1_TO_CURRENT)
const BUILDER_CATALOG = getPublicBuilderCatalog()
const CURRENT_AWAKENER_IDS = new Set(BUILDER_CATALOG.options.awakeners)
const CURRENT_WHEEL_IDS = new Set(BUILDER_CATALOG.options.wheels)
const CURRENT_COVENANT_IDS = new Set(BUILDER_CATALOG.options.covenants)
const CURRENT_POSSE_IDS = new Set(BUILDER_CATALOG.options.posses)

function reverseIdMap(map: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(map).map(([legacyId, publicId]) => [publicId, legacyId]))
}

type PersistedPublicIdKind = 'awakener' | 'covenant' | 'posse' | 'wheel'

function isPublicId(kind: PersistedPublicIdKind, value: string): boolean {
  return isPublicEntityId(kind, value)
}

function migrateBuilderAwakenerName(name: string): string | undefined {
  return migrateAwakenerNameV1ToCurrent(name) ?? migrateAwakenerNameV1ToCurrent(name.toLowerCase())
}

function migrateBuilderPosseId(id: string): string | undefined {
  const unprefixedId = id.replace(/^\d+-/, '')
  return migratePosseIdV1ToCurrent(id) ?? migratePosseIdV1ToCurrent(unprefixedId)
}

function canonicalizePersistedId(
  id: string,
  kind: PersistedPublicIdKind,
  migrate: (id: string) => string | undefined,
  currentIds: Set<string>,
): string | null {
  if (isPublicId(kind, id)) {
    return currentIds.has(id) ? id : null
  }
  const migratedId = migrate(id)
  return migratedId && currentIds.has(migratedId) ? migratedId : null
}

function resolveRuntimeId(
  publicId: string,
  currentIds: Set<string>,
  legacyByPublicId: Partial<Record<string, string>>,
): string | undefined {
  if (currentIds.has(publicId)) {
    return publicId
  }
  return legacyByPublicId[publicId]
}

function isRealm(value: unknown): boolean {
  return typeof value === 'string' && VALID_REALMS.has(value)
}

function hasNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isOptionalString(value: unknown): boolean {
  return value === undefined || typeof value === 'string'
}

function isOptionalFiniteInteger(value: unknown): boolean {
  return (
    value === undefined ||
    (typeof value === 'number' && Number.isFinite(value) && Number.isInteger(value))
  )
}

function isOptionalBoolean(value: unknown): boolean {
  return value === undefined || typeof value === 'boolean'
}

function hasValidSlotIdentity(record: Record<string, unknown>): boolean {
  return hasNonEmptyString(record.slotId)
}

function hasValidSlotWheels(record: Record<string, unknown>): boolean {
  return (
    Array.isArray(record.wheels) &&
    record.wheels.length === 2 &&
    record.wheels.every((wheelId) => wheelId === null || typeof wheelId === 'string')
  )
}

function hasValidSlotMetadata(record: Record<string, unknown>): boolean {
  if (
    !isOptionalString(record.awakenerId) ||
    !isOptionalString(record.awakenerName) ||
    !isOptionalString(record.covenantId)
  ) {
    return false
  }
  if (!isOptionalBoolean(record.isSupport) || !isOptionalFiniteInteger(record.level)) {
    return false
  }
  if (
    (typeof record.awakenerName === 'string' && !record.awakenerName.trim()) ||
    (typeof record.awakenerId === 'string' && !record.awakenerId.trim()) ||
    (typeof record.covenantId === 'string' && !record.covenantId.trim())
  ) {
    return false
  }

  return true
}

function resolveSlotRealmCandidate(record: Record<string, unknown>): unknown {
  return record.realm ?? record.faction
}

function hasInvalidEmptySlotData(record: {
  realm?: unknown
  faction?: unknown
  level?: unknown
  covenantId?: unknown
  isSupport?: unknown
  wheels?: unknown
}): boolean {
  const hasMetadata =
    record.realm !== undefined ||
    record.faction !== undefined ||
    record.level !== undefined ||
    record.covenantId !== undefined ||
    record.isSupport !== undefined
  const hasWheelData =
    Array.isArray(record.wheels) && record.wheels.some((wheelId) => wheelId !== null)
  return hasMetadata || hasWheelData
}

function isSlot(value: unknown): value is TeamSlot {
  if (!value || typeof value !== 'object') {
    return false
  }

  const record = value as Record<string, unknown>
  if (
    !hasValidSlotIdentity(record) ||
    !hasValidSlotWheels(record) ||
    !hasValidSlotMetadata(record)
  ) {
    return false
  }

  const realmCandidate = resolveSlotRealmCandidate(record)
  if (realmCandidate !== undefined && !isRealm(realmCandidate)) {
    return false
  }

  const hasAwakener = hasNonEmptyString(record.awakenerId) || hasNonEmptyString(record.awakenerName)
  if (!hasAwakener) {
    return !hasInvalidEmptySlotData(record)
  }

  return isRealm(realmCandidate)
}

function isTeam(value: unknown): value is Team {
  if (!value || typeof value !== 'object') {
    return false
  }

  const record = value as Record<string, unknown>
  if (
    typeof record.id !== 'string' ||
    !record.id.trim() ||
    typeof record.name !== 'string' ||
    !record.name.trim()
  ) {
    return false
  }
  if (record.posseId !== undefined && typeof record.posseId !== 'string') {
    return false
  }

  if (!Array.isArray(record.slots) || record.slots.length !== 4) {
    return false
  }

  if (!record.slots.every(isSlot)) {
    return false
  }

  const slotIds = record.slots.map((slot) => slot.slotId)
  return new Set(slotIds).size === slotIds.length
}

export function isBuilderDraftPayload(value: unknown): value is BuilderDraftPayload {
  if (!value || typeof value !== 'object') {
    return false
  }

  const record = value as Record<string, unknown>
  if (typeof record.activeTeamId !== 'string') {
    return false
  }

  if (!Array.isArray(record.teams)) {
    return false
  }

  if (record.teams.length === 0) {
    return false
  }

  return record.teams.every(isTeam)
}

function isPersistedSlot(value: unknown): value is PersistedBuilderSlot {
  if (!value || typeof value !== 'object') {
    return false
  }

  const record = value as Record<string, unknown>
  if (!hasValidSlotIdentity(record) || !hasValidSlotWheels(record)) {
    return false
  }
  if (!isOptionalString(record.awakenerId) || !isOptionalString(record.covenantId)) {
    return false
  }
  if (!isOptionalBoolean(record.isSupport) || !isOptionalFiniteInteger(record.level)) {
    return false
  }
  if (record.realm !== undefined && !isRealm(record.realm)) {
    return false
  }
  if (typeof record.awakenerId === 'string' && !isPublicId('awakener', record.awakenerId)) {
    return false
  }
  if (typeof record.covenantId === 'string' && !isPublicId('covenant', record.covenantId)) {
    return false
  }
  const wheels = record.wheels as unknown[]
  if (wheels.some((wheelId) => typeof wheelId === 'string' && !isPublicId('wheel', wheelId))) {
    return false
  }

  const hasAwakener = hasNonEmptyString(record.awakenerId)
  if (!hasAwakener) {
    return !hasInvalidEmptySlotData(record)
  }

  return isRealm(record.realm)
}

function isPersistedTeam(value: unknown): value is PersistedBuilderTeam {
  if (!value || typeof value !== 'object') {
    return false
  }

  const record = value as Record<string, unknown>
  if (
    typeof record.id !== 'string' ||
    !record.id.trim() ||
    typeof record.name !== 'string' ||
    !record.name.trim()
  ) {
    return false
  }
  if (record.posseId !== undefined) {
    if (typeof record.posseId !== 'string' || !isPublicId('posse', record.posseId)) {
      return false
    }
  }

  if (!Array.isArray(record.slots) || record.slots.length !== 4) {
    return false
  }
  if (!record.slots.every(isPersistedSlot)) {
    return false
  }

  const slotIds = record.slots.map((slot) => slot.slotId)
  return new Set(slotIds).size === slotIds.length
}

export function isPersistedBuilderPayload(value: unknown): value is PersistedBuilderPayload {
  if (!value || typeof value !== 'object') {
    return false
  }

  const record = value as Record<string, unknown>
  if (typeof record.activeTeamId !== 'string') {
    return false
  }
  if (!Array.isArray(record.teams) || record.teams.length === 0) {
    return false
  }

  return record.teams.every(isPersistedTeam)
}

export function normalizeBuilderDraft(payload: BuilderDraftPayload): BuilderDraftPayload | null {
  if (!payload.teams.some((team) => team.id === payload.activeTeamId)) {
    return null
  }
  return {
    ...payload,
    teams: payload.teams.map((team) => ({
      ...team,
      slots: team.slots.map((slot) => {
        const legacySlot = slot as TeamSlot & {awakenerName?: string}
        const legacyFaction =
          'faction' in slot && typeof slot.faction === 'string' ? slot.faction : undefined
        const realm = slot.realm ?? legacyFaction
        const awakenerId =
          slot.awakenerId ??
          (legacySlot.awakenerName
            ? migrateBuilderAwakenerName(legacySlot.awakenerName)
            : undefined)
        if (awakenerId) {
          const {awakenerName: _legacyAwakenerName, ...slotWithoutLegacyName} = legacySlot
          return {
            ...slotWithoutLegacyName,
            awakenerId,
            realm,
          }
        }
        return {
          slotId: slot.slotId,
          awakenerId: undefined,
          realm: undefined,
          level: undefined,
          isSupport: undefined,
          wheels: [null, null] as [null, null],
          covenantId: undefined,
        }
      }),
    })),
  }
}

function serializeSlot(slot: TeamSlot): PersistedBuilderSlot | null {
  const awakenerId = slot.awakenerId
  const wheels = slot.wheels.map((wheelId) =>
    wheelId
      ? canonicalizePersistedId(wheelId, 'wheel', migrateWheelIdV1ToCurrent, CURRENT_WHEEL_IDS)
      : null,
  ) as [string | null, string | null]
  const covenantId = slot.covenantId
    ? canonicalizePersistedId(
        slot.covenantId,
        'covenant',
        migrateCovenantIdV1ToCurrent,
        CURRENT_COVENANT_IDS,
      )
    : undefined
  if (
    awakenerId &&
    (!isPublicId('awakener', awakenerId) || !CURRENT_AWAKENER_IDS.has(awakenerId))
  ) {
    return null
  }
  if (slot.wheels.some((wheelId, index) => wheelId && !wheels[index])) {
    return null
  }
  if (slot.covenantId && !covenantId) {
    return null
  }
  const persistedSlot: PersistedBuilderSlot = {
    slotId: slot.slotId,
    awakenerId,
    realm: awakenerId ? slot.realm : undefined,
    level: awakenerId ? slot.level : undefined,
    isSupport: awakenerId ? slot.isSupport : undefined,
    wheels,
  }
  if (covenantId) {
    persistedSlot.covenantId = covenantId
  }
  return persistedSlot
}

function hasNoAwakenerSlotWithData(payload: BuilderDraftPayload): boolean {
  return payload.teams.some((team) =>
    team.slots.some((slot) => {
      const legacySlot = slot as TeamSlot & {awakenerName?: string}
      if (hasNonEmptyString(slot.awakenerId)) {
        return false
      }
      if (hasNonEmptyString(legacySlot.awakenerName)) {
        return !migrateBuilderAwakenerName(legacySlot.awakenerName)
      }
      return hasInvalidEmptySlotData(slot)
    }),
  )
}

export function serializeBuilderDraft(
  payload: BuilderDraftPayload,
): PersistedBuilderPayload | null {
  if (hasNoAwakenerSlotWithData(payload)) {
    return null
  }

  const normalized = normalizeBuilderDraft(payload)
  if (!normalized) {
    return null
  }

  const teams: PersistedBuilderTeam[] = []
  for (const team of normalized.teams) {
    const posseId = team.posseId
      ? canonicalizePersistedId(team.posseId, 'posse', migrateBuilderPosseId, CURRENT_POSSE_IDS)
      : undefined
    if (team.posseId && !posseId) {
      return null
    }
    const slots = team.slots.map(serializeSlot)
    if (slots.some((slot) => !slot)) {
      return null
    }
    const persistedTeam: PersistedBuilderTeam = {
      id: team.id,
      name: team.name,
      slots: slots as PersistedBuilderSlot[],
    }
    if (posseId) {
      persistedTeam.posseId = posseId
    }
    teams.push(persistedTeam)
  }

  return {
    activeTeamId: normalized.activeTeamId,
    teams,
  }
}

function deserializeSlot(slot: PersistedBuilderSlot): TeamSlot | null {
  if (!slot.awakenerId) {
    return {
      slotId: slot.slotId,
      wheels: [null, null],
    }
  }

  if (!isPublicId('awakener', slot.awakenerId) || !CURRENT_AWAKENER_IDS.has(slot.awakenerId)) {
    return null
  }

  const wheels = slot.wheels.map((wheelId) => {
    if (!wheelId) {
      return null
    }
    return resolveRuntimeId(wheelId, CURRENT_WHEEL_IDS, WHEEL_ID_TO_LEGACY_ID) ?? null
  }) as [string | null, string | null]
  if (slot.wheels.some((wheelId, index) => wheelId && !wheels[index])) {
    return null
  }
  const covenantId = slot.covenantId
    ? resolveRuntimeId(slot.covenantId, CURRENT_COVENANT_IDS, COVENANT_ID_TO_LEGACY_ID)
    : undefined
  if (slot.covenantId && !covenantId) {
    return null
  }

  const runtimeSlot: TeamSlot = {
    slotId: slot.slotId,
    awakenerId: slot.awakenerId,
    realm: slot.realm,
    level: slot.level,
    wheels,
  }
  if (slot.isSupport !== undefined) {
    runtimeSlot.isSupport = slot.isSupport
  }
  if (covenantId) {
    runtimeSlot.covenantId = covenantId
  }
  return runtimeSlot
}

export function deserializeBuilderDraft(
  payload: PersistedBuilderPayload,
): BuilderDraftPayload | null {
  if (!payload.teams.some((team) => team.id === payload.activeTeamId)) {
    return null
  }

  const teams: Team[] = []
  for (const team of payload.teams) {
    const slots: TeamSlot[] = []
    for (const slot of team.slots) {
      const runtimeSlot = deserializeSlot(slot)
      if (!runtimeSlot) {
        return null
      }
      slots.push(runtimeSlot)
    }

    const posseId = team.posseId
      ? resolveRuntimeId(team.posseId, CURRENT_POSSE_IDS, POSSE_ID_TO_LEGACY_ID)
      : undefined
    if (team.posseId && !posseId) {
      return null
    }
    teams.push({...team, posseId, slots})
  }

  return {teams, activeTeamId: payload.activeTeamId}
}
