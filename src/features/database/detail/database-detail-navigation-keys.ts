export function isDatabaseDetailNavigationEditingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) {
    return false
  }

  if (target.closest('[role="tablist"]')) {
    return true
  }

  if (target instanceof HTMLElement && target.isContentEditable) {
    return true
  }

  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLSelectElement ||
    target instanceof HTMLTextAreaElement
  )
}
