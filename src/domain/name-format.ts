function titleCaseToken(token: string): string {
  if (!/[a-z]/i.test(token)) {
    return token
  }
  return token.charAt(0).toUpperCase() + token.slice(1).toLowerCase()
}

export function formatAwakenerNameForUi(name: string): string {
  return name
    .split(/([:\-\s]+)/)
    .map((part) => (/^[:\-\s]+$/.test(part) ? part : titleCaseToken(part)))
    .join('')
}
