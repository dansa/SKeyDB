import {createEmptyTeamSlots} from '@/pages/builder/constants'
import type {Team, TeamSlot} from '@/pages/builder/types'

import {getAwakeners} from './awakeners'
import {buildIngameTokenDictionaries} from './ingame-token-dictionaries'
import {getWheels} from './wheels'

const INGAME_WRAPPER = '@@'
const TEAM_SLOT_COUNT = 4
const POSSE_TOKEN_LENGTH = 1
const WHEEL_TOKENS_PER_SLOT = 2
const COVENANT_SLICES_PER_SLOT = 6

export interface IngameImportWarning {
  section: 'awakener' | 'wheel' | 'covenant' | 'posse'
  slotIndex?: number
  field?: 'wheelOne' | 'wheelTwo'
  token: string
  reason: 'unknown_token' | 'unsupported_wip_block' | 'ambiguous_parse'
}

export interface DecodedIngameTeamCode {
  team: Team
  warnings: IngameImportWarning[]
}

interface WheelCandidate {
  token: string
  wheelId?: string
  unknown?: boolean
}

type IngameTokenDictionaries = ReturnType<typeof buildIngameTokenDictionaries>

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
  wheelTokensByToken: Map<string, string>,
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
    candidates.push({token, wheelId: wheelTokensByToken.get(token)})
  }

  if (candidates.length === 0 && cursor < payload.length) {
    candidates.push({token: payload[cursor], unknown: true})
  }

  return candidates
}

function parseWheelToken(
  payload: string,
  cursor: number,
  wheelTokensByToken: Map<string, string>,
  sortedWheelTokens: string[],
): {candidate: WheelCandidate; nextCursor: number} {
  const candidates = getWheelCandidatesAt(payload, cursor, wheelTokensByToken, sortedWheelTokens)
  const candidate = candidates[0] ?? {token: payload[cursor] ?? 'a', unknown: true}
  return {
    candidate,
    nextCursor: cursor + candidate.token.length,
  }
}

function pushUnknownAwakenerWarning(
  warnings: IngameImportWarning[],
  slotIndex: number,
  token: string,
) {
  warnings.push({
    section: 'awakener',
    slotIndex,
    token,
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
  const awakenerTokenList = buildLongestTokenList(dictionaries.awakeners.byTokenId.keys())
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

    const awakenerId = dictionaries.awakeners.byTokenId.get(token)
    const awakener = awakenerId ? awakeningById.get(awakenerId) : undefined
    if (!awakener) {
      pushUnknownAwakenerWarning(warnings, slotIndex, token)
      cursor += token.length
      continue
    }

    slots[slotIndex] = {
      ...slots[slotIndex],
      awakenerName: awakener.name,
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
  const wheelTokenList = buildLongestTokenList(dictionaries.wheels.byTokenId.keys())
  const wheelCandidates: WheelCandidate[] = []

  for (let index = 0; index < TEAM_SLOT_COUNT * WHEEL_TOKENS_PER_SLOT; index += 1) {
    if (cursor >= payload.length - POSSE_TOKEN_LENGTH) {
      throw new Error('Corrupted in-game code: missing wheel token block.')
    }

    const parsed = parseWheelToken(payload, cursor, dictionaries.wheels.byTokenId, wheelTokenList)
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
  if (wheelId && wheelById.has(wheelId)) {
    return wheelId
  }

  if (candidate && candidate.token !== 'a') {
    warnings.push({
      section: 'wheel',
      slotIndex,
      field,
      token: candidate.token,
      reason: 'unknown_token',
    })
  }

  return null
}

function normalizeDecodedEquipment(
  slots: TeamSlot[],
  wheelCandidates: WheelCandidate[],
  covenantBlock: string,
  wheelById: Map<string, Awaited<ReturnType<typeof getWheels>>[number]>,
  warnings: IngameImportWarning[],
): TeamSlot[] {
  const nextSlots = [...slots]

  for (let slotIndex = 0; slotIndex < TEAM_SLOT_COUNT; slotIndex += 1) {
    const covenantStart = slotIndex * COVENANT_SLICES_PER_SLOT
    const covenantToken = covenantBlock.slice(
      covenantStart,
      covenantStart + COVENANT_SLICES_PER_SLOT,
    )
    if (covenantToken && /[^a]/.test(covenantToken)) {
      warnings.push({
        section: 'covenant',
        slotIndex,
        token: covenantToken,
        reason: 'unsupported_wip_block',
      })
    }

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
      covenantId: undefined,
    }
  }

  return nextSlots
}

function decodePosseId(
  payload: string,
  dictionaries: IngameTokenDictionaries,
  warnings: IngameImportWarning[],
): string | undefined {
  const posseToken = payload[payload.length - 1]
  const posseId = dictionaries.posses.byTokenId.get(posseToken)
  if (posseToken !== 'a' && !posseId) {
    warnings.push({
      section: 'posse',
      token: posseToken,
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
  const awakeningById = new Map(awakeners.map((awakener) => [String(awakener.id), awakener]))
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
  awakenersByNameId: Map<string, string>,
  byIdToken: Map<string, string>,
): string {
  if (!slot.awakenerName) {
    return 'a'
  }
  const awakenerId = awakenersByNameId.get(slot.awakenerName)
  if (!awakenerId) {
    return 'a'
  }
  return byIdToken.get(awakenerId) ?? 'a'
}

function encodeWheelToken(wheelId: string | null, byIdToken: Map<string, string>): string {
  if (!wheelId) {
    return 'a'
  }
  return byIdToken.get(wheelId) ?? 'a'
}

export function encodeIngameTeamCode(team: Team): string {
  const dictionaries = buildIngameTokenDictionaries()
  const awakenersByNameId = new Map(
    getAwakeners().map((awakener) => [awakener.name, String(awakener.id)]),
  )
  const payloadTokens: string[] = []
  const fallbackSlots = createEmptyTeamSlots()

  for (let slotIndex = 0; slotIndex < TEAM_SLOT_COUNT; slotIndex += 1) {
    const slot = team.slots[slotIndex] ?? fallbackSlots[slotIndex]
    payloadTokens.push(
      encodeAwakenerToken(slot, awakenersByNameId, dictionaries.awakeners.byIdToken),
    )
  }

  for (let slotIndex = 0; slotIndex < TEAM_SLOT_COUNT; slotIndex += 1) {
    const slot = team.slots[slotIndex] ?? fallbackSlots[slotIndex]
    payloadTokens.push(encodeWheelToken(slot.wheels[0], dictionaries.wheels.byIdToken))
    payloadTokens.push(encodeWheelToken(slot.wheels[1], dictionaries.wheels.byIdToken))
  }

  for (let slotIndex = 0; slotIndex < TEAM_SLOT_COUNT; slotIndex += 1) {
    for (let slice = 0; slice < COVENANT_SLICES_PER_SLOT; slice += 1) {
      payloadTokens.push('a')
    }
  }

  const posseToken = team.posseId ? (dictionaries.posses.byIdToken.get(team.posseId) ?? 'a') : 'a'
  payloadTokens.push(posseToken)
  return `${INGAME_WRAPPER}${payloadTokens.join('')}${INGAME_WRAPPER}`
}
