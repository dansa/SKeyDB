import {fireEvent, render, screen, waitFor, within} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import {type StorageLike} from '@/domain/storage'
import {
  DOMAIN_STORAGE_MIGRATION_SNAPSHOT_KIND,
  DOMAIN_STORAGE_MIGRATION_VERSION,
  type DomainStorageMigrationSnapshot,
} from '@/domain/storage-migration/storageMigrationSnapshot'

import {MigrationReceivePage} from './MigrationReceivePage'

class MemoryStorage implements StorageLike {
  readonly values = new Map<string, string>()

  getItem(key: string): string | null {
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value)
  }

  removeItem(key: string): void {
    this.values.delete(key)
  }
}

const TARGET_LOCATION = {
  origin: 'https://skeydb.com',
  hostname: 'skeydb.com',
  protocol: 'https:',
  port: '',
} satisfies Pick<Location, 'origin' | 'hostname' | 'protocol' | 'port'>

const OLD_LOCATION = {
  origin: 'https://dansa.github.io',
  hostname: 'dansa.github.io',
  protocol: 'https:',
  port: '',
} satisfies Pick<Location, 'origin' | 'hostname' | 'protocol' | 'port'>

function makeSnapshot(): DomainStorageMigrationSnapshot {
  return {
    kind: DOMAIN_STORAGE_MIGRATION_SNAPSHOT_KIND,
    version: DOMAIN_STORAGE_MIGRATION_VERSION,
    createdAt: '2026-05-17T10:00:00.000Z',
    sourceOrigin: 'https://dansa.github.io',
    sourcePathname: '/SKeyDB/',
    entries: [
      {key: 'skeydb.builder.allowDupes.v1', value: '1', category: 'preference'},
      {key: 'skeydb.builder.teamPreviewMode.v1', value: 'compact', category: 'preference'},
    ],
    skipped: [],
  }
}

function makeSnapshotFrom(sourceOrigin: string): DomainStorageMigrationSnapshot {
  return {...makeSnapshot(), sourceOrigin}
}

function renderReceivePage({
  storage = new MemoryStorage(),
  openWindow = vi.fn(() => ({})),
  locationLike = TARGET_LOCATION,
}: {
  storage?: StorageLike | null
  openWindow?: (url: string, target: string) => unknown
  locationLike?: Pick<Location, 'origin' | 'hostname' | 'protocol' | 'port'>
} = {}) {
  render(
    <MigrationReceivePage
      allowLocalOrigins={false}
      configuredLegacyExportUrl='https://dansa.github.io/SKeyDB/#/migrate/export'
      createNonce={() => 'abc'}
      locationLike={locationLike}
      openWindow={openWindow}
      storage={storage}
    />,
  )
  return {storage, openWindow}
}

