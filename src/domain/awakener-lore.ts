import {z} from 'zod'

import {getPublicAwakenerCatalogRecords} from '@/data-access/public-data/catalogScopes/awakenersCatalog'
import {loadPublicRecord} from '@/data-access/public-data/recordRepository'

import {awakenerProfileSchema, awakenerQuoteSchema} from './awakener-lore-schema'
import type {AwakenerFullRecord, AwakenerProfile, AwakenerQuote} from './awakeners-full'

export interface AwakenerQuoteExchangeLine {
  awakenerId: string
  speakerName: string
  quote: AwakenerQuote
}

const exchangeParticipantSchema = z.object({
  kind: z.literal('awakener'),
  id: z.string(),
  name: z.string().min(1),
  profile: awakenerProfileSchema,
})

function findQuote(profile: AwakenerProfile, id: string): AwakenerQuote | undefined {
  return Object.values(profile.voiceLines ?? {})
    .flat()
    .find((line) => line.id === id)
}

/** Fetches only participant profiles, and only after the reader requests an exchange. */
export async function loadAwakenerQuoteExchange(
  currentRecord: AwakenerFullRecord,
  quote: AwakenerQuote,
): Promise<AwakenerQuoteExchangeLine[]> {
  const references = awakenerQuoteSchema.parse(quote).exchange
  if (!references?.length) return []

  const currentId = getPublicAwakenerCatalogRecords().find(
    (record) => record.numericId === currentRecord.id,
  )?.id
  if (!currentId) throw new Error('Cannot identify this Awakener. Please try again.')

  const participants = new Map<string, {name: string; profile: AwakenerProfile}>([
    [currentId, {name: currentRecord.displayName, profile: currentRecord.profile ?? {}}],
  ])
  const missingIds = [...new Set(references.map((ref) => ref.awakenerId))].filter(
    (id) => id !== currentId,
  )
  await Promise.all(
    missingIds.map(async (id) => {
      const raw = await loadPublicRecord('awakeners', id)
      const parsed = exchangeParticipantSchema.safeParse(raw)
      if (!parsed.success || parsed.data.id !== id) {
        throw new Error('An exchange participant could not be loaded. Please try again.')
      }
      participants.set(id, parsed.data)
    }),
  )

  return references.map((ref) => {
    const participant = participants.get(ref.awakenerId)
    const line = participant && findQuote(participant.profile, ref.lineId)
    if (!participant || !line) {
      throw new Error('An exchange quote could not be found. Please try again.')
    }
    return {awakenerId: ref.awakenerId, speakerName: participant.name, quote: line}
  })
}
