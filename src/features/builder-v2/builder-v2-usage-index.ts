import {getAwakenerIdentityKeyById} from '@/domain/awakener-identity'

import type {Team, WheelUsageLocation} from '../builder/types'
import {toWheelSlotIndex} from '../builder/wheel-slot-index'

export interface BuilderV2AwakenerUsage {
  teamId: string
  teamOrder: number
}

export interface BuilderV2UsageIndex {
  awakenerByIdentityKey: Map<string, BuilderV2AwakenerUsage>
  wheelById: Map<string, WheelUsageLocation>
  posseById: Map<string, number>
}

export function buildBuilderV2UsageIndex(teams: readonly Team[]): BuilderV2UsageIndex {
  const awakenerByIdentityKey = new Map<string, BuilderV2AwakenerUsage>()
  const wheelById = new Map<string, WheelUsageLocation>()
  const posseById = new Map<string, number>()

  for (const [teamOrder, team] of teams.entries()) {
    if (team.posseId && !posseById.has(team.posseId)) {
      posseById.set(team.posseId, teamOrder)
    }

    for (const slot of team.slots) {
      if (!slot.isSupport && slot.awakenerId) {
        const identityKey = getAwakenerIdentityKeyById(slot.awakenerId)
        if (!awakenerByIdentityKey.has(identityKey)) {
          awakenerByIdentityKey.set(identityKey, {teamId: team.id, teamOrder})
        }
      }

      if (slot.isSupport) {
        continue
      }

      for (const [wheelIndex, wheelId] of slot.wheels.entries()) {
        if (!wheelId || wheelById.has(wheelId)) {
          continue
        }

        wheelById.set(wheelId, {
          teamOrder,
          teamId: team.id,
          slotId: slot.slotId,
          wheelIndex: toWheelSlotIndex(wheelIndex),
        })
      }
    }
  }

  return {
    awakenerByIdentityKey,
    wheelById,
    posseById,
  }
}
