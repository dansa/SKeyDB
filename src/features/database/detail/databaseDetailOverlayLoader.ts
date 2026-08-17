let overlayOutletModulePromise: ReturnType<typeof loadDatabaseDetailOverlayOutlet> | null = null

function loadDatabaseDetailOverlayOutlet() {
  return import('./DbDetailModalHost').then((module) => ({
    default: module.DatabaseDetailOverlayOutlet,
  }))
}

/** Starts the overlay code download without mounting its modal or loading a detail record. */
export function preloadDatabaseDetailOverlayOutlet() {
  overlayOutletModulePromise ??= loadDatabaseDetailOverlayOutlet()
  return overlayOutletModulePromise
}
