const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

function isFocusableElementHidden(element: HTMLElement) {
  return (
    element.hidden ||
    element.getAttribute('aria-hidden') === 'true' ||
    Boolean(element.closest('[hidden], [aria-hidden="true"], .hidden'))
  )
}

export function getFocusableElements(root: HTMLElement) {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (element) => !isFocusableElementHidden(element),
  )
}
