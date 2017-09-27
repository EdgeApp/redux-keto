import { flattenWrapper, makeWrapper, makeWrapperProto } from './wrapper.js'

function filterPropsDefault (props, id) {
  return { ...props, peers: undefined, id }
}

function filterActionsDefault (action, id) {
  return action
}

const defaultState = {}

/**
 * Applies a reducer to each item of a list.
 * Each reducer manages its own state slice on behalf of the list item.
 */
export function mapReducer (
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

  return function listReducer (state = defaultState, action, props, oldProps) {
    const ids = listIds(props)
    const oldIds = listIds(oldProps)

    // Try to recycle our wrapper prototype, if possible:
    const wrapperProto =
      state === defaultState || ids !== oldIds
        ? makeWrapperProto(ids, id => wrapChild(id))
        : Object.getPrototypeOf(state)

    const wrapper = makeWrapper(wrapperProto, state, action, props, oldProps)

    // If we are the topmost fat reducer, flatten the wrappers:
    return props == null ? flattenWrapper(state, wrapper) : wrapper
  }
}
