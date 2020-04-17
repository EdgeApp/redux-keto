import { flattenWrapper, makeWrapper, makeWrapperProto } from './wrapper.js'

function makeNextDefault(next, children, id) {
  return next !== undefined ? next : children
}

/**
 * Combines several reducers into one.
 */
export function buildReducer(reducerMap, makeNext = makeNextDefault) {
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
  const wrapperProto = makeWrapperProto(keys, key => reducerMap[key], makeNext)

  // Build the default state:
  const defaultState = {}
  for (const key of keys) {
    defaultState[key] = reducerMap[key].defaultState
  }

  function builtReducer(state = defaultState, action, next, prev) {
    const wrapper = makeWrapper(wrapperProto, state, action, next, prev)

    // If we are the topmost fat reducer, flatten the wrappers:
    return next === undefined ? flattenWrapper(state, wrapper) : wrapper
  }
  builtReducer.defaultState = defaultState

  return builtReducer
}
