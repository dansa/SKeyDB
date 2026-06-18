import {createEmptyTeamSlots} from '@/features/builder/constants'
import type {Team, TeamSlot} from '@/features/builder/types'

import {getAwakeners} from './awakeners'
import {getCovenants} from './covenants'
import {decodeIngameTeamCode, type IngameImportWarning} from './ingame-codec'
import {
  migrateAwakenerNameV1ToCurrent,
  migrateCovenantIdV1ToCurrent,
  migratePosseIdV1ToCurrent,
  migrateWheelIdV1ToCurrent,
} from './persistence-id-migration'
import {getPosses} from './posses'
import standardCodeContract from './standard-code-contract.v1.json'
import {getWheels} from './wheels'

const singlePrefix = 't1.'
const multiPrefix = 'mt1.'
const slotsPerTeam = 4
const bytesPerSlot = 5
const bytesPerTeam = 1 + slotsPerTeam * bytesPerSlot
const maxStandardTeamCount = 255
const maxSingleTeamStandardCodeLength =
  singlePrefix.length + getBase64UrlEncodedLength(bytesPerTeam)
const maxMultiTeamStandardCodeLength =
  multiPrefix.length + getBase64UrlEncodedLength(2 + maxStandardTeamCount * bytesPerTeam)
const maxWrappedIngameCodeLength = 512
export const maxImportCodeCandidateLength = Math.max(
  maxSingleTeamStandardCodeLength,
  maxMultiTeamStandardCodeLength,
  maxWrappedIngameCodeLength,
)
const ingameCodePattern = /@@[A-Za-z0-9]+@@/
const standardCodePattern = /\b(?:mt1|t1)\.[A-Za-z0-9_-]+\b/
// `mt1.` reuses the high bit of the per-slot level byte for support state.
// Old payloads remain unambiguous because builder levels stay within 1..90.
const supportLevelFlag = 0x80
const levelValueMask = 0x7f

const awakeners = getAwakeners()
const covenants = getCovenants()
const posses = getPosses()
const wheels = getWheels()

const awakenerIdByName = new Map(awakeners.map((awakener) => [awakener.name, awakener.id]))
const awakenerById = new Map(awakeners.map((awakener) => [awakener.id, awakener]))
const awakenerByLegacyName = new Map(
  awakeners.map((awakener) => [awakener.name.toLowerCase(), awakener]),
)
const currentWheelIds = new Set(wheels.map((wheel) => wheel.id))
const currentCovenantIds = new Set(covenants.map((covenant) => covenant.id))
const currentPosseIds = new Set(posses.map((posse) => posse.id))

function getBase64UrlEncodedLength(byteLength: number): number {
  const remainder = byteLength % 3
  const paddingLength = remainder === 0 ? 0 : 3 - remainder
  return Math.ceil(byteLength / 3) * 4 - paddingLength
}

interface StandardCodeEntry {
  codecIndex: number
  legacyId: number | string
  legacyName?: string
  id: string
}

interface StandardCodeContract {
  awakeners: StandardCodeEntry[]
  wheels: StandardCodeEntry[]
  covenants: StandardCodeEntry[]
  posses: StandardCodeEntry[]
}

const standardCode = standardCodeContract as StandardCodeContract
const standardAwakenerIndexById = new Map(
  standardCode.awakeners.map((entry) => [entry.id, entry.codecIndex]),
)
const standardAwakenerIdByIndex = new Map(
  standardCode.awakeners.map((entry) => [entry.codecIndex, entry.id]),
)
const standardWheelIndexById = new Map(
  standardCode.wheels.map((entry) => [entry.id, entry.codecIndex]),
)
const standardWheelIdByIndex = new Map(
  standardCode.wheels.map((entry) => [entry.codecIndex, entry.id]),
)
const standardWheelLegacyIdByIndex = new Map(
  standardCode.wheels.map((entry) => [entry.codecIndex, String(entry.legacyId)]),
)
const standardCovenantIndexById = new Map(
  standardCode.covenants.map((entry) => [entry.id, entry.codecIndex]),
)
const standardCovenantIdByIndex = new Map(
  standardCode.covenants.map((entry) => [entry.codecIndex, entry.id]),
)
const standardCovenantLegacyIdByIndex = new Map(
  standardCode.covenants.map((entry) => [entry.codecIndex, String(entry.legacyId)]),
)
const standardPosseIndexById = new Map(
  standardCode.posses.map((entry) => [entry.id, entry.codecIndex]),
)
const standardPosseIdByIndex = new Map(
  standardCode.posses.map((entry) => [entry.codecIndex, entry.id]),
)
const standardPosseLegacyIdByIndex = new Map(
  standardCode.posses.map((entry) => [entry.codecIndex, String(entry.legacyId)]),
)

