import {createEmptyTeamSlots} from '@/features/builder/constants'
import type {Team, TeamSlot} from '@/features/builder/types'

import {getAwakeners} from './awakeners'
import {buildIngameTokenDictionaries} from './ingame-token-dictionaries'
import {getWheels} from './wheels'

const INGAME_WRAPPER = '@@'
const TEAM_SLOT_COUNT = 4
const EMPTY_COVENANT_TOKEN = 'a'
const POSSE_TOKEN_LENGTH = 1
const WHEEL_TOKENS_PER_SLOT = 2
const WARNING_TOKEN_PREVIEW_LIMIT = 32

export interface IngameImportWarning {
  section: 'awakener' | 'wheel' | 'covenant' | 'posse'
  slotIndex?: number
  field?: 'wheelOne' | 'wheelTwo'
  token: string
  reason: 'unknown_token' | 'ambiguous_parse'
  candidateIds?: string[]
}

export interface DecodedIngameTeamCode {
  team: Team
  warnings: IngameImportWarning[]
}

interface WheelCandidate {
  token: string
  wheelId?: string
  candidateIds?: string[]
  unknown?: boolean
}

type IngameTokenDictionaries = ReturnType<typeof buildIngameTokenDictionaries>

function truncateWarningToken(token: string): string {
  return token.length > WARNING_TOKEN_PREVIEW_LIMIT
    ? token.slice(0, WARNING_TOKEN_PREVIEW_LIMIT)
    : token
}

function normalizeWrappedPayload(code: string): string {
  const trimmed = code.trim()
  if (!trimmed.startsWith(INGAME_WRAPPER) || !trimmed.endsWith(INGAME_WRAPPER)) {
    throw new Error('Invalid in-game code wrapper. Expected @@...@@.')
  }
  const payload = trimmed.slice(INGAME_WRAPPER.length, -INGAME_WRAPPER.length)
  if (!payload) {
    throw new Error('In-game code payload is empty.')
  }
  return payload
}

function buildLongestTokenList(tokens: Iterable<string>): string[] {
  return Array.from(tokens).sort((left, right) => {
    if (right.length !== left.length) {
      return right.length - left.length
    }
    return left.localeCompare(right)
  })
}

function findLongestTokenAt(payload: string, cursor: number, tokenList: string[]): string | null {
  for (const token of tokenList) {
    if (payload.startsWith(token, cursor)) {
      return token
    }
  }
  return null
}

function getWheelCandidatesAt(
  payload: string,
  cursor: number,
  wheelIdsByToken: Map<string, string[]>,
  sortedWheelTokens: string[],
): WheelCandidate[] {
  const candidates: WheelCandidate[] = []
  if (payload[cursor] === 'a') {
    candidates.push({token: 'a'})
  }

  for (const token of sortedWheelTokens) {
    if (!payload.startsWith(token, cursor)) {
      continue
    }
    const candidateIds = wheelIdsByToken.get(token) ?? []
    candidates.push({
      token,
      wheelId: candidateIds.length === 1 ? candidateIds[0] : undefined,
      candidateIds,
    })
  }

  if (candidates.length === 0 && cursor < payload.length) {
    candidates.push({token: payload[cursor], unknown: true})
  }

  return candidates
}

function parseWheelToken(
  payload: string,
  cursor: number,
  wheelIdsByToken: Map<string, string[]>,
  sortedWheelTokens: string[],
): {candidate: WheelCandidate; nextCursor: number} {
  const candidates = getWheelCandidatesAt(payload, cursor, wheelIdsByToken, sortedWheelTokens)
  const candidate = candidates[0] ?? {token: payload[cursor] ?? 'a', unknown: true}
  return {
    candidate,
    nextCursor: cursor + candidate.token.length,
  }
}

function pushAmbiguousWarning(
  warnings: IngameImportWarning[],
  section: IngameImportWarning['section'],
  token: string,
  candidateIds: string[],
  options: {slotIndex?: number; field?: 'wheelOne' | 'wheelTwo'} = {},
) {
  warnings.push({
    section,
    slotIndex: options.slotIndex,
    field: options.field,
    token: truncateWarningToken(token),
    reason: 'ambiguous_parse',
    candidateIds,
  })
}

function pushUnknownAwakenerWarning(
  warnings: IngameImportWarning[],
  slotIndex: number,
  token: string,
) {
  warnings.push({
    section: 'awakener',
    slotIndex,
    token: truncateWarningToken(token),
    reason: 'unknown_token',
  })
}

