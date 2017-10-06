import { flattenWrapper, makeWrapper, makeWrapperProto } from './wrapper.js'

function makePropsDefault (props, peers, id) {
  return { peers, id }
}

const defaultState = {}

/**
 * Applies a reducer to each item of a list.
 * Each reducer manages its own state slice on behalf of the list item.
 */
export function mapReducer (reducer, listIds, makeProps = makePropsDefault) {
  function mapReducer (state = defaultState, action, props, oldProps) {
    const ids = listIds(props)

    // Try to recycle our wrapper prototype, if possible:
    const wrapperProto =
      state === defaultState || ids !== listIds(oldProps)
        ? makeWrapperProto(ids, id => reducer, makeProps)
        : Object.getPrototypeOf(state)

    const wrapper = makeWrapper(wrapperProto, state, action, props, oldProps)

    // If we are the topmost fat reducer, flatten the wrappers:
    return props == null ? flattenWrapper(state, wrapper) : wrapper
  }
  mapReducer.defaultState = defaultState

  return mapReducer
}