function getAwakenerStandardIdByName(awakenerName: string): string | undefined {
  const currentId = migrateAwakenerNameV1ToCurrent(awakenerName)
  if (currentId) {
    return currentId
  }

  const runtimeId = awakenerIdByName.get(awakenerName)
  return runtimeId && standardAwakenerIndexById.has(runtimeId) ? runtimeId : undefined
}

function getAwakenerStandardId(slot: TeamSlot): string | undefined {
  if (slot.awakenerId) {
    return standardAwakenerIndexById.has(slot.awakenerId) ? slot.awakenerId : undefined
  }
  const legacyName = (slot as TeamSlot & {awakenerName?: string}).awakenerName
  return legacyName ? getAwakenerStandardIdByName(legacyName) : undefined
}

function getStandardWheelId(wheelId: string): string | undefined {
  return standardWheelIndexById.has(wheelId) ? wheelId : migrateWheelIdV1ToCurrent(wheelId)
}

function getStandardCovenantId(covenantId: string): string | undefined {
  return standardCovenantIndexById.has(covenantId)
    ? covenantId
    : migrateCovenantIdV1ToCurrent(covenantId)
}

function getStandardPosseId(posseId: string): string | undefined {
  return standardPosseIndexById.has(posseId) ? posseId : migratePosseIdV1ToCurrent(posseId)
}

function resolveCurrentId(
  publicId: string | undefined,
  currentIds: Set<string>,
  legacyId: string | undefined,
): string | undefined {
  if (publicId && currentIds.has(publicId)) {
    return publicId
  }
  return legacyId
}

export type DecodedImport =
  | {kind: 'single'; team: Team; warnings?: IngameImportWarning[]}
  | {kind: 'multi'; teams: Team[]; activeTeamIndex: number}

function extractImportCodeCandidate(rawValue: string): string {
  const trimmed = rawValue.trim()
  if (!trimmed) {
    return ''
  }

  if (
    trimmed.startsWith(singlePrefix) ||
    trimmed.startsWith(multiPrefix) ||
    (trimmed.startsWith('@@') && trimmed.endsWith('@@'))
  ) {
    return trimmed
  }

  const ingameMatch = ingameCodePattern.exec(trimmed)
  if (ingameMatch) {
    return ingameMatch[0]
  }

  const standardMatch = standardCodePattern.exec(trimmed)
  if (standardMatch) {
    return standardMatch[0]
  }

  return trimmed
}

function getImportCodeLengthLimit(candidate: string): number {
  if (candidate.startsWith(singlePrefix)) {
    return maxSingleTeamStandardCodeLength
  }
  if (candidate.startsWith(multiPrefix)) {
    return maxMultiTeamStandardCodeLength
  }
  if (candidate.startsWith('@@') && candidate.endsWith('@@')) {
    return maxWrappedIngameCodeLength
  }
  return maxImportCodeCandidateLength
}

function assertImportCodeLengthWithinLimit(candidate: string) {
  if (candidate.length > getImportCodeLengthLimit(candidate)) {
    throw new Error('Import code is too long.')
  }
}

export function isImportCodeCandidateTooLong(value: string): boolean {
  const candidate = extractImportCodeCandidate(value)
  return candidate.length > getImportCodeLengthLimit(candidate)
}

