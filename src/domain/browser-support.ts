export const PRODUCTION_BROWSER_MINIMUMS = {
  Chrome: 110,
  Edge: 110,
  Firefox: 115,
  Safari: 16,
} as const

export const PRODUCTION_BUILD_TARGETS = Object.entries(PRODUCTION_BROWSER_MINIMUMS).map(
  ([family, minimum]) => `${family.toLowerCase()}${String(minimum)}`,
)
