import { flattenWrapper } from './wrapper.js'

function filterPropsDefault (props) {
  return { ...props, peers: undefined }
}

function filterActionsDefault (action) {
  return action
}

/**
 * Filters the props and actions going into a fat reducer.
 */
export function filterReducer (
  reducer,
  filterProps = filterPropsDefault,
  filterAction = filterActionsDefault
) {
  return function wrappedReducer (state, action, props, oldProps) {
    const innerAction = filterAction(action)
    const innerProps = filterProps(props)
    const innerOldProps = filterProps(oldProps)

    if (!innerAction) return state

    const wrapper = reducer(state, innerAction, innerProps, innerOldProps)

    // If we are the topmost fat reducer, flatten the wrappers:
    return props == null ? flattenWrapper(state, wrapper) : wrapper
  }
}
