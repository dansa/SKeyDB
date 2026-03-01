import { getAwakeners } from './awakeners'
import { buildIngameTokenDictionaries } from './ingame-token-dictionaries'
import { getWheels } from './wheels'
import type { Team, TeamSlot } from '../pages/builder/types'
import { createEmptyTeamSlots } from '../pages/builder/constants'

const INGAME_WRAPPER = '@@'
const TEAM_SLOT_COUNT = 4
const POSSE_TOKEN_LENGTH = 1
const WHEEL_TOKENS_PER_SLOT = 2
const COVENANT_SLICES_PER_SLOT = 6

export type IngameImportWarning = {
  section: 'awakener' | 'wheel' | 'covenant' | 'posse'
  slotIndex?: number
  field?: 'wheelOne' | 'wheelTwo'
  token: string
  reason: 'unknown_token' | 'unsupported_wip_block' | 'ambiguous_parse'
}

export type DecodedIngameTeamCode = {
  team: Team
  warnings: IngameImportWarning[]
}

type WheelCandidate = {
  token: string
  wheelId?: string
  unknown?: boolean
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
  wheelTokensByToken: Map<string, string>,
  sortedWheelTokens: string[],
): WheelCandidate[] {
  const candidates: WheelCandidate[] = []
  if (payload[cursor] === 'a') {
    candidates.push({ token: 'a' })
  }

  for (const token of sortedWheelTokens) {
    if (!payload.startsWith(token, cursor)) {
      continue
    }
    candidates.push({ token, wheelId: wheelTokensByToken.get(token) })
  }

  if (candidates.length === 0 && cursor < payload.length) {
    candidates.push({ token: payload[cursor], unknown: true })
  }

  return candidates
}

function parseWheelToken(
  payload: string,
  cursor: number,
  wheelTokensByToken: Map<string, string>,
  sortedWheelTokens: string[],
): { candidate: WheelCandidate; nextCursor: number } {
  const candidates = getWheelCandidatesAt(payload, cursor, wheelTokensByToken, sortedWheelTokens)
  const [candidate] = candidates
  if (!candidate) {
    return {
      candidate: { token: payload[cursor] ?? 'a', unknown: true },
      nextCursor: cursor + 1,
    }
  }
  return {
    candidate,
    nextCursor: cursor + candidate.token.length,
  }
}

