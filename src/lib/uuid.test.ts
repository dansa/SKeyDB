import {describe, expect, it, vi} from 'vitest'

import {createUuid} from './uuid'

describe('createUuid', () => {
  it('uses the native randomUUID implementation when available', () => {
    const randomUUID = vi.fn(() => '123e4567-e89b-42d3-a456-426614174000')
    const getRandomValues = vi.fn((values: Uint8Array) => values)
    const source = {
      randomUUID,
      getRandomValues,
    } as unknown as Crypto

    expect(createUuid(source)).toBe('123e4567-e89b-42d3-a456-426614174000')
    expect(randomUUID).toHaveBeenCalledOnce()
    expect(getRandomValues).not.toHaveBeenCalled()
  })

  it('creates an RFC 4122 version 4 UUID with getRandomValues as a fallback', () => {
    const source = {
      getRandomValues: (values: Uint8Array) => {
        values.set(Array.from({length: 16}, (_, index) => index))
        return values
      },
    } as Crypto

    expect(createUuid(source)).toBe('00010203-0405-4607-8809-0a0b0c0d0e0f')
  })
})
