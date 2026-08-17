import {describe, expect, test, vi} from 'vitest'

import {createDatabaseDetailOverlaySession} from './dbDetailStore'

describe('database detail overlay sessions', () => {
  test('open exposes only the owner branch and replaces its previous root', () => {
    const session = createDatabaseDetailOverlaySession()

    session.open({kind: 'awakener', id: 'awakener-0001'})
    session.open({kind: 'wheel', id: 'wheel-0002'})

    expect(session.top()).toEqual({kind: 'wheel', id: 'wheel-0002'})
    session.close()
    expect(session.isOpen()).toBe(false)
  })

  test('reference frames belong to the session that followed them', () => {
    const collection = createDatabaseDetailOverlaySession()
    const timeline = createDatabaseDetailOverlaySession()

    collection.open({kind: 'covenant', id: 'collection-root'})
    collection.followReference({kind: 'posse', id: 'collection-reference'})
    timeline.open({kind: 'awakener', id: 'timeline-root'})
    timeline.followReference({kind: 'wheel', id: 'timeline-reference'})

    expect(collection.top()).toEqual({kind: 'posse', id: 'collection-reference'})
    expect(timeline.top()).toEqual({kind: 'wheel', id: 'timeline-reference'})

    collection.close()
    expect(collection.top()).toEqual({kind: 'covenant', id: 'collection-root'})
    expect(timeline.top()).toEqual({kind: 'wheel', id: 'timeline-reference'})
  })

  test('close removes only the active stale frame while dispose clears the owner branch', () => {
    const session = createDatabaseDetailOverlaySession()
    session.open({kind: 'awakener', id: 'root'})
    session.followReference({kind: 'wheel', id: 'stale-reference'})

    session.close()
    expect(session.top()).toEqual({kind: 'awakener', id: 'root'})

    session.followReference({kind: 'posse', id: 'reference'})
    session.dispose()
    expect(session.isOpen()).toBe(false)
  })

  test('does not create an orphan reference frame without an open root', () => {
    const session = createDatabaseDetailOverlaySession()

    session.followReference({kind: 'wheel', id: 'orphan'})

    expect(session.isOpen()).toBe(false)
    expect(session.top()).toBeNull()
  })

  test('rejects entities that have no database detail renderer', () => {
    const session = createDatabaseDetailOverlaySession()

    session.open({kind: 'unknown', id: 'unknown'} as never)

    expect(session.isOpen()).toBe(false)
  })

  test('publishes narrow open-state changes to subscribers', () => {
    const session = createDatabaseDetailOverlaySession()
    const listener = vi.fn()
    const unsubscribe = session.subscribe(listener)

    session.open({kind: 'posse', id: 'posse-0001'})
    session.close()
    unsubscribe()

    expect(listener).toHaveBeenCalledTimes(2)
  })
})
