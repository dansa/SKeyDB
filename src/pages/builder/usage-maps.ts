import {getAwakenerIdentityKey} from '@/domain/awakener-identity'

import type {Team, WheelUsageLocation} from './types'

export function buildUsedAwakenerByIdentityKey(teams: Team[]): Map<string, string> {
  const identityMap = new Map<string, string>()

  for (const team of teams) {
    for (const slot of team.slots) {
      if (!slot.awakenerName || slot.isSupport) {
        continue
      }

      const identityKey = getAwakenerIdentityKey(slot.awakenerName)
      if (!identityMap.has(identityKey)) {
        identityMap.set(identityKey, team.id)
      }
    }
  }

  return identityMap
}

export function buildUsedPosseByTeamOrder(teams: Team[]): Map<string, number> {
  const posseMap = new Map<string, number>()

  for (const [index, team] of teams.entries()) {
    if (!team.posseId || posseMap.has(team.posseId)) {
      continue
    }
    posseMap.set(team.posseId, index)
  }

  return posseMap
}

export function buildUsedWheelByTeamOrder(teams: Team[]): Map<string, WheelUsageLocation> {
  const wheelMap = new Map<string, WheelUsageLocation>()

  for (const [teamOrder, team] of teams.entries()) {
    for (const slot of team.slots) {
      if (slot.isSupport) {
        continue
      }

      for (const [wheelIndex, wheelId] of slot.wheels.entries()) {
        if (!wheelId || wheelMap.has(wheelId)) {
          continue
        }

        wheelMap.set(wheelId, {teamOrder, teamId: team.id, slotId: slot.slotId, wheelIndex})
      }
    }
  }

  return wheelMap
}

export function hasSupportAwakener(teams: Team[]): boolean {
  return teams.some((team) => team.slots.some((slot) => slot.isSupport))
}
