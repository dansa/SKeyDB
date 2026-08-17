export function scrollRelicVariantIntoView(viewport: HTMLElement, selectedControl: HTMLElement) {
  const selectedTop = selectedControl.offsetTop
  const selectedBottom = selectedTop + selectedControl.offsetHeight
  const viewportBottom = viewport.scrollTop + viewport.clientHeight

  if (selectedTop < viewport.scrollTop) {
    viewport.scrollTop = selectedTop
  } else if (selectedBottom > viewportBottom) {
    viewport.scrollTop = selectedBottom - viewport.clientHeight
  }
}
