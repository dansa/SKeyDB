export function parseEnumSearchParam<TValue extends string>(
  rawValue: string | null,
  allowedValues: readonly TValue[],
  fallback: TValue,
): TValue {
  return rawValue && allowedValues.includes(rawValue as TValue) ? (rawValue as TValue) : fallback
}

export function normalizeBrowseQuery(rawValue: string | null | undefined): string {
  return rawValue?.trim() ?? ''
}

export function setSearchParam(params: URLSearchParams, key: string, value?: string) {
  if (!value) {
    params.delete(key)
    return
  }

  params.set(key, value)
}

export function patchSearchParams<TState>(
  searchParams: URLSearchParams,
  patch: Partial<TState>,
  parseState: (searchParams: URLSearchParams) => TState,
  writeState: (nextParams: URLSearchParams, nextState: TState) => void,
  buildNextState?: (currentState: TState, patch: Partial<TState>) => TState,
): URLSearchParams {
  const nextParams = new URLSearchParams(searchParams)
  const currentState = parseState(searchParams)
  const nextState = buildNextState
    ? buildNextState(currentState, patch)
    : {...currentState, ...patch}

  writeState(nextParams, nextState)
  return nextParams
}
