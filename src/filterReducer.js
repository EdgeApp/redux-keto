import { flattenWrapper } from './wrapper.js'

function filterActionsDefault(action, next) {
  return action
}

function filterNextDefault(next) {
  return next
}

/**
 * Filters the next and actions going into a fat reducer.
 */
export function filterReducer(
  reducer,
  filterAction = filterActionsDefault,
  filterNext = filterNextDefault
) {
  const defaultState = reducer.defaultState

  function filteredReducer(state = defaultState, action, next, prev) {
    const innerAction = filterAction(action, next)
    const innerNext = filterNext(next)
    const innerPrev = filterNext(prev)

    if (!innerAction) return state

    const wrapper = reducer(state, innerAction, innerNext, innerPrev)

    // If we are the topmost fat reducer, flatten the wrappers:
    return next === undefined ? flattenWrapper(state, wrapper) : wrapper
  }
  filteredReducer.defaultState = defaultState

  return filteredReducer
}