function decodeAwakenerSlots(
  payload: string,
  dictionaries: IngameTokenDictionaries,
  awakeningById: Map<string, Awaited<ReturnType<typeof getAwakeners>>[number]>,
  emptySlots: TeamSlot[],
  warnings: IngameImportWarning[],
): {slots: TeamSlot[]; cursor: number} {
  const awakenerTokenList = buildLongestTokenList(dictionaries.awakeners.byTokenIds.keys())
  let cursor = 0
  const slots: TeamSlot[] = emptySlots.map((slot) => ({...slot, wheels: [null, null]}))

  for (let slotIndex = 0; slotIndex < TEAM_SLOT_COUNT; slotIndex += 1) {
    if (cursor >= payload.length) {
      throw new Error('Corrupted in-game code: missing awakener tokens.')
    }

    const token = findLongestTokenAt(payload, cursor, awakenerTokenList)
    if (!token) {
      pushUnknownAwakenerWarning(warnings, slotIndex, payload[cursor])
      cursor += 1
      continue
    }

    const candidateIds = dictionaries.awakeners.byTokenIds.get(token) ?? []
    if (candidateIds.length > 1) {
      pushAmbiguousWarning(warnings, 'awakener', token, candidateIds, {slotIndex})
      cursor += token.length
      continue
    }

    const awakenerId = candidateIds[0]
    const awakener = awakenerId ? awakeningById.get(awakenerId) : undefined
    if (!awakener) {
      pushUnknownAwakenerWarning(warnings, slotIndex, token)
      cursor += token.length
      continue
    }

    slots[slotIndex] = {
      ...slots[slotIndex],
      awakenerId: awakener.id,
      realm: awakener.realm,
      level: 60,
    }
    cursor += token.length
  }

  return {slots, cursor}
}

function decodeWheelCandidates(
  payload: string,
  cursor: number,
  dictionaries: IngameTokenDictionaries,
): {wheelCandidates: WheelCandidate[]; cursor: number} {
  const wheelTokenList = buildLongestTokenList(dictionaries.wheels.byTokenIds.keys())
  const wheelCandidates: WheelCandidate[] = []

  for (let index = 0; index < TEAM_SLOT_COUNT * WHEEL_TOKENS_PER_SLOT; index += 1) {
    if (cursor >= payload.length - POSSE_TOKEN_LENGTH) {
      throw new Error('Corrupted in-game code: missing wheel token block.')
    }

    const parsed = parseWheelToken(payload, cursor, dictionaries.wheels.byTokenIds, wheelTokenList)
    wheelCandidates.push(parsed.candidate)
    cursor = parsed.nextCursor
  }

  return {wheelCandidates, cursor}
}

function resolveDecodedWheelId(
  candidate: WheelCandidate | undefined,
  slotIndex: number,
  field: 'wheelOne' | 'wheelTwo',
  wheelById: Map<string, Awaited<ReturnType<typeof getWheels>>[number]>,
  warnings: IngameImportWarning[],
): string | null {
  const wheelId = candidate?.wheelId
  const candidateIds = candidate?.candidateIds ?? []
  if (candidate && candidateIds.length > 1) {
    pushAmbiguousWarning(warnings, 'wheel', candidate.token, candidateIds, {slotIndex, field})
    return null
  }

  if (wheelId && wheelById.has(wheelId)) {
    return wheelId
  }

  if (candidate && candidate.token !== 'a') {
    warnings.push({
      section: 'wheel',
      slotIndex,
      field,
      token: truncateWarningToken(candidate.token),
      reason: 'unknown_token',
    })
  }

  return null
}

function normalizeDecodedEquipment(
  slots: TeamSlot[],
  wheelCandidates: WheelCandidate[],
  covenantBlock: string,
  dictionaries: IngameTokenDictionaries,
  wheelById: Map<string, Awaited<ReturnType<typeof getWheels>>[number]>,
  warnings: IngameImportWarning[],
): TeamSlot[] {
  const covenantTokensBySlot = decodeCovenantTokens(covenantBlock, dictionaries, warnings)
  const nextSlots = [...slots]

  for (let slotIndex = 0; slotIndex < TEAM_SLOT_COUNT; slotIndex += 1) {
    nextSlots[slotIndex] = {
      ...nextSlots[slotIndex],
      wheels: [
        resolveDecodedWheelId(
          wheelCandidates[slotIndex * 2],
          slotIndex,
          'wheelOne',
          wheelById,
          warnings,
        ),
        resolveDecodedWheelId(
          wheelCandidates[slotIndex * 2 + 1],
          slotIndex,
          'wheelTwo',
          wheelById,
          warnings,
        ),
      ],
      covenantId: resolveDecodedCovenantId(
        covenantTokensBySlot[slotIndex],
        slotIndex,
        dictionaries,
        warnings,
      ),
    }
  }

  return nextSlots
}

