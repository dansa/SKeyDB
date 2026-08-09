import {describe, expect, test} from 'vitest'

import {createDbDetailStore} from './dbDetailStore'

describe('dbDetailStore', () => {
  test('opening overlay details pushes entity refs with source metadata', () => {
    const store = createDbDetailStore()

    store.getState().openDetail({kind: 'awakener', id: 'awakener-0001'}, 'builder-overlay')
    store.getState().openDetail({kind: 'wheel', id: 'wheel-0002'}, 'collection-overlay')

    expect(store.getState().stack).toEqual([
      {kind: 'awakener', id: 'awakener-0001', source: 'builder-overlay'},
      {kind: 'wheel', id: 'wheel-0002', source: 'collection-overlay'},
    ])
  })

  test('replaceRouteDetail replaces the route-bound entry instead of stacking route changes', () => {
    const store = createDbDetailStore()

    store.getState().replaceRouteDetail({kind: 'awakener', id: 'awakener-0001'})
    store.getState().openDetail({kind: 'posse', id: 'posse-0003'}, 'builder-overlay')
    store.getState().replaceRouteDetail({kind: 'wheel', id: 'wheel-0002'})

    expect(store.getState().stack).toEqual([
      {kind: 'wheel', id: 'wheel-0002', source: 'database-route'},
      {kind: 'posse', id: 'posse-0003', source: 'builder-overlay'},
    ])
  })

  test('pushReferenceDetail stacks above the active detail and can be popped', () => {
    const store = createDbDetailStore()

    store.getState().openDetail({kind: 'covenant', id: 'covenant-0004'}, 'collection-overlay')
    store.getState().pushReferenceDetail({kind: 'posse', id: 'posse-0003'})
    store.getState().popDetail()

    expect(store.getState().stack).toEqual([
      {kind: 'covenant', id: 'covenant-0004', source: 'collection-overlay'},
    ])
  })

  test('syncFromRoute null removes route-bound entries while preserving overlays and references', () => {
    const store = createDbDetailStore()

    store.getState().replaceRouteDetail({kind: 'awakener', id: 'awakener-0001'})
    store.getState().openDetail({kind: 'wheel', id: 'wheel-0002'}, 'builder-overlay')
    store.getState().pushReferenceDetail({kind: 'posse', id: 'posse-0003'})
    store.getState().syncFromRoute(null)

    expect(store.getState().stack).toEqual([
      {kind: 'wheel', id: 'wheel-0002', source: 'builder-overlay'},
      {kind: 'posse', id: 'posse-0003', source: 'reference'},
    ])
  })

  test('syncFromRoute ref replaces the route-bound entry while preserving overlays and references', () => {
    const store = createDbDetailStore()

    store.getState().replaceRouteDetail({kind: 'awakener', id: 'awakener-0001'})
    store.getState().openDetail({kind: 'wheel', id: 'wheel-0002'}, 'builder-overlay')
    store.getState().pushReferenceDetail({kind: 'posse', id: 'posse-0003'})
    store.getState().syncFromRoute({kind: 'covenant', id: 'covenant-0004'})

    expect(store.getState().stack).toEqual([
      {kind: 'covenant', id: 'covenant-0004', source: 'database-route'},
      {kind: 'wheel', id: 'wheel-0002', source: 'builder-overlay'},
      {kind: 'posse', id: 'posse-0003', source: 'reference'},
    ])
  })

  test('closeAllDetails empties the stack', () => {
    const store = createDbDetailStore()

    store.getState().replaceRouteDetail({kind: 'awakener', id: 'awakener-0001'})
    store.getState().openDetail({kind: 'wheel', id: 'wheel-0002'}, 'builder-overlay')
    store.getState().closeAllDetails()

    expect(store.getState().stack).toEqual([])
  })

  test('closeOverlaySource removes each matching root and its reference descendants', () => {
    const store = createDbDetailStore()

    store.getState().replaceRouteDetail({kind: 'awakener', id: 'route-root'})
    store.getState().openDetail({kind: 'wheel', id: 'builder-root-1'}, 'builder-overlay')
    store.getState().pushReferenceDetail({kind: 'posse', id: 'builder-reference-1'})
    store.getState().openDetail({kind: 'covenant', id: 'collection-root'}, 'collection-overlay')
    store.getState().pushReferenceDetail({kind: 'awakener', id: 'collection-reference'})
    store.getState().openDetail({kind: 'wheel', id: 'builder-root-2'}, 'builder-overlay')
    store.getState().pushReferenceDetail({kind: 'posse', id: 'builder-reference-2'})
    store.getState().openDetail({kind: 'awakener', id: 'timeline-root'}, 'timeline-overlay')
    store.getState().pushReferenceDetail({kind: 'wheel', id: 'timeline-reference'})

    store.getState().closeOverlaySource('builder-overlay')

    expect(store.getState().stack).toEqual([
      {kind: 'awakener', id: 'route-root', source: 'database-route'},
      {kind: 'covenant', id: 'collection-root', source: 'collection-overlay'},
      {kind: 'awakener', id: 'collection-reference', source: 'reference'},
      {kind: 'awakener', id: 'timeline-root', source: 'timeline-overlay'},
      {kind: 'wheel', id: 'timeline-reference', source: 'reference'},
    ])
  })

  test('closeOverlaySource is idempotent when its branch is absent', () => {
    const store = createDbDetailStore()

    store.getState().replaceRouteDetail({kind: 'awakener', id: 'route-root'})
    store.getState().openDetail({kind: 'covenant', id: 'collection-root'}, 'collection-overlay')
    store.getState().pushReferenceDetail({kind: 'wheel', id: 'collection-reference'})

    store.getState().closeOverlaySource('builder-overlay')
    store.getState().closeOverlaySource('builder-overlay')

    expect(store.getState().stack).toEqual([
      {kind: 'awakener', id: 'route-root', source: 'database-route'},
      {kind: 'covenant', id: 'collection-root', source: 'collection-overlay'},
      {kind: 'wheel', id: 'collection-reference', source: 'reference'},
    ])
  })
})
