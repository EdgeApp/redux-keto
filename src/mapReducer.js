import { flattenWrapper, makeWrapper, makeWrapperProto } from './wrapper.js'

function makeNextDefault (next, children, id) {
  return {
    id,
    root: next !== void 0 ? next : children,
    get self () {
      return children[id]
    }
  }
}

const defaultState = {}

/**
 * Applies a reducer to each item of a list.
 * Each reducer manages its own state slice on behalf of the list item.
 */
export function mapReducer (reducer, listIds, makeNext = makeNextDefault) {
  function mapReducer (state = defaultState, action, next, prev) {
    const ids = listIds(next)

    // Try to recycle our wrapper prototype, if possible:
    const wrapperProto =
      state === defaultState || ids !== listIds(prev)
        ? makeWrapperProto(ids, id => reducer, makeNext)
        : Object.getPrototypeOf(state)

    const wrapper = makeWrapper(wrapperProto, state, action, next, prev)

    // If we are the topmost fat reducer, flatten the wrappers:
    return next === void 0 ? flattenWrapper(state, wrapper) : wrapper
  }
  mapReducer.defaultState = defaultState

  return mapReducer
}
