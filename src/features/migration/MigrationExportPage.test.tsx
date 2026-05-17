import {act, render, screen, waitFor} from '@testing-library/react'
import {createMemoryRouter, MemoryRouter, RouterProvider} from 'react-router-dom'
import {describe, expect, it, vi} from 'vitest'

import {type StorageLike} from '@/domain/storage'

import {MigrationExportPage} from './MigrationExportPage'

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

const LOCATION = {
  origin: 'https://dansa.github.io',
  pathname: '/SKeyDB/',
} satisfies Pick<Location, 'origin' | 'pathname'>

const TARGET_LOCATION = {
  origin: 'https://skeydb.com',
  pathname: '/',
} satisfies Pick<Location, 'origin' | 'pathname'>

function renderExportPage({
  route = '/migrate/export?nonce=abc&targetOrigin=https%3A%2F%2Fskeydb.com',
  storage = new MemoryStorage(),
  postMessage = vi.fn(),
}: {
  route?: string
  storage?: StorageLike | null
  postMessage?: (message: unknown, targetOrigin: string) => void
} = {}) {
  render(
    <MemoryRouter initialEntries={[route]}>
      <MigrationExportPage
        allowLocalOrigins={false}
        locationLike={LOCATION}
        messageTarget={{postMessage}}
        storage={storage}
      />
    </MemoryRouter>,
  )
  return {postMessage, storage}
}

describe('MigrationExportPage', () => {
  it('posts a snapshot to the allowed target origin', async () => {
    const storage = new MemoryStorage()
    storage.setItem('skeydb.builder.allowDupes.v1', '1')
    const {postMessage} = renderExportPage({storage})

    await waitFor(() => {
      expect(postMessage).toHaveBeenCalledTimes(1)
    })
    expect(postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'skeydb:migration-snapshot:v1',
        nonce: 'abc',
        snapshot: expect.objectContaining({
          sourceOrigin: 'https://dansa.github.io',
          entries: [expect.objectContaining({key: 'skeydb.builder.allowDupes.v1', value: '1'})],
        }),
      }),
      'https://skeydb.com',
    )
    expect(screen.getByText(/transfer sent/i)).toBeInTheDocument()
  })

  it('rejects disallowed target origins', async () => {
    const postMessage = vi.fn()
    renderExportPage({
      route: '/migrate/export?nonce=abc&targetOrigin=https%3A%2F%2Fevil.example',
      postMessage,
    })

    expect(
      await screen.findByRole('heading', {name: /start from skeydb\.com/i}),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', {name: /open skeydb.com/i})).toHaveAttribute(
      'href',
      'https://skeydb.com/#/migrate',
    )
    expect(postMessage).not.toHaveBeenCalled()
  })

  it('points direct export-route visits back to the new domain', async () => {
    const postMessage = vi.fn()
    renderExportPage({route: '/migrate/export', postMessage})

    expect(
      await screen.findByRole('heading', {name: /start from skeydb\.com/i}),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', {name: /open skeydb.com/i})).toHaveAttribute(
      'href',
      'https://skeydb.com/#/migrate',
    )
    expect(postMessage).not.toHaveBeenCalled()
  })

  it('rejects export attempts from the new domain', async () => {
    const postMessage = vi.fn()
    render(
      <MemoryRouter
        initialEntries={['/migrate/export?nonce=abc&targetOrigin=https%3A%2F%2Fskeydb.com']}
      >
        <MigrationExportPage
          allowLocalOrigins={false}
          locationLike={TARGET_LOCATION}
          messageTarget={{postMessage}}
          storage={new MemoryStorage()}
        />
      </MemoryRouter>,
    )

    expect(
      await screen.findByText(/only works from the old github pages site/i),
    ).toBeInTheDocument()
    expect(postMessage).not.toHaveBeenCalled()
  })

  it('reports an empty source snapshot back to the opener', async () => {
    const {postMessage} = renderExportPage()

    await waitFor(() => {
      expect(postMessage).toHaveBeenCalledWith(
        {
          type: 'skeydb:migration-error:v1',
          nonce: 'abc',
          error: 'snapshot_empty',
        },
        'https://skeydb.com',
      )
    })
    expect(screen.getByText(/no saved skeydb data/i)).toBeInTheDocument()
  })

  it('reports storage errors back to the opener when storage is unavailable', async () => {
    const {postMessage} = renderExportPage({storage: null})

    await waitFor(() => {
      expect(postMessage).toHaveBeenCalledWith(
        {
          type: 'skeydb:migration-error:v1',
          nonce: 'abc',
          error: 'storage_unavailable',
        },
        'https://skeydb.com',
      )
    })
    expect(screen.getByText(/saved data is unavailable/i)).toBeInTheDocument()
  })

  it('shows a manual transfer code when the opener is unavailable', () => {
    const storage = new MemoryStorage()
    storage.setItem('skeydb.builder.allowDupes.v1', '1')

    render(
      <MemoryRouter
        initialEntries={['/migrate/export?nonce=abc&targetOrigin=https%3A%2F%2Fskeydb.com']}
      >
        <MigrationExportPage
          allowLocalOrigins={false}
          locationLike={LOCATION}
          messageTarget={null}
          storage={storage}
        />
      </MemoryRouter>,
    )

    expect(screen.getByText(/copy this transfer code/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/transfer code/i)).toHaveDisplayValue(
      /skeydb.builder.allowDupes.v1/,
    )
  })

  it('sends again when a reused export window receives a new nonce', async () => {
    const storage = new MemoryStorage()
    storage.setItem('skeydb.builder.allowDupes.v1', '1')
    const postMessage = vi.fn()
    const router = createMemoryRouter(
      [
        {
          element: (
            <MigrationExportPage
              allowLocalOrigins={false}
              locationLike={LOCATION}
              messageTarget={{postMessage}}
              storage={storage}
            />
          ),
          path: '/migrate/export',
        },
      ],
      {initialEntries: ['/migrate/export?nonce=abc&targetOrigin=https%3A%2F%2Fskeydb.com']},
    )

    render(<RouterProvider router={router} />)

    await waitFor(() => {
      expect(postMessage).toHaveBeenCalledTimes(1)
    })

    await act(async () => {
      await router.navigate('/migrate/export?nonce=def&targetOrigin=https%3A%2F%2Fskeydb.com')
    })

    await waitFor(() => {
      expect(postMessage).toHaveBeenCalledTimes(2)
    })
    expect(postMessage).toHaveBeenLastCalledWith(
      expect.objectContaining({
        type: 'skeydb:migration-snapshot:v1',
        nonce: 'def',
      }),
      'https://skeydb.com',
    )
  })
})
