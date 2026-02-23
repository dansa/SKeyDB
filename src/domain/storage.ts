export type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

export function getBrowserLocalStorage(): StorageLike | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    return window.localStorage
  } catch {
    return null
  }
}

export function safeStorageRead(storage: StorageLike | null, key: string): string | null {
  if (!storage) {
    return null
  }

  try {
    return storage.getItem(key)
  } catch {
    return null
  }
}

export function safeStorageWrite(storage: StorageLike | null, key: string, value: string): boolean {
  if (!storage) {
    return false
  }

  try {
    storage.setItem(key, value)
    return true
  } catch {
    return false
  }
}

export function safeStorageRemove(storage: StorageLike | null, key: string): boolean {
  if (!storage) {
    return false
  }

  try {
    storage.removeItem(key)
    return true
  } catch {
    return false
  }
}
