export const DATABASE_GRID_PRIORITIZED_IMAGE_COUNT = 24

export function shouldPrioritizeDatabaseGridImage(index: number): boolean {
  return index < DATABASE_GRID_PRIORITIZED_IMAGE_COUNT
}
