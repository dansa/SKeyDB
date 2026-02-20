import { describe, expect, it } from 'vitest'
import { formatAwakenerNameForUi } from './name-format'

describe('formatAwakenerNameForUi', () => {
  it('converts names to title case while preserving separators', () => {
    expect(formatAwakenerNameForUi('murphy: fauxborn')).toBe('Murphy: Fauxborn')
    expect(formatAwakenerNameForUi('helot: catena')).toBe('Helot: Catena')
    expect(formatAwakenerNameForUi('kathigu-ra')).toBe('Kathigu-Ra')
    expect(formatAwakenerNameForUi('24')).toBe('24')
  })
})
