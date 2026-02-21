export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false
  }
  const tagName = target.tagName
  return tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT' || target.isContentEditable
}

export function getDragKind(data: unknown): string | undefined {
  if (!data || typeof data !== 'object') {
    return undefined
  }
  const maybeKind = (data as { kind?: unknown }).kind
  return typeof maybeKind === 'string' ? maybeKind : undefined
}

export function toOrdinal(value: number): string {
  const mod100 = value % 100
  if (mod100 >= 11 && mod100 <= 13) {
    return `${value}th`
  }
  const mod10 = value % 10
  if (mod10 === 1) {
    return `${value}st`
  }
  if (mod10 === 2) {
    return `${value}nd`
  }
  if (mod10 === 3) {
    return `${value}rd`
  }
  return `${value}th`
}
