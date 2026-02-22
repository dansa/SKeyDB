import { getAwakeners } from './awakeners'
import { getCovenants } from './covenants'
import { getPosses } from './posses'
import { getWheels } from './wheels'
import { createEmptyTeamSlots } from '../pages/builder/constants'
import type { Team, TeamSlot } from '../pages/builder/types'

const singlePrefix = 't1.'
const multiPrefix = 'mt1.'
const slotsPerTeam = 4
const bytesPerSlot = 5
const bytesPerTeam = 1 + slotsPerTeam * bytesPerSlot

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
  | { kind: 'single'; team: Team }
  | { kind: 'multi'; teams: Team[]; activeTeamIndex: number }

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function base64UrlToBytes(value: string): Uint8Array {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4))
  const binary = atob(`${normalized}${padding}`)
  return Uint8Array.from(binary, (char) => char.charCodeAt(0))
}

function pushSlotBytes(buffer: number[], slot: TeamSlot) {
  const awakenerId = slot.awakenerName ? awakenerIdByName.get(slot.awakenerName) ?? 0 : 0
  if (awakenerId > 255) {
    throw new Error('Awakener ID exceeds export format limits.')
  }
  const level = awakenerId ? slot.level ?? 0 : 0
  if (level < 0 || level > 255) {
    throw new Error('Awakener level exceeds export format limits.')
  }
  const wheelOne = awakenerId && slot.wheels[0] ? wheelIndexById.get(slot.wheels[0]) ?? 0 : 0
  const wheelTwo = awakenerId && slot.wheels[1] ? wheelIndexById.get(slot.wheels[1]) ?? 0 : 0
  const covenant = awakenerId && slot.covenantId ? covenantIndexById.get(slot.covenantId) ?? 0 : 0
  if (wheelOne > 255 || wheelTwo > 255) {
    throw new Error('Equipment index exceeds export format limits.')
  }
  if (covenant > 255) {
    throw new Error('Covenant index exceeds export format limits.')
  }

  buffer.push(awakenerId, level, wheelOne, wheelTwo, covenant)
}

function pushTeamBytes(buffer: number[], team: Team) {
  const posseIndex = team.posseId ? posseIndexById.get(team.posseId) ?? 0 : 0
  if (posseIndex > 255) {
    throw new Error('Posse index exceeds export format limits.')
  }
  buffer.push(posseIndex)
  const fallbackSlots = createEmptyTeamSlots()
  for (let index = 0; index < slotsPerTeam; index += 1) {
    pushSlotBytes(buffer, team.slots[index] ?? fallbackSlots[index])
  }
}

function decodeSlot(bytes: Uint8Array, offset: number, slotId: string): TeamSlot {
  const awakenerId = bytes[offset]
  const level = bytes[offset + 1]
  const wheelOne = bytes[offset + 2]
  const wheelTwo = bytes[offset + 3]
  const covenant = bytes[offset + 4]

  const awakener = awakenerId ? awakenerById.get(awakenerId) : undefined
  if (awakenerId && !awakener) {
    throw new Error(`Unknown awakener id: ${awakenerId}`)
  }
  if (awakenerId && wheelOne && !wheelIdByIndex.has(wheelOne)) {
    throw new Error(`Unknown wheel index: ${wheelOne}`)
  }
  if (awakenerId && wheelTwo && !wheelIdByIndex.has(wheelTwo)) {
    throw new Error(`Unknown wheel index: ${wheelTwo}`)
  }
  if (awakenerId && covenant && !covenantIdByIndex.has(covenant)) {
    throw new Error(`Unknown covenant index: ${covenant}`)
  }

  return {
    slotId,
    awakenerName: awakener?.name,
    faction: awakener?.faction,
    level: awakener ? level || 60 : undefined,
    wheels: awakener
      ? [wheelOne ? wheelIdByIndex.get(wheelOne)! : null, wheelTwo ? wheelIdByIndex.get(wheelTwo)! : null]
      : [null, null],
    covenantId: awakener && covenant ? covenantIdByIndex.get(covenant) : undefined,
  }
}

function decodeTeam(bytes: Uint8Array, offset: number, teamIndex: number): { team: Team; nextOffset: number } {
  if (offset + 1 > bytes.length) {
    throw new Error('Corrupted import code: missing team header.')
  }
  const posseIndex = bytes[offset]
  let cursor = offset + 1

  if (posseIndex && !posseIdByIndex.has(posseIndex)) {
    throw new Error(`Unknown posse index: ${posseIndex}`)
  }

  if (cursor + slotsPerTeam * bytesPerSlot > bytes.length) {
    throw new Error('Corrupted import code: incomplete team slots.')
  }

  const emptySlots = createEmptyTeamSlots()
  const slots: TeamSlot[] = []
  for (let slotIndex = 0; slotIndex < slotsPerTeam; slotIndex += 1) {
    slots.push(decodeSlot(bytes, cursor, emptySlots[slotIndex].slotId))
    cursor += bytesPerSlot
  }

  return {
    team: {
      id: `imported-team-${teamIndex}-${crypto.randomUUID()}`,
      name: `Team ${teamIndex + 1}`,
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
  const activeTeamIndex = Math.max(0, teams.findIndex((team) => team.id === activeTeamId))
  if (activeTeamIndex > 255) {
    throw new Error('Active team index exceeds export format limits.')
  }

  const buffer: number[] = [activeTeamIndex, teams.length]
  teams.forEach((team) => pushTeamBytes(buffer, team))
  return `${multiPrefix}${bytesToBase64Url(Uint8Array.from(buffer))}`
}

export function decodeImportCode(code: string): DecodedImport {
  const trimmed = code.trim()
  if (!trimmed) {
    throw new Error('Import code is empty.')
  }

  if (trimmed.startsWith(singlePrefix)) {
    const bytes = base64UrlToBytes(trimmed.slice(singlePrefix.length))
    if (bytes.length !== bytesPerTeam) {
      throw new Error('Corrupted import code: invalid single-team payload length.')
    }
    const decoded = decodeTeam(bytes, 0, 0)
    if (decoded.nextOffset !== bytes.length) {
      throw new Error('Corrupted import code: trailing data in single-team payload.')
    }
    return { kind: 'single', team: decoded.team }
  }

  if (trimmed.startsWith(multiPrefix)) {
    const bytes = base64UrlToBytes(trimmed.slice(multiPrefix.length))
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
      const decoded = decodeTeam(bytes, offset, teamIndex)
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

  throw new Error('Unsupported import code prefix.')
}
