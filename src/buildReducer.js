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

  return function builtReducer (state = {}, action, props, oldProps) {
    const wrapper = makeWrapper(wrapperProto, state, action, props, oldProps)

    // If we are the topmost fat reducer, flatten the wrappers:
    return props == null ? flattenWrapper(state, wrapper) : wrapper
  }
}
