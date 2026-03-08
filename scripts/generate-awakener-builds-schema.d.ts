export interface AwakenerBuildsSchema {
  $defs: {
    wheelId: unknown
    covenantId: unknown
    awakenerId: unknown
  }
}

export function buildAwakenerBuildsSchema(): AwakenerBuildsSchema
export function writeAwakenerBuildsSchema(): void
