import {createEmptyTeamSlots} from '@/pages/builder/constants'
import type {Team, TeamSlot} from '@/pages/builder/types'

import {getAwakeners} from './awakeners'
import {getCovenants} from './covenants'
import {decodeIngameTeamCode, type IngameImportWarning} from './ingame-codec'
import {getPosses} from './posses'
import {getWheels} from './wheels'

const singlePrefix = 't1.'
const multiPrefix = 'mt1.'
const slotsPerTeam = 4
const bytesPerSlot = 5
const bytesPerTeam = 1 + slotsPerTeam * bytesPerSlot
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
const posseIndexById = new Map(posses.map((posse) => [posse.id, posse.index]))
const posseIdByIndex = new Map(posses.map((posse) => [posse.index, posse.id]))
const wheelIndexById = new Map(wheels.map((wheel, index) => [wheel.id, index + 1]))
const wheelIdByIndex = new Map(wheels.map((wheel, index) => [index + 1, wheel.id]))
const covenantIndexById = new Map(covenants.map((covenant, index) => [covenant.id, index + 1]))
const covenantIdByIndex = new Map(covenants.map((covenant, index) => [index + 1, covenant.id]))

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
  const awakenerId = slot.awakenerName ? (awakenerIdByName.get(slot.awakenerName) ?? 0) : 0
  if (awakenerId > 255) {
    throw new Error('Awakener ID exceeds export format limits.')
  }
  const rawLevel = awakenerId ? (slot.level ?? 0) : 0
  if (rawLevel < 0 || rawLevel > levelValueMask) {
    throw new Error('Awakener level exceeds export format limits.')
  }
  const level =
    options?.includeSupport && awakenerId && slot.isSupport ? rawLevel | supportLevelFlag : rawLevel
  const wheelOne = awakenerId && slot.wheels[0] ? (wheelIndexById.get(slot.wheels[0]) ?? 0) : 0
  const wheelTwo = awakenerId && slot.wheels[1] ? (wheelIndexById.get(slot.wheels[1]) ?? 0) : 0
  const covenant = awakenerId && slot.covenantId ? (covenantIndexById.get(slot.covenantId) ?? 0) : 0
  if (wheelOne > 255 || wheelTwo > 255) {
    throw new Error('Equipment index exceeds export format limits.')
  }
  if (covenant > 255) {
    throw new Error('Covenant index exceeds export format limits.')
  }

  buffer.push(awakenerId, level, wheelOne, wheelTwo, covenant)
}

function pushTeamBytes(buffer: number[], team: Team, options?: {includeSupport?: boolean}) {
  const posseIndex = team.posseId ? (posseIndexById.get(team.posseId) ?? 0) : 0
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

  const awakener = awakenerById.get(awakenerId)
  if (!awakener) {
    throw new Error(`Unknown awakener id: ${String(awakenerId)}`)
  }
  return awakener
}

function getDecodedWheelId(wheelIndex: number): string | null {
  if (!wheelIndex) {
    return null
  }

  const wheelId = wheelIdByIndex.get(wheelIndex)
  if (!wheelId) {
    throw new Error(`Unknown wheel index: ${String(wheelIndex)}`)
  }
  return wheelId
}

function getDecodedCovenantId(covenantIndex: number): string | undefined {
  if (!covenantIndex) {
    return undefined
  }

  const covenantId = covenantIdByIndex.get(covenantIndex)
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

  const awakener = getDecodedAwakener(awakenerId)
  const decodedWheels: [string | null, string | null] = awakener
    ? [getDecodedWheelId(wheelOne), getDecodedWheelId(wheelTwo)]
    : [null, null]
  const covenantId = awakener ? getDecodedCovenantId(covenant) : undefined

  return {
    slotId,
    awakenerName: awakener?.name,
    realm: awakener?.realm,
    level: awakener ? level || 60 : undefined,
    isSupport: awakener && isSupport ? true : undefined,
    wheels: decodedWheels,
    covenantId,
  }
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

  if (posseIndex && !posseIdByIndex.has(posseIndex)) {
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
      posseId: posseIndex ? posseIdByIndex.get(posseIndex) : undefined,
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
  if (teams.length > 255) {
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
