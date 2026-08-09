export function getOrCreateMapValue<TKey, TValue>(
  cache: Map<TKey, TValue>,
  key: TKey,
  createValue: () => TValue,
): TValue {
  const cached = cache.get(key)
  if (cached !== undefined) {
    return cached
  }

  const value = createValue()
  cache.set(key, value)
  return value
}

export function getOrCreateRetryableMapPromise<TKey, TValue>(
  cache: Map<TKey, Promise<TValue>>,
  key: TKey,
  createValue: () => Promise<TValue>,
): Promise<TValue> {
  const cached = cache.get(key)
  if (cached !== undefined) {
    return cached
  }

  const value = Promise.resolve().then(createValue)
  cache.set(key, value)
  void value.catch(() => {
    if (cache.get(key) === value) {
      cache.delete(key)
    }
  })
  return value
}