function trimTrailingPadding(value: string): string {
  let end = value.length
  while (end > 0 && value[end - 1] === '=') {
    end -= 1
  }
  return value.slice(0, end)
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return trimTrailingPadding(btoa(binary).replace(/\+/g, '-').replace(/\//g, '_'))
}

function base64UrlToBytes(value: string): Uint8Array {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4))
  const binary = atob(`${normalized}${padding}`)
  return Uint8Array.from(binary, (char) => char.charCodeAt(0))
}

function pushSlotBytes(buffer: number[], slot: TeamSlot, options?: {includeSupport?: boolean}) {
  const awakenerStandardId = getAwakenerStandardId(slot)
  const legacyName = (slot as TeamSlot & {awakenerName?: string}).awakenerName
  if ((slot.awakenerId || legacyName) && !awakenerStandardId) {
    const awakenerLabel = slot.awakenerId ?? legacyName ?? 'unknown'
    throw new Error(
      `Awakener "${awakenerLabel}" is not representable in the frozen standard export format.`,
    )
  }
  const awakenerIndex = awakenerStandardId
    ? (standardAwakenerIndexById.get(awakenerStandardId) ?? 0)
    : 0
  if (awakenerIndex > 255) {
    throw new Error('Awakener ID exceeds export format limits.')
  }
  const rawLevel = awakenerIndex ? (slot.level ?? 0) : 0
  if (rawLevel < 0 || rawLevel > levelValueMask) {
    throw new Error('Awakener level exceeds export format limits.')
  }
  const level =
    options?.includeSupport && awakenerIndex && slot.isSupport
      ? rawLevel | supportLevelFlag
      : rawLevel
  const wheelOneStandardId = slot.wheels[0] ? getStandardWheelId(slot.wheels[0]) : undefined
  const wheelTwoStandardId = slot.wheels[1] ? getStandardWheelId(slot.wheels[1]) : undefined
  const covenantStandardId = slot.covenantId ? getStandardCovenantId(slot.covenantId) : undefined
  if (awakenerIndex && slot.wheels[0] && !wheelOneStandardId) {
    throw new Error(
      `Wheel "${slot.wheels[0]}" is not representable in the frozen standard export format.`,
    )
  }
  if (awakenerIndex && slot.wheels[1] && !wheelTwoStandardId) {
    throw new Error(
      `Wheel "${slot.wheels[1]}" is not representable in the frozen standard export format.`,
    )
  }
  if (awakenerIndex && slot.covenantId && !covenantStandardId) {
    throw new Error(
      `Covenant "${slot.covenantId}" is not representable in the frozen standard export format.`,
    )
  }
  const wheelOne =
    awakenerIndex && wheelOneStandardId ? (standardWheelIndexById.get(wheelOneStandardId) ?? 0) : 0
  const wheelTwo =
    awakenerIndex && wheelTwoStandardId ? (standardWheelIndexById.get(wheelTwoStandardId) ?? 0) : 0
  const covenant =
    awakenerIndex && covenantStandardId
      ? (standardCovenantIndexById.get(covenantStandardId) ?? 0)
      : 0
  if (wheelOne > 255 || wheelTwo > 255) {
    throw new Error('Equipment index exceeds export format limits.')
  }
  if (covenant > 255) {
    throw new Error('Covenant index exceeds export format limits.')
  }

  buffer.push(awakenerIndex, level, wheelOne, wheelTwo, covenant)
}

function pushTeamBytes(buffer: number[], team: Team, options?: {includeSupport?: boolean}) {
  const posseStandardId = team.posseId ? getStandardPosseId(team.posseId) : undefined
  if (team.posseId && !posseStandardId) {
    throw new Error(
      `Posse "${team.posseId}" is not representable in the frozen standard export format.`,
    )
  }
  const posseIndex = posseStandardId ? (standardPosseIndexById.get(posseStandardId) ?? 0) : 0
  if (posseIndex > 255) {
    throw new Error('Posse index exceeds export format limits.')
  }
  buffer.push(posseIndex)
  const fallbackSlots = createEmptyTeamSlots()
  for (let index = 0; index < slotsPerTeam; index += 1) {
    pushSlotBytes(buffer, team.slots[index] ?? fallbackSlots[index], options)
  }
}