describe('MigrationReceivePage', () => {
  it('sends users to the new domain when opened from GitHub Pages', () => {
    const {openWindow} = renderReceivePage({locationLike: OLD_LOCATION})

    expect(screen.getByText(/start from skeydb\.com/i)).toBeInTheDocument()
    expect(screen.getByRole('link', {name: /open skeydb.com/i})).toHaveAttribute(
      'href',
      'https://skeydb.com/#/migrate',
    )
    expect(screen.queryByRole('button', {name: /start transfer/i})).not.toBeInTheDocument()
    expect(openWindow).not.toHaveBeenCalled()
  })

  it('explains the transfer before asking users to start', () => {
    renderReceivePage()

    expect(
      screen.getByText(/copy your builder teams, collection, and settings/i),
    ).toBeInTheDocument()
    expect(screen.getByText(/nothing is deleted from github pages/i)).toBeInTheDocument()
    expect(screen.getByText(/skeydb opens your old github pages save/i)).toBeInTheDocument()
    expect(screen.getByText(/review what will be moved/i)).toBeInTheDocument()
  })

  it('opens the legacy export route with nonce and target origin', () => {
    const {openWindow} = renderReceivePage()

    fireEvent.click(screen.getByRole('button', {name: /start transfer/i}))

    expect(openWindow).toHaveBeenCalledWith(
      'https://dansa.github.io/SKeyDB/#/migrate/export?nonce=abc&targetOrigin=https%3A%2F%2Fskeydb.com',
      'skeydb-domain-migration',
    )
    expect(screen.getByText(/waiting for the github pages tab/i)).toBeInTheDocument()
  })

  it('shows a fallback link when the GitHub Pages tab cannot be opened', () => {
    renderReceivePage({openWindow: vi.fn(() => null)})

    fireEvent.click(screen.getByRole('button', {name: /start transfer/i}))

    expect(screen.getByText(/could not open the github pages tab/i)).toBeInTheDocument()
    expect(screen.getByRole('link', {name: /open github pages transfer page/i})).toHaveAttribute(
      'href',
      'https://dansa.github.io/SKeyDB/#/migrate/export?nonce=abc&targetOrigin=https%3A%2F%2Fskeydb.com',
    )
  })

  it('ignores messages from wrong origins and accepts a matching snapshot message', async () => {
    const storage = new MemoryStorage()
    renderReceivePage({storage})
    fireEvent.click(screen.getByRole('button', {name: /start transfer/i}))

    window.dispatchEvent(
      new MessageEvent('message', {
        origin: 'https://evil.example',
        data: {type: 'skeydb:migration-snapshot:v1', nonce: 'abc', snapshot: makeSnapshot()},
      }),
    )
    expect(screen.queryByText(/new to this site/i)).not.toBeInTheDocument()

    window.dispatchEvent(
      new MessageEvent('message', {
        origin: 'https://dansa.github.io',
        data: {type: 'skeydb:migration-snapshot:v1', nonce: 'abc', snapshot: makeSnapshot()},
      }),
    )

    expect(await screen.findByText(/new to this site/i)).toBeInTheDocument()
    expect(storage.getItem('skeydb.builder.allowDupes.v1')).toBeNull()
  })

  it('applies missing entries and can replace conflicts with a backup', async () => {
    const storage = new MemoryStorage()
    storage.setItem('skeydb.builder.teamPreviewMode.v1', 'expanded')
    renderReceivePage({storage})
    fireEvent.click(screen.getByRole('button', {name: /start transfer/i}))
    window.dispatchEvent(
      new MessageEvent('message', {
        origin: 'https://dansa.github.io',
        data: {type: 'skeydb:migration-snapshot:v1', nonce: 'abc', snapshot: makeSnapshot()},
      }),
    )

    const fieldset = await screen.findByRole('group', {name: /choose what to do/i})
    expect(within(fieldset).getByText(/builder team preview mode/i)).toBeInTheDocument()
    expect(
      within(fieldset).queryByText(/skeydb\.builder\.teamPreviewMode/i),
    ).not.toBeInTheDocument()

    fireEvent.click(within(fieldset).getByRole('button', {name: /replace all conflicts/i}))
    fireEvent.click(screen.getByRole('button', {name: /finish transfer/i}))

    await waitFor(() => {
      expect(screen.getByText(/transfer complete/i)).toBeInTheDocument()
    })
    expect(storage.getItem('skeydb.builder.allowDupes.v1')).toBe('1')
    expect(storage.getItem('skeydb.builder.teamPreviewMode.v1')).toBe('compact')
    expect(storage.getItem('skeydb.migration.backup.')).toBeNull()
    expect(
      [...storage.values.keys()].some((key) => key.startsWith('skeydb.migration.backup.')),
    ).toBe(true)
  })

  it('keeps target conflict values by default', async () => {
    const storage = new MemoryStorage()
    storage.setItem('skeydb.builder.teamPreviewMode.v1', 'expanded')
    renderReceivePage({storage})
    fireEvent.click(screen.getByRole('button', {name: /start transfer/i}))
    window.dispatchEvent(
      new MessageEvent('message', {
        origin: 'https://dansa.github.io',
        data: {type: 'skeydb:migration-snapshot:v1', nonce: 'abc', snapshot: makeSnapshot()},
      }),
    )

    await screen.findByRole('group', {name: /choose what to do/i})
    fireEvent.click(screen.getByRole('button', {name: /finish transfer/i}))

    expect(await screen.findByText(/transfer complete/i)).toBeInTheDocument()
    expect(storage.getItem('skeydb.builder.teamPreviewMode.v1')).toBe('expanded')
  })

  it('can review a pasted fallback transfer code', async () => {
    renderReceivePage()

    fireEvent.click(screen.getByText(/paste a transfer code/i))
    fireEvent.change(screen.getByLabelText(/paste transfer code/i), {
      target: {value: JSON.stringify(makeSnapshot())},
    })
    fireEvent.click(screen.getByRole('button', {name: /review transfer code/i}))

    expect(await screen.findByText(/new to this site/i)).toBeInTheDocument()
    expect(screen.getByRole('button', {name: /finish transfer/i})).toBeInTheDocument()
  })

  it('rejects pasted transfer codes from unsupported source origins', () => {
    renderReceivePage()

    fireEvent.click(screen.getByText(/paste a transfer code/i))
    fireEvent.change(screen.getByLabelText(/paste transfer code/i), {
      target: {value: JSON.stringify(makeSnapshotFrom('https://evil.example'))},
    })
    fireEvent.click(screen.getByRole('button', {name: /review transfer code/i}))

    expect(screen.getByText(/unsupported source/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', {name: /finish transfer/i})).not.toBeInTheDocument()
  })
})