export function decodeIngameTeamCode(code: string): DecodedIngameTeamCode {
  const payload = normalizeWrappedPayload(code)
  const dictionaries = buildIngameTokenDictionaries()

  const warnings: IngameImportWarning[] = []
  const emptySlots = createEmptyTeamSlots()

  const awakeners = getAwakeners()
  const awakeningById = new Map(awakeners.map((awakener) => [String(awakener.id), awakener]))
  const wheelById = new Map(getWheels().map((wheel) => [wheel.id, wheel]))

  const awakenerTokenList = buildLongestTokenList(dictionaries.awakeners.byTokenId.keys())
  const wheelTokenList = buildLongestTokenList(dictionaries.wheels.byTokenId.keys())

  let cursor = 0
  const slots: TeamSlot[] = emptySlots.map((slot) => ({ ...slot, wheels: [null, null] }))

  for (let slotIndex = 0; slotIndex < TEAM_SLOT_COUNT; slotIndex += 1) {
    if (cursor >= payload.length) {
      throw new Error('Corrupted in-game code: missing awakener tokens.')
    }
    const token = findLongestTokenAt(payload, cursor, awakenerTokenList)
    if (!token) {
      warnings.push({
        section: 'awakener',
        slotIndex,
        token: payload[cursor],
        reason: 'unknown_token',
      })
      cursor += 1
      continue
    }

    const awakenerId = dictionaries.awakeners.byTokenId.get(token)
    const awakener = awakenerId ? awakeningById.get(awakenerId) : undefined
    if (!awakener) {
      warnings.push({
        section: 'awakener',
        slotIndex,
        token,
        reason: 'unknown_token',
      })
      cursor += token.length
      continue
    }

    slots[slotIndex] = {
      ...slots[slotIndex],
      awakenerName: awakener.name,
      faction: awakener.faction,
      level: 60,
    }
    cursor += token.length
  }

  const wheelTokenCount = TEAM_SLOT_COUNT * WHEEL_TOKENS_PER_SLOT
  const wheelCandidates: WheelCandidate[] = []
  for (let index = 0; index < wheelTokenCount; index += 1) {
    if (cursor >= payload.length - POSSE_TOKEN_LENGTH) {
      throw new Error('Corrupted in-game code: missing wheel token block.')
    }
    const { candidate, nextCursor } = parseWheelToken(payload, cursor, dictionaries.wheels.byTokenId, wheelTokenList)
    wheelCandidates.push(candidate)
    cursor = nextCursor
  }

  if (cursor >= payload.length) {
    throw new Error('Corrupted in-game code: missing posse token.')
  }

  const covenantBlock = payload.slice(cursor, payload.length - POSSE_TOKEN_LENGTH)

  for (let slotIndex = 0; slotIndex < TEAM_SLOT_COUNT; slotIndex += 1) {
    const slot = slots[slotIndex]
    const wheelOne = wheelCandidates[slotIndex * 2]
    const wheelTwo = wheelCandidates[slotIndex * 2 + 1]
    const currentWheels: [string | null, string | null] = [null, null]

    const wheelOneId = wheelOne?.wheelId
    if (wheelOneId && wheelById.has(wheelOneId)) {
      currentWheels[0] = wheelOneId
    } else if (wheelOne && wheelOne.token !== 'a') {
      warnings.push({
        section: 'wheel',
        slotIndex,
        field: 'wheelOne',
        token: wheelOne.token,
        reason: 'unknown_token',
      })
    }

    const wheelTwoId = wheelTwo?.wheelId
    if (wheelTwoId && wheelById.has(wheelTwoId)) {
      currentWheels[1] = wheelTwoId
    } else if (wheelTwo && wheelTwo.token !== 'a') {
      warnings.push({
        section: 'wheel',
        slotIndex,
        field: 'wheelTwo',
        token: wheelTwo.token,
        reason: 'unknown_token',
      })
    }

    const covenantStart = slotIndex * COVENANT_SLICES_PER_SLOT
    const covenantToken = covenantBlock.slice(covenantStart, covenantStart + COVENANT_SLICES_PER_SLOT)
    if (covenantToken && /[^a]/.test(covenantToken)) {
      warnings.push({
        section: 'covenant',
        slotIndex,
        token: covenantToken,
        reason: 'unsupported_wip_block',
      })
    }

    slots[slotIndex] = {
      ...slot,
      wheels: currentWheels,
      covenantId: undefined,
    }
  }

  const posseToken = payload[payload.length - 1]
  const posseId = dictionaries.posses.byTokenId.get(posseToken)
  if (posseToken !== 'a' && !posseId) {
    warnings.push({
      section: 'posse',
      token: posseToken,
      reason: 'unknown_token',
    })
  }

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

function encodeAwakenerToken(slot: TeamSlot, awakenersByNameId: Map<string, string>, byIdToken: Map<string, string>): string {
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
  const awakenersByNameId = new Map(getAwakeners().map((awakener) => [awakener.name, String(awakener.id)]))
  const payloadTokens: string[] = []
  const fallbackSlots = createEmptyTeamSlots()

  for (let slotIndex = 0; slotIndex < TEAM_SLOT_COUNT; slotIndex += 1) {
    const slot = team.slots[slotIndex] ?? fallbackSlots[slotIndex]
    payloadTokens.push(encodeAwakenerToken(slot, awakenersByNameId, dictionaries.awakeners.byIdToken))
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

  const posseToken = team.posseId ? dictionaries.posses.byIdToken.get(team.posseId) ?? 'a' : 'a'
  payloadTokens.push(posseToken)
  return `${INGAME_WRAPPER}${payloadTokens.join('')}${INGAME_WRAPPER}`
}
