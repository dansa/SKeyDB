import {
  isDomainStorageMigrationSnapshot,
  type DomainStorageMigrationSnapshot,
} from './storageMigrationSnapshot'

export const DEFAULT_LEGACY_MIGRATION_SOURCE_ORIGINS = ['https://dansa.github.io']
export const DEFAULT_MIGRATION_TARGET_ORIGINS = ['https://skeydb.com', 'https://www.skeydb.com']
export const DEFAULT_LEGACY_MIGRATION_EXPORT_URL = 'https://dansa.github.io/SKeyDB/#/migrate/export'
export const PRIMARY_MIGRATION_TARGET_URL = 'https://skeydb.com/#/migrate'

export type MigrationBridgeMessage =
  | {
      type: 'skeydb:migration-ready:v1'
      nonce: string
      sourceOrigin: string
    }
  | {
      type: 'skeydb:migration-snapshot:v1'
      nonce: string
      snapshot: DomainStorageMigrationSnapshot
    }
  | {
      type: 'skeydb:migration-error:v1'
      nonce: string
      error: 'storage_unavailable' | 'snapshot_empty' | 'invalid_target_origin'
    }

export interface MigrationOriginPolicyOptions {
  allowLocalOrigins?: boolean
  sourceOrigins?: string[]
  targetOrigins?: string[]
}

interface ParseBridgeMessageOptions {
  expectedNonce: string
  eventOrigin: string
  allowedOrigins: string[]
  allowLocalOrigins?: boolean
}

export function createMigrationNonce(byteLength = 16): string {
  const bytes = new Uint8Array(byteLength)
  const cryptoLike = (globalThis as {crypto?: Pick<Crypto, 'getRandomValues'>}).crypto

  if (cryptoLike) {
    cryptoLike.getRandomValues(bytes)
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256)
    }
  }

  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export function createLegacyMigrationExportUrl({
  nonce,
  targetOrigin,
  legacyExportUrl = DEFAULT_LEGACY_MIGRATION_EXPORT_URL,
}: {
  nonce: string
  targetOrigin: string
  legacyExportUrl?: string
}): string {
  const url = new URL(legacyExportUrl)
  url.hash = `/migrate/export?nonce=${encodeURIComponent(nonce)}&targetOrigin=${encodeURIComponent(
    targetOrigin,
  )}`
  return url.toString()
}

export function resolveLegacyMigrationExportUrlForCurrentOrigin(
  currentLocation: Pick<Location, 'origin' | 'hostname' | 'protocol' | 'port'>,
  configuredUrl: string | undefined,
  isDev: boolean,
): string {
  if (configuredUrl?.trim()) {
    return configuredUrl.trim()
  }

  if (isDev && isLocalOrigin(currentLocation.origin) && currentLocation.port !== '5173') {
    return `${currentLocation.protocol}//${currentLocation.hostname}:5173/#/migrate/export`
  }

  return DEFAULT_LEGACY_MIGRATION_EXPORT_URL
}

export function isAllowedMigrationSourceOrigin(
  origin: string,
  options: MigrationOriginPolicyOptions = {},
): boolean {
  return isAllowedOrigin(origin, {
    allowedOrigins: options.sourceOrigins ?? DEFAULT_LEGACY_MIGRATION_SOURCE_ORIGINS,
    allowLocalOrigins: options.allowLocalOrigins,
  })
}

export function isAllowedMigrationTargetOrigin(
  origin: string,
  options: MigrationOriginPolicyOptions = {},
): boolean {
  return isAllowedOrigin(origin, {
    allowedOrigins: options.targetOrigins ?? DEFAULT_MIGRATION_TARGET_ORIGINS,
    allowLocalOrigins: options.allowLocalOrigins,
  })
}

export function parseMigrationBridgeMessage(
  data: unknown,
  options: ParseBridgeMessageOptions,
): MigrationBridgeMessage | null {
  if (
    !isAllowedOrigin(options.eventOrigin, {
      allowedOrigins: options.allowedOrigins,
      allowLocalOrigins: options.allowLocalOrigins,
    })
  ) {
    return null
  }
  if (!isRecord(data) || data.nonce !== options.expectedNonce) {
    return null
  }

  if (data.type === 'skeydb:migration-ready:v1') {
    return typeof data.sourceOrigin === 'string'
      ? {type: data.type, nonce: data.nonce, sourceOrigin: data.sourceOrigin}
      : null
  }

  if (data.type === 'skeydb:migration-snapshot:v1') {
    return isDomainStorageMigrationSnapshot(data.snapshot)
      ? {type: data.type, nonce: data.nonce, snapshot: data.snapshot}
      : null
  }

  if (data.type === 'skeydb:migration-error:v1') {
    return isMigrationError(data.error)
      ? {type: data.type, nonce: data.nonce, error: data.error}
      : null
  }

  return null
}

function isAllowedOrigin(
  origin: string,
  options: {allowedOrigins: string[]; allowLocalOrigins?: boolean},
): boolean {
  if (options.allowedOrigins.includes(origin)) {
    return true
  }
  return options.allowLocalOrigins === true && isLocalOrigin(origin)
}

function isLocalOrigin(origin: string): boolean {
  try {
    const url = new URL(origin)
    return (
      (url.protocol === 'http:' || url.protocol === 'https:') &&
      (url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '[::1]')
    )
  } catch {
    return false
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function isMigrationError(
  value: unknown,
): value is Extract<MigrationBridgeMessage, {type: 'skeydb:migration-error:v1'}>['error'] {
  return (
    value === 'storage_unavailable' ||
    value === 'snapshot_empty' ||
    value === 'invalid_target_origin'
  )
}
