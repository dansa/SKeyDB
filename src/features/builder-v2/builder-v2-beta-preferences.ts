import {safeStorageRead, safeStorageWrite, type StorageLike} from '@/domain/storage'

export const BUILDER_V2_DEFAULT_KEY = 'skeydb.builderV2Beta.default.v1'
export const BUILDER_V2_CLASSIC_DISMISSED_KEY = 'skeydb.builderV2Beta.classicDismissedFor.v1'
export const BUILDER_V2_V2_DISMISSED_KEY = 'skeydb.builderV2Beta.v2DismissedFor.v1'

export type BuilderV2BetaSurface = 'classic' | 'v2'

export function isBuilderV2Default(storage: StorageLike | null): boolean {
  return safeStorageRead(storage, BUILDER_V2_DEFAULT_KEY) === '1'
}

export function setBuilderV2Default(storage: StorageLike | null, enabled: boolean): boolean {
  return safeStorageWrite(storage, BUILDER_V2_DEFAULT_KEY, enabled ? '1' : '0')
}

export function isBuilderV2BetaBannerDismissed({
  buildId,
  storage,
  surface,
}: {
  buildId: string
  storage: StorageLike | null
  surface: BuilderV2BetaSurface
}): boolean {
  return safeStorageRead(storage, getDismissalKey(surface)) === buildId
}

export function dismissBuilderV2BetaBanner({
  buildId,
  storage,
  surface,
}: {
  buildId: string
  storage: StorageLike | null
  surface: BuilderV2BetaSurface
}): boolean {
  return safeStorageWrite(storage, getDismissalKey(surface), buildId)
}

function getDismissalKey(surface: BuilderV2BetaSurface): string {
  return surface === 'classic' ? BUILDER_V2_CLASSIC_DISMISSED_KEY : BUILDER_V2_V2_DISMISSED_KEY
}
