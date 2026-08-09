const ARROW_KEY_OWNER_SELECTOR = [
  'a[href]',
  'button',
  'input',
  'select',
  'textarea',
  '[contenteditable]:not([contenteditable="false"])',
  '[role="button"]',
  '[role="combobox"]',
  '[role="listbox"]',
  '[role="menu"]',
  '[role="radio"]',
  '[role="slider"]',
  '[role="spinbutton"]',
  '[role="tablist"]',
  '[data-detail-result-navigation-boundary]',
].join(', ')

export function isDatabaseDetailNavigationKeyOwner(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) {
    return false
  }

  return Boolean(target.closest(ARROW_KEY_OWNER_SELECTOR))
}
