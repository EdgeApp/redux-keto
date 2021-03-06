// Special property that only our wrappers will have:
const wrapperMagic = 'redux-keto wrapper'

/**
 * Makes a collection of lazy getters for a key-value state slice.
 * The actual wrapper object inherits from this prototype.
 */
export function makeWrapperProto(keys, makeReducer, makeNext) {
  const wrapperProto = Object.create(null)
  for (const key of keys) {
    const reducer = makeReducer(key)

    Object.defineProperty(wrapperProto, key, {
      configurable: true,
      enumerable: true,
      get() {
        const wrapper = this
        const stash = wrapper[wrapperMagic]

        // If we are already running, this is a problem!
        if (stash.running[key]) {
          const e = new ReferenceError(
            `Reducer '${key}' depends on its own result`
          )
          e.name = 'ReduxKetoCircularReferenceError'
          throw e
        }
        stash.running[key] = true

        // Evaluate the reducer:
        try {
          const out = reducer(
            stash.state[key],
            stash.action,
            makeNext(stash.next, wrapper, key),
            makeNext(stash.prev, stash.state, key)
          )
          if (out === undefined) {
            throw new TypeError(`Reducer '${key}' returned undefined`)
          }
          Object.defineProperty(wrapper, key, {
            configurable: true,
            enumerable: true,
            writable: false,
            value: out
          })
          return out
        } finally {
          stash.running[key] = false
        }
      }
    })
  }

  return wrapperProto
}

/**
 * Makes a lazy wrapper object for a key-value state slice.
 */
export function makeWrapper(wrapperProto, state, action, next, prev) {
  const wrapper = Object.create(wrapperProto)
  Object.defineProperty(wrapper, wrapperMagic, {
    configurable: true,
    enumerable: false,
    writable: false,
    value: { state, action, next, prev, running: {} }
  })

  return wrapper
}

/**
 * Flattens a lazy key-value wrapper into a plain-old object
 * with the current state as its properties.
 */
export function flattenWrapper(state = {}, wrapper) {
  // If it's not a wrapper, we are done:
  if (wrapper === null || wrapper[wrapperMagic] == null) return wrapper

  // Diff the old and new states:
  const keys = Object.keys(Object.getPrototypeOf(wrapper))
  let unchanged = Object.keys(state).length === keys.length
  for (const key of keys) {
    Object.defineProperty(wrapper, key, {
      configurable: false,
      enumerable: true,
      writable: false,
      value: flattenWrapper(state[key], wrapper[key])
    })
    if (wrapper[key] !== state[key]) {
      unchanged = false
    }
  }

  // If nothing changed, just return the previous state:
  if (unchanged) return state

  delete wrapper[wrapperMagic]
  return wrapper
}
