import { flattenWrapper } from './wrapper.js'

function filterActionsDefault (action, props) {
  return action
}

function filterPropsDefault (props) {
  return props
}

/**
 * Filters the props and actions going into a fat reducer.
 */
export function filterReducer (
  reducer,
  filterAction = filterActionsDefault,
  filterProps = filterPropsDefault
) {
  const defaultState = reducer.defaultState

  function filteredReducer (state = defaultState, action, props, oldProps) {
    const innerAction = filterAction(action, props)
    const innerProps = filterProps(props)
    const innerOldProps = filterProps(oldProps)

    if (!innerAction) return state

    const wrapper = reducer(state, innerAction, innerProps, innerOldProps)

    // If we are the topmost fat reducer, flatten the wrappers:
    return props === void 0 ? flattenWrapper(state, wrapper) : wrapper
  }
  filteredReducer.defaultState = defaultState

  return filteredReducer
}
