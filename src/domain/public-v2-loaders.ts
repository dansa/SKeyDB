import {
  parsePublicV2Envelope,
  parsePublicV2Record,
  publicV2Scopes,
  type PublicV2Envelope,
  type PublicV2Record,
  type PublicV2Scope,
} from './public-v2-schema'

type PublicV2EnvelopeKind = 'full' | 'lite'

type PublicV2JsonLoader = () => Promise<unknown>

const aggregateLoaders = import.meta.glob('../data/public-v2/{full,lite}/*.json', {
  import: 'default',
}) as Partial<Record<string, PublicV2JsonLoader>>

const fullRecordLoaders = import.meta.glob('../data/public-v2/full/*-records/*.json', {
  import: 'default',
}) as Partial<Record<string, PublicV2JsonLoader>>

const aggregateEnvelopeCache: Record<
  PublicV2EnvelopeKind,
  Partial<Record<PublicV2Scope, PublicV2Envelope>>
> = {
  full: {},
  lite: {},
}

function buildAggregatePath(kind: PublicV2EnvelopeKind, scope: PublicV2Scope): string {
  return `../data/public-v2/${kind}/${scope}.json`
}

function buildFullRecordPath(scope: PublicV2Scope, recordId: string): string {
  return `../data/public-v2/full/${scope}-records/${recordId}.json`
}

export function loadPublicV2Envelope<TScope extends PublicV2Scope>(
  kind: PublicV2EnvelopeKind,
  scope: TScope,
): Promise<PublicV2Envelope<TScope>> {
  const cachedEnvelope = aggregateEnvelopeCache[kind][scope]

  if (cachedEnvelope) {
    return Promise.resolve(cachedEnvelope as PublicV2Envelope<TScope>)
  }

  const loader = aggregateLoaders[buildAggregatePath(kind, scope)]

  if (!loader) {
    return Promise.reject(new Error(`Missing public V2 ${kind} aggregate for scope: ${scope}`))
  }

  return loader().then((module) => {
    const envelope = parsePublicV2Envelope(scope, module)
    aggregateEnvelopeCache[kind][scope] = envelope
    return envelope
  })
}

export function getPublicV2Envelope<TScope extends PublicV2Scope>(
  kind: PublicV2EnvelopeKind,
  scope: TScope,
): PublicV2Envelope<TScope> {
  const envelope = aggregateEnvelopeCache[kind][scope]

  if (!envelope) {
    throw new Error(`Public V2 ${kind} aggregate has not been loaded for scope: ${scope}`)
  }

  return envelope as PublicV2Envelope<TScope>
}

export async function loadPublicV2FullRecord<TScope extends PublicV2Scope>(
  scope: TScope,
  recordId: string,
): Promise<PublicV2Record<TScope> | undefined> {
  const loader = fullRecordLoaders[buildFullRecordPath(scope, recordId)]
  if (!loader) {
    return undefined
  }

  return parsePublicV2Record(scope, await loader())
}

export async function loadPublicV2Envelopes(
  kind: PublicV2EnvelopeKind,
  scopes: readonly PublicV2Scope[] = publicV2Scopes,
): Promise<PublicV2Envelope[]> {
  return Promise.all(scopes.map((scope) => loadPublicV2Envelope(kind, scope)))
}
