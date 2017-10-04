import { flattenWrapper, makeWrapper, makeWrapperProto } from './wrapper.js'

/**
 * Combines several reducers into one.
 */
export function buildReducer (reducerMap) {
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

  // Build the wrapper:
  const wrapperProto = makeWrapperProto(keys, key => reducerMap[key])

  // Build the default state:
  const defaultState = {}
  for (const key of keys) {
    defaultState[key] = reducerMap[key].defaultState
  }

  function builtReducer (state = defaultState, action, props, oldProps) {
    const wrapper = makeWrapper(wrapperProto, state, action, props, oldProps)

    // If we are the topmost fat reducer, flatten the wrappers:
    return props == null ? flattenWrapper(state, wrapper) : wrapper
  }
  builtReducer.defaultState = defaultState

  return builtReducer
}
