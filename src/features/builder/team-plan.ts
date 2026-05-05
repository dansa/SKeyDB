import {getAwakenerIdentityKeyById} from '@/domain/awakener-identity'

import type {Team} from './types'

export function toTeamPlan(teams: Team[]) {
  return teams.map((team) => ({
    id: team.id,
    posseId: team.posseId,
    members: team.slots.flatMap((slot) => {
      if (!slot.awakenerId || !slot.realm) {
        return []
      }

      return [
        {
          awakenerId: getAwakenerIdentityKeyById(slot.awakenerId),
          realm: slot.realm,
          isSupport: slot.isSupport === true,
          wheelIds: slot.wheels.filter((wheelId): wheelId is string => Boolean(wheelId)),
        },
      ]
    }),
  }))
}
