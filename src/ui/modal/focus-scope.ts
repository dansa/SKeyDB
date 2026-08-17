const FOCUSABLE_SELECTOR =
  'a[href], area[href], button, input:not([type="hidden"]), select, textarea, details > summary:first-of-type, iframe, audio[controls], video[controls], [contenteditable]:not([contenteditable="false"]), [tabindex]:not([tabindex="-1"])'

function isFocusableElementAvailable(element: HTMLElement) {
  const closedDetails = element.closest('details:not([open])')
  if (
    element.matches(':disabled') ||
    (element.hasAttribute('tabindex') && element.tabIndex < 0) ||
    element.closest('[hidden], [inert], [aria-hidden="true"]') ||
    (closedDetails && closedDetails.querySelector('summary') !== element)
  ) {
    return false
  }

  let current: HTMLElement | null = element
  while (current) {
    const style = window.getComputedStyle(current)
    if (
      style.display === 'none' ||
      style.visibility === 'hidden' ||
      style.visibility === 'collapse'
    ) {
      return false
    }
    current = current.parentElement
  }

  return true
}

export function getFocusableElements(root: HTMLElement) {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    isFocusableElementAvailable,
  )
}
