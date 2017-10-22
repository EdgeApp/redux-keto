import { flattenWrapper, makeWrapper, makeWrapperProto } from './wrapper.js'

function makePropsDefault (props, peers, id) {
  return props !== void 0 ? props : peers
}

/**
 * Combines several reducers into one.
 */
export function buildReducer (reducerMap, makeProps = makePropsDefault) {
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
  const wrapperProto = makeWrapperProto(keys, key => reducerMap[key], makeProps)

  // Build the default state:
  const defaultState = {}
  for (const key of keys) {
    defaultState[key] = reducerMap[key].defaultState
  }

  function builtReducer (state = defaultState, action, props, oldProps) {
    const wrapper = makeWrapper(wrapperProto, state, action, props, oldProps)

    // If we are the topmost fat reducer, flatten the wrappers:
    return props === void 0 ? flattenWrapper(state, wrapper) : wrapper
  }
  builtReducer.defaultState = defaultState

  return builtReducer
}