function parseCovenantToken(
  covenantBlock: string,
  cursor: number,
  tokenList: string[],
): {token: string; nextCursor: number; unknown?: boolean} {
  if (covenantBlock[cursor] === 'a') {
    return {
      token: 'a',
      nextCursor: cursor + 1,
    }
  }

  const token = findLongestTokenAt(covenantBlock, cursor, tokenList)
  if (token) {
    return {
      token,
      nextCursor: cursor + token.length,
    }
  }

  return {
    token: covenantBlock[cursor] ?? 'a',
    nextCursor: cursor + 1,
    unknown: true,
  }
}

function decodeCovenantTokens(
  covenantBlock: string,
  dictionaries: IngameTokenDictionaries,
  warnings: IngameImportWarning[],
): string[] {
  const tokenList = buildLongestTokenList(dictionaries.covenants.byTokenIds.keys())
  const tokensBySlot: string[] = []
  let cursor = 0

  for (let slotIndex = 0; slotIndex < TEAM_SLOT_COUNT; slotIndex += 1) {
    if (cursor >= covenantBlock.length) {
      throw new Error('Corrupted in-game code: incomplete covenant block.')
    }
    const parsed = parseCovenantToken(covenantBlock, cursor, tokenList)
    if (parsed.unknown) {
      warnings.push({
        section: 'covenant',
        slotIndex,
        token: truncateWarningToken(parsed.token),
        reason: 'unknown_token',
      })
    }
    tokensBySlot.push(parsed.token)
    cursor = parsed.nextCursor
  }

  if (cursor < covenantBlock.length) {
    warnings.push({
      section: 'covenant',
      slotIndex: TEAM_SLOT_COUNT - 1,
      token: truncateWarningToken(covenantBlock.slice(cursor)),
      reason: 'unknown_token',
    })
  }

  return tokensBySlot
}

function resolveDecodedCovenantId(
  token: string | undefined,
  slotIndex: number,
  dictionaries: IngameTokenDictionaries,
  warnings: IngameImportWarning[],
): string | undefined {
  if (!token || token === 'a') {
    return undefined
  }

  const candidateIds = dictionaries.covenants.byTokenIds.get(token) ?? []
  if (candidateIds.length > 1) {
    pushAmbiguousWarning(warnings, 'covenant', token, candidateIds, {slotIndex})
    return undefined
  }

  const covenantId = candidateIds[0]
  if (!covenantId) {
    warnings.push({
      section: 'covenant',
      slotIndex,
      token: truncateWarningToken(token),
      reason: 'unknown_token',
    })
    return undefined
  }

  return covenantId
}

function decodePosseId(
  payload: string,
  dictionaries: IngameTokenDictionaries,
  warnings: IngameImportWarning[],
): string | undefined {
  const posseToken = payload[payload.length - 1]
  const candidateIds = dictionaries.posses.byTokenIds.get(posseToken) ?? []
  if (candidateIds.length > 1) {
    pushAmbiguousWarning(warnings, 'posse', posseToken, candidateIds)
    return undefined
  }

  const posseId = candidateIds[0]
  if (posseToken !== 'a' && !posseId) {
    warnings.push({
      section: 'posse',
      token: truncateWarningToken(posseToken),
      reason: 'unknown_token',
    })
  }

  return posseId
}

export function decodeIngameTeamCode(code: string): DecodedIngameTeamCode {
  const payload = normalizeWrappedPayload(code)
  const dictionaries = buildIngameTokenDictionaries()

  const warnings: IngameImportWarning[] = []
  const emptySlots = createEmptyTeamSlots()

  const awakeners = getAwakeners()
  const awakeningById = new Map(awakeners.map((awakener) => [awakener.id, awakener]))
  const wheelById = new Map(getWheels().map((wheel) => [wheel.id, wheel]))

  const decodedAwakeners = decodeAwakenerSlots(
    payload,
    dictionaries,
    awakeningById,
    emptySlots,
    warnings,
  )
  const decodedWheels = decodeWheelCandidates(payload, decodedAwakeners.cursor, dictionaries)

  if (decodedWheels.cursor >= payload.length) {
    throw new Error('Corrupted in-game code: missing posse token.')
  }

  const covenantBlock = payload.slice(decodedWheels.cursor, payload.length - POSSE_TOKEN_LENGTH)
  const slots = normalizeDecodedEquipment(
    decodedAwakeners.slots,
    decodedWheels.wheelCandidates,
    covenantBlock,
    dictionaries,
    wheelById,
    warnings,
  )
  const posseId = decodePosseId(payload, dictionaries, warnings)

  return {
    team: {
      id: `ingame-import-${crypto.randomUUID()}`,
      name: 'Imported Team',
      slots,
      posseId,
    },
    warnings,
  }
}

