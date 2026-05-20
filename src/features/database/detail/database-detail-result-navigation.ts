export type DatabaseDetailResultKind = 'awakener' | 'wheel' | 'posse' | 'covenant'

export interface DatabaseDetailResultSetItem {
  id: string
  imageTreatment?: 'art' | 'covenant-icon' | 'icon'
  imageSrc?: string
  name: string
}

export interface DatabaseDetailResultSet {
  kind: DatabaseDetailResultKind
  items: readonly DatabaseDetailResultSetItem[]
}

export interface DatabaseDetailResultRef {
  kind: DatabaseDetailResultKind
  id: string
}

export interface DatabaseDetailResultSelectRef extends DatabaseDetailResultRef {
  name: string
}

export interface DatabaseDetailResultNavigationPreview {
  imageTreatment?: DatabaseDetailResultSetItem['imageTreatment']
  imageSrc?: string
  label: string
}

export interface DatabaseDetailResultNavigationTarget {
  preview: DatabaseDetailResultNavigationPreview
  ref: DatabaseDetailResultSelectRef
}

export interface DatabaseDetailResultNavigation {
  current: {
    index: number
    ref: DatabaseDetailResultRef
    total: number
  }
  next: DatabaseDetailResultNavigationTarget | null
  onNext: () => void
  onPrevious: () => void
  previous: DatabaseDetailResultNavigationTarget | null
}

interface CreateDatabaseDetailResultNavigationOptions {
  currentRef: DatabaseDetailResultRef | null
  onSelect: (ref: DatabaseDetailResultSelectRef) => void
  resultSet: DatabaseDetailResultSet | null
}

function targetFromEntry(
  kind: DatabaseDetailResultKind,
  entry: DatabaseDetailResultSetItem,
): DatabaseDetailResultNavigationTarget {
  return {
    preview: {
      imageSrc: entry.imageSrc,
      imageTreatment: entry.imageTreatment,
      label: entry.name,
    },
    ref: {kind, id: entry.id, name: entry.name},
  }
}

export function createDatabaseDetailResultNavigation({
  currentRef,
  onSelect,
  resultSet,
}: CreateDatabaseDetailResultNavigationOptions): DatabaseDetailResultNavigation | null {
  if (!resultSet || currentRef?.kind !== resultSet.kind || resultSet.items.length < 2) {
    return null
  }

  const currentIndex = resultSet.items.findIndex((item) => item.id === currentRef.id)
  if (currentIndex === -1) {
    return null
  }

  const current = resultSet.items[currentIndex]
  const previous =
    currentIndex > 0 ? targetFromEntry(resultSet.kind, resultSet.items[currentIndex - 1]) : null
  const next =
    currentIndex < resultSet.items.length - 1
      ? targetFromEntry(resultSet.kind, resultSet.items[currentIndex + 1])
      : null

  return {
    current: {
      index: currentIndex,
      ref: {kind: resultSet.kind, id: current.id},
      total: resultSet.items.length,
    },
    next,
    onNext: () => {
      if (next) {
        onSelect(next.ref)
      }
    },
    onPrevious: () => {
      if (previous) {
        onSelect(previous.ref)
      }
    },
    previous,
  }
}
