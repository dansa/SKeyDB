import {fireEvent, render, screen, within} from '@testing-library/react'
import {MemoryRouter} from 'react-router'
import {describe, expect, it} from 'vitest'

import {type StorageLike} from '@/domain/storage'
import {saveBuilderDraft} from '@/features/builder/builder-persistence'

import {DomainMigrationNotice} from './DomainMigrationNotice'
import {isDomainMigrationNoticeLaunchEnabled} from './domainMigrationNoticeLaunch'

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

const OLD_LOCATION = {
  origin: 'https://dansa.github.io',
  hostname: 'dansa.github.io',
  protocol: 'https:',
  port: '',
  pathname: '/SKeyDB/',
} satisfies Pick<Location, 'origin' | 'hostname' | 'protocol' | 'port' | 'pathname'>

const NEW_LOCATION = {
  origin: 'https://skeydb.com',
  hostname: 'skeydb.com',
  protocol: 'https:',
  port: '',
  pathname: '/',
} satisfies Pick<Location, 'origin' | 'hostname' | 'protocol' | 'port' | 'pathname'>

function renderNotice({
  locationLike,
  routePathname = '/',
  storage = new MemoryStorage(),
  enabled = true,
}: {
  locationLike: Pick<Location, 'origin' | 'hostname' | 'protocol' | 'port' | 'pathname'>
  routePathname?: string
  storage?: StorageLike | null
  enabled?: boolean
}) {
  render(
    <MemoryRouter>
      <DomainMigrationNotice
        allowLocalOrigins={false}
        enabled={enabled}
        locationLike={locationLike}
        routePathname={routePathname}
        storage={storage}
      />
    </MemoryRouter>,
  )
  return storage
}

function saveBuilderData(storage: StorageLike) {
  saveBuilderDraft(storage, {
    activeTeamId: 'team-1',
    teams: [
      {
        id: 'team-1',
        name: 'Team 1',
        slots: [
          {
            slotId: 'slot-1',
            awakenerId: 'awakener-0021',
            realm: 'AEQUOR',
            level: 60,
            wheels: [null, null],
          },
          {slotId: 'slot-2', wheels: [null, null]},
          {slotId: 'slot-3', wheels: [null, null]},
          {slotId: 'slot-4', wheels: [null, null]},
        ],
      },
    ],
  })
}

describe('DomainMigrationNotice', () => {
  it('shows the old-domain transfer action only when saved builder or collection data exists', () => {
    const storage = new MemoryStorage()
    saveBuilderData(storage)

    renderNotice({locationLike: OLD_LOCATION, storage})

    const region = screen.getByRole('region', {name: /domain move/i})
    expect(within(region).getByText(/has saved builder or collection data/i)).toBeInTheDocument()
    expect(within(region).getByRole('link', {name: /move saved data/i})).toHaveAttribute(
      'href',
      'https://skeydb.com/#/migrate',
    )
  })

  it('keeps the old-domain notice informational when there is no saved builder or collection data', () => {
    renderNotice({locationLike: OLD_LOCATION})

    const region = screen.getByRole('region', {name: /domain move/i})
    expect(within(region).getByText(/skeydb now lives at skeydb.com/i)).toBeInTheDocument()
    expect(within(region).queryByRole('link', {name: /move saved data/i})).not.toBeInTheDocument()
  })

  it('does not show the old-domain transfer action for malformed saved data', () => {
    const storage = new MemoryStorage()
    storage.setItem('skeydb.builder.v2', '{')
    storage.setItem('skeydb.collection.v2', JSON.stringify({version: 2}))

    renderNotice({locationLike: OLD_LOCATION, storage})

    const region = screen.getByRole('region', {name: /domain move/i})
    expect(within(region).queryByRole('link', {name: /move saved data/i})).not.toBeInTheDocument()
  })

  it('shows the new-domain transfer prompt only before this domain has saved data', () => {
    renderNotice({locationLike: NEW_LOCATION})

    const region = screen.getByRole('region', {name: /domain move/i})
    expect(within(region).getByText(/used skeydb before on github pages/i)).toBeInTheDocument()
    expect(within(region).getByRole('link', {name: /transfer saved data/i})).toHaveAttribute(
      'href',
      '/migrate',
    )
  })

  it('hides the new-domain transfer prompt once this domain has saved builder or collection data', () => {
    const storage = new MemoryStorage()
    saveBuilderData(storage)

    renderNotice({locationLike: NEW_LOCATION, storage})

    expect(screen.queryByRole('region', {name: /domain move/i})).not.toBeInTheDocument()
  })

  it('stores dismissal on the current origin', () => {
    const storage = renderNotice({locationLike: NEW_LOCATION})

    fireEvent.click(screen.getByRole('button', {name: /dismiss domain move notice/i}))

    expect(screen.queryByRole('region', {name: /domain move/i})).not.toBeInTheDocument()
    expect(storage?.getItem('skeydb.domainMoveNotice.target.dismissed.v1')).toBe('1')
  })

  it('does not show on migration routes', () => {
    renderNotice({locationLike: NEW_LOCATION, routePathname: '/migrate'})

    expect(screen.queryByRole('region', {name: /domain move/i})).not.toBeInTheDocument()
  })

  it('stays hidden when the launch switch is disabled', () => {
    const storage = new MemoryStorage()
    saveBuilderData(storage)

    renderNotice({enabled: false, locationLike: OLD_LOCATION, storage})

    expect(screen.queryByRole('region', {name: /domain move/i})).not.toBeInTheDocument()
  })

  it('keeps the production launch switch off unless explicitly enabled', () => {
    expect(isDomainMigrationNoticeLaunchEnabled({DEV: false})).toBe(false)
    expect(
      isDomainMigrationNoticeLaunchEnabled({
        DEV: false,
        VITE_ENABLE_DOMAIN_MIGRATION_NOTICE: '1',
      }),
    ).toBe(true)
    expect(
      isDomainMigrationNoticeLaunchEnabled({
        DEV: false,
        VITE_ENABLE_DOMAIN_MIGRATION_NOTICE: 'false',
      }),
    ).toBe(false)
    expect(isDomainMigrationNoticeLaunchEnabled({DEV: true})).toBe(true)
  })
})
