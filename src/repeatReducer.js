import { flattenWrapper, makeWrapper, makeWrapperProto } from './wrapper.js'

function filterPropsDefault (props, id) {
  return { ...props, peers: undefined, id }
}

function filterActionsDefault (action, id) {
  return action
}

/**
 * Replicates a reducer, allowing each instance to manage a single list item.
 */
export function repeatReducer (
  reducer,
  listIds,
  filterProps = filterPropsDefault,
  filterAction = filterActionsDefault
) {
  function wrapChild (id) {
    return function wrappedReducer (state = {}, action, props, oldProps) {
      const innerAction = filterAction(action, id)
      const innerProps = filterProps(props, id)
      const innerOldProps = filterProps(oldProps, id)

      if (!innerAction) return state

      return reducer(state, innerAction, innerProps, innerOldProps)
    }
  }

  return function listReducer (state = {}, action, props, oldProps) {
    const ids = listIds(props)
    const oldIds = listIds(oldProps)

    // Try to recycle our wrapper prototype, if possible:
    let wrapperProto = Object.getPrototypeOf(state)
    if (ids !== oldIds || wrapperProto === Object) {
      wrapperProto = makeWrapperProto(ids, id => wrapChild(id))
    }

    const wrapper = makeWrapper(wrapperProto, state, action, props, oldProps)

    // If we are the topmost fat reducer, flatten the wrappers:
    return props == null ? flattenWrapper(state, wrapper) : wrapper
  }
}
