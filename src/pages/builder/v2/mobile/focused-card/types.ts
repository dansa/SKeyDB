type GetPosses = typeof import('@/domain/posses').getPosses

export type FocusedPosse = ReturnType<GetPosses>[number]
export type FocusedCardVariant = 'default' | 'wide'
export type WheelOwnedLevels = [number | null, number | null]
