import {z} from 'zod'

export const POSSE_CLASSIFICATION_IDS = ['STANDARD', 'PRIMORDIAL_MEMORY'] as const
export const posseClassificationSchema = z.enum(POSSE_CLASSIFICATION_IDS)

export type PosseClassification = z.infer<typeof posseClassificationSchema>
