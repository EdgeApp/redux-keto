/**
 * Creates a memoized reducer for derived values.
 * The first aguments are argument filters,
 * which take the next and return an argument to pass to the derivation.
 * The reducer will only run if some of its arguments are not equal ('===').
 */
export function memoizeReducer() {
  let i = arguments.length - 1
  const reducer = arguments[i]
  const filters = []
  while (i-- > 0) filters[i] = arguments[i]

  // Type-check the arguments:
  if (typeof reducer !== 'function') {
    throw new TypeError('The reducer must be a function')
  }
  for (const filter of filters) {
    if (typeof filter !== 'function') {
      throw new TypeError('Each argument filter must be a function')
    }
  }

  return function memoizedReducer(
    state = reducer.defaultState,
    action,
    next,
    prev
  ) {
    let clean = state !== undefined
    const args = []
    for (let i = 0; i < filters.length; ++i) {
      args[i] = filters[i](next)
      if (clean && args[i] !== filters[i](prev)) clean = false
    }

    return clean ? state : reducer(...args)
  }
}
