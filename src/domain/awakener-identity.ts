import {getAwakeners} from './awakeners'

const identityKeyByAwakenerName: Record<string, string> = {
  ramona: 'ramona',
  'ramona: timeworn': 'ramona',
}

const identityKeyByAwakenerId = new Map(
  getAwakeners().map((awakener) => [awakener.id, getAwakenerIdentityKey(awakener.name)]),
)

export function getAwakenerIdentityKey(name: string): string {
  const normalizedName = name.trim().toLowerCase()
  return identityKeyByAwakenerName[normalizedName] ?? normalizedName
}

export function getAwakenerIdentityKeyById(awakenerId: string): string {
  return identityKeyByAwakenerId.get(awakenerId) ?? awakenerId
}