function getDecodedAwakener(awakenerId: number) {
  if (!awakenerId) {
    return undefined
  }

  const standardId = standardAwakenerIdByIndex.get(awakenerId)
  const currentAwakener = standardId ? awakenerById.get(standardId) : undefined
  if (currentAwakener) {
    return currentAwakener
  }

  const contractEntry = standardCode.awakeners.find((entry) => entry.id === standardId)
  const awakener =
    typeof contractEntry?.legacyName === 'string'
      ? awakenerByLegacyName.get(contractEntry.legacyName.toLowerCase())
      : undefined
  if (!awakener) {
    throw new Error(`Unknown awakener id: ${String(awakenerId)}`)
  }
  return awakener
}

function getDecodedWheelId(wheelIndex: number): string | null {
  if (!wheelIndex) {
    return null
  }

  const standardId = standardWheelIdByIndex.get(wheelIndex)
  const wheelId =
    resolveCurrentId(standardId, currentWheelIds, undefined) ??
    standardWheelLegacyIdByIndex.get(wheelIndex)
  if (!wheelId) {
    throw new Error(`Unknown wheel index: ${String(wheelIndex)}`)
  }
  return wheelId
}

function getDecodedCovenantId(covenantIndex: number): string | undefined {
  if (!covenantIndex) {
    return undefined
  }

  const standardId = standardCovenantIdByIndex.get(covenantIndex)
  const covenantId =
    resolveCurrentId(standardId, currentCovenantIds, undefined) ??
    standardCovenantLegacyIdByIndex.get(covenantIndex)
  if (!covenantId) {
    throw new Error(`Unknown covenant index: ${String(covenantIndex)}`)
  }
  return covenantId
}

function decodeSlot(
  bytes: Uint8Array,
  offset: number,
  slotId: string,
  options?: {includeSupport?: boolean},
): TeamSlot {
  const awakenerId = bytes[offset]
  const encodedLevel = bytes[offset + 1]
  const wheelOne = bytes[offset + 2]
  const wheelTwo = bytes[offset + 3]
  const covenant = bytes[offset + 4]
  const isSupport = options?.includeSupport ? (encodedLevel & supportLevelFlag) !== 0 : false
  const level = encodedLevel & levelValueMask

  const decodedAwakener = getDecodedAwakener(awakenerId)
  const decodedWheels: [string | null, string | null] = decodedAwakener
    ? [getDecodedWheelId(wheelOne), getDecodedWheelId(wheelTwo)]
    : [null, null]
  const covenantId = decodedAwakener ? getDecodedCovenantId(covenant) : undefined
  const slot: TeamSlot = {
    slotId,
    wheels: decodedWheels,
  }
  if (decodedAwakener) {
    slot.awakenerId = decodedAwakener.id
    slot.realm = decodedAwakener.realm
    slot.level = level || 60
  }
  if (decodedAwakener && isSupport) {
    slot.isSupport = true
  }
  if (covenantId) {
    slot.covenantId = covenantId
  }
  return slot
}

function decodeTeam(
  bytes: Uint8Array,
  offset: number,
  teamIndex: number,
  options?: {includeSupport?: boolean},
): {team: Team; nextOffset: number} {
  if (offset + 1 > bytes.length) {
    throw new Error('Corrupted import code: missing team header.')
  }
  const posseIndex = bytes[offset]
  let cursor = offset + 1

  const standardPosseId = posseIndex ? standardPosseIdByIndex.get(posseIndex) : undefined
  if (posseIndex && !standardPosseId) {
    throw new Error(`Unknown posse index: ${String(posseIndex)}`)
  }
  const posseId =
    resolveCurrentId(standardPosseId, currentPosseIds, undefined) ??
    standardPosseLegacyIdByIndex.get(posseIndex)
  if (posseIndex && !posseId) {
    throw new Error(`Unknown posse index: ${String(posseIndex)}`)
  }

  if (cursor + slotsPerTeam * bytesPerSlot > bytes.length) {
    throw new Error('Corrupted import code: incomplete team slots.')
  }

  const emptySlots = createEmptyTeamSlots()
  const slots: TeamSlot[] = []
  for (const slot of emptySlots) {
    slots.push(decodeSlot(bytes, cursor, slot.slotId, options))
    cursor += bytesPerSlot
  }

  return {
    team: {
      id: `imported-team-${String(teamIndex)}-${crypto.randomUUID()}`,
      name: `Team ${String(teamIndex + 1)}`,
      slots,
      posseId,
    },
    nextOffset: cursor,
  }
}