function encodeAwakenerToken(
  slot: TeamSlot,
  awakeningById: Map<string, Awaited<ReturnType<typeof getAwakeners>>[number]>,
  byIdToken: Map<string, string>,
  slotIndex: number,
): string {
  if (!slot.awakenerId) {
    return 'a'
  }
  const awakener = awakeningById.get(slot.awakenerId)
  if (!awakener) {
    throw new Error(
      `Cannot export in-game team code: slot ${String(slotIndex + 1)} awakener "${slot.awakenerId}" is not representable.`,
    )
  }
  const token = byIdToken.get(slot.awakenerId)
  if (!token) {
    throw new Error(
      `Cannot export in-game team code: slot ${String(slotIndex + 1)} awakener "${awakener.name}" (${slot.awakenerId}) has no in-game token.`,
    )
  }
  return token
}

function encodeWheelToken(
  wheelId: string | null,
  byIdToken: Map<string, string>,
  slotIndex: number,
  field: 'wheelOne' | 'wheelTwo',
): string {
  if (!wheelId) {
    return 'a'
  }
  const token = byIdToken.get(wheelId)
  if (!token) {
    throw new Error(
      `Cannot export in-game team code: slot ${String(slotIndex + 1)} ${field} "${wheelId}" is not representable.`,
    )
  }
  return token
}

function encodeCovenantBlock(
  slot: TeamSlot,
  dictionaries: IngameTokenDictionaries,
  slotIndex: number,
): string {
  if (!slot.awakenerId || !slot.covenantId) {
    return EMPTY_COVENANT_TOKEN
  }
  const token = dictionaries.covenants.byIdToken.get(slot.covenantId)
  if (!token) {
    throw new Error(
      `Cannot export in-game team code: slot ${String(slotIndex + 1)} covenant "${slot.covenantId}" is not representable.`,
    )
  }
  return token
}

export function encodeIngameTeamCode(team: Team): string {
  const dictionaries = buildIngameTokenDictionaries()
  const awakeningById = new Map(getAwakeners().map((awakener) => [awakener.id, awakener]))
  const payloadTokens: string[] = []
  const fallbackSlots = createEmptyTeamSlots()

  for (let slotIndex = 0; slotIndex < TEAM_SLOT_COUNT; slotIndex += 1) {
    const slot = team.slots[slotIndex] ?? fallbackSlots[slotIndex]
    payloadTokens.push(
      encodeAwakenerToken(slot, awakeningById, dictionaries.awakeners.byIdToken, slotIndex),
    )
  }

  for (let slotIndex = 0; slotIndex < TEAM_SLOT_COUNT; slotIndex += 1) {
    const slot = team.slots[slotIndex] ?? fallbackSlots[slotIndex]
    payloadTokens.push(
      encodeWheelToken(slot.wheels[0], dictionaries.wheels.byIdToken, slotIndex, 'wheelOne'),
    )
    payloadTokens.push(
      encodeWheelToken(slot.wheels[1], dictionaries.wheels.byIdToken, slotIndex, 'wheelTwo'),
    )
  }

  for (let slotIndex = 0; slotIndex < TEAM_SLOT_COUNT; slotIndex += 1) {
    const slot = team.slots[slotIndex] ?? fallbackSlots[slotIndex]
    payloadTokens.push(encodeCovenantBlock(slot, dictionaries, slotIndex))
  }

  const posseId = team.posseId
  const posseToken = posseId ? dictionaries.posses.byIdToken.get(posseId) : 'a'
  if (!posseToken) {
    throw new Error(
      `Cannot export in-game team code: posse "${posseId ?? ''}" is not representable.`,
    )
  }
  payloadTokens.push(posseToken)
  return `${INGAME_WRAPPER}${payloadTokens.join('')}${INGAME_WRAPPER}`
}
