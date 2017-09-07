/**
 * Combines several reducers into one.
 */
export function buildReducer (reducerMap, filterPeers) {
  // Validate argument types:
  if (typeof reducerMap !== 'object' || reducerMap === null) {
    throw new TypeError('The reducer map must be an object.')
  }
  const keys = Object.keys(reducerMap)
  for (const key of keys) {
    if (typeof reducerMap[key] !== 'function') {
      throw new TypeError('Reducers must be functions.')
    }
  }

  return function builtReducer (state = {}, action, ourPeers) {
    // Set up the initial peers object:
    const peers =
      ourPeers != null && filterPeers != null ? filterPeers(ourPeers) : {}

    // Verify the `filterPeers` return value:
    if (typeof peers !== 'object' || peers === null) {
      throw new TypeError(`filterPeers must return an object`)
    }

    // Make a place to put our return values:
    const output = {}

    // Add shims for each of our child reducers:
    for (const key of keys) {
      let running = false

      Object.defineProperty(peers, key, {
        configurable: false,
        enumerable: true,
        get () {
          // If we haven't run this reducer yet, do so now:
          if (output[key] === void 0) {
            if (running) {
              const e = new ReferenceError(
                `Reducer '${key}' depends on its own result`
              )
              e.name = 'ReduxKetoCircularReferenceError'
              throw e
            }

            running = true
            try {
              const newValue = reducerMap[key](state[key], action, peers)
              if (newValue === undefined) {
                throw new TypeError(`Reducer '${key}' returned undefined`)
              }
              output[key] = newValue
            } finally {
              running = false
            }
          }

          // Return the cached value:
          return output[key]
        }
      })
    }

    // Define the `unchanged` accessor:
    if (ourPeers && filterPeers && !ourPeers.unchanged) {
      peers.unchanged = false
    } else {
      Object.defineProperty(peers, 'unchanged', {
        configurable: false,
        enumerable: true,
        get () {
          let unchanged = true
          for (const key of keys) {
            try {
              const newValue = peers[key]
              if (newValue !== state[key]) unchanged = false
            } catch (e) {
              // Ignore circular reference errors, but let others pass:
              if (e.name !== 'ReduxKetoCircularReferenceError') throw e
            }
          }

          return unchanged
        }
      })
    }

    // Evaulate all reducers while checking for changes:
    let unchanged = true
    for (const key of keys) {
      const newValue = peers[key]
      if (newValue !== state[key]) unchanged = false
    }

    return unchanged ? state : output
  }
}
