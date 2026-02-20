const identityKeyByAwakenerName: Record<string, string> = {
  ramona: 'ramona',
  'ramona: timeworn': 'ramona',
}

export function getAwakenerIdentityKey(name: string): string {
  const normalizedName = name.trim().toLowerCase()
  return identityKeyByAwakenerName[normalizedName] ?? normalizedName
}
