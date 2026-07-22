type CryptoUuidSource = Pick<Crypto, 'getRandomValues'> & Partial<Pick<Crypto, 'randomUUID'>>

function formatUuid(bytes: Uint8Array): string {
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80

  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

/**
 * Creates a UUID in browsers where randomUUID is unavailable, including Safari
 * when a local development server is opened over plain LAN HTTP.
 */
export function createUuid(source: CryptoUuidSource = globalThis.crypto): string {
  if (typeof source.randomUUID === 'function') {
    return source.randomUUID()
  }

  return formatUuid(source.getRandomValues(new Uint8Array(16)))
}
