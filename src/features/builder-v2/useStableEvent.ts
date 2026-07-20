import {useCallback, useLayoutEffect, useRef} from 'react'

/**
 * Returns one stable callback identity while dispatching to the latest committed handler.
 * This is for callbacks passed to children or third-party hooks; React's useEffectEvent
 * cannot be used here because Effect Events may only be called from Effects.
 */
export function useStableEvent<TArgs extends unknown[], TResult>(
  handler: (...args: TArgs) => TResult,
): (...args: TArgs) => TResult {
  const handlerRef = useRef(handler)

  useLayoutEffect(() => {
    handlerRef.current = handler
  }, [handler])

  return useCallback((...args: TArgs) => handlerRef.current(...args), [])
}