export function encodeSingleTeamCode(team: Team): string {
  const buffer: number[] = []
  pushTeamBytes(buffer, team)
  return `${singlePrefix}${bytesToBase64Url(Uint8Array.from(buffer))}`
}

export function encodeMultiTeamCode(teams: Team[], activeTeamId: string): string {
  if (teams.length > maxStandardTeamCount) {
    throw new Error('Too many teams to export.')
  }
  const activeTeamIndex = Math.max(
    0,
    teams.findIndex((team) => team.id === activeTeamId),
  )
  if (activeTeamIndex > 255) {
    throw new Error('Active team index exceeds export format limits.')
  }

  const buffer: number[] = [activeTeamIndex, teams.length]
  for (const team of teams) {
    pushTeamBytes(buffer, team, {includeSupport: true})
  }
  return `${multiPrefix}${bytesToBase64Url(Uint8Array.from(buffer))}`
}

function decodeSingleTeamImport(payload: string): DecodedImport {
  const bytes = base64UrlToBytes(payload)
  if (bytes.length !== bytesPerTeam) {
    throw new Error('Corrupted import code: invalid single-team payload length.')
  }

  const decoded = decodeTeam(bytes, 0, 0)
  if (decoded.nextOffset !== bytes.length) {
    throw new Error('Corrupted import code: trailing data in single-team payload.')
  }

  return {kind: 'single', team: decoded.team}
}

function decodeMultiTeamImport(payload: string): DecodedImport {
  const bytes = base64UrlToBytes(payload)
  if (bytes.length < 2) {
    throw new Error('Corrupted import code: missing multi-team header.')
  }

  const activeTeamIndex = bytes[0]
  const teamCount = bytes[1]
  if (activeTeamIndex >= teamCount) {
    throw new Error('Corrupted import code: invalid active team index.')
  }
  if (bytes.length !== 2 + teamCount * bytesPerTeam) {
    throw new Error('Corrupted import code: invalid multi-team payload length.')
  }

  let offset = 2
  const teams: Team[] = []
  for (let teamIndex = 0; teamIndex < teamCount; teamIndex += 1) {
    const decoded = decodeTeam(bytes, offset, teamIndex, {includeSupport: true})
    teams.push(decoded.team)
    offset = decoded.nextOffset
  }
  if (offset !== bytes.length) {
    throw new Error('Corrupted import code: trailing data in multi-team payload.')
  }

  return {
    kind: 'multi',
    activeTeamIndex,
    teams,
  }
}

function decodeWrappedIngameImport(payload: string): DecodedImport {
  const decoded = decodeIngameTeamCode(payload)
  return {
    kind: 'single',
    team: decoded.team,
    warnings: decoded.warnings,
  }
}

export function decodeImportCode(code: string): DecodedImport {
  const trimmed = extractImportCodeCandidate(code)
  if (!trimmed) {
    throw new Error('Import code is empty.')
  }
  assertImportCodeLengthWithinLimit(trimmed)

  if (trimmed.startsWith(singlePrefix)) {
    return decodeSingleTeamImport(trimmed.slice(singlePrefix.length))
  }

  if (trimmed.startsWith(multiPrefix)) {
    return decodeMultiTeamImport(trimmed.slice(multiPrefix.length))
  }

  if (trimmed.startsWith('@@') && trimmed.endsWith('@@')) {
    return decodeWrappedIngameImport(trimmed)
  }

  throw new Error('Unsupported import code prefix.')
}
