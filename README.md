# redux-keto

> A tool for building fat reducers

The Redux architecture works best when the reducers contain as much business logic as possible. Doing this in practice is hard, though, since reducers can't pass values between each other.

This library provide a way to build "fat reducers", which take an extra `props` argument in addition to the normal `state` and `action` arguments. Fat reducers use this extra parameter to pass values between each other in a fully-reactive, auto-updating way.

Fat reducers work seamlessly with normal reducers, so there are no big changes to the way Redux works. Just use fat reducers wherever they make sense.

## Usage example

Suppose an app has two pieces of state, a `counter` and a user-settable `maxCount`. The counter should never exceed `maxCount`, so it also needs update itself whenever `maxCount` changes.

Using `redux-keto`, the `maxCount` reducer can be perfectly normal:

```js
function maxCount (state = 0, action) {
  return action.type === 'CHANGE_MAX_COUNT' ? action.payload : state
}
```

The `counter` reducer is only a little more complicated, since it needs to consider the `maxCount` state:

```js
function counter (state = 0, action, props) {
  return Math.min(
    props.peers.maxCount,
    action.type === 'INCREMENT' ? state + action.payload : state
  )
}
```

Finally, the `buildReducer` function from `redux-keto` combines these two reducers into one:

```js
import { buildReducer } from 'redux-keto'

export const rootReducer = buildReducer({ maxCount, counter })
```

That's it! Compared to the [alternatives](https://github.com/Airbitz/redux-keto/blob/master/docs/bad-alternatives.md), this is incredibly simple.

Everything is fully reactive, since the `peers` parameter reflects the *next* state of each reducer. In other words, `peers.maxCount` contains the result of running the `maxCount` reducer on the current action. This means that dispatching a `CHANGE_MAX_COUNT` action will automatically update the counter without any extra work. By checking the new `maxCount` value on every action, the `counter` reducer always keeps itself up-to-date.

### Derived values

To derive a value from some existing state, just create a fat reducer that ignores its `state` and `action` parameters:

```js
function countIsEven (state, action, props) {
  return props.peers.counter % 2 === 0
}
```

Now `countIsEven` will stay in sync with the `counter` no matter what happens. Because this is just a normal reducer, it will also appear in `peers` so other reducers can access it.

To optimize cases where the props haven't changed, fat reducers receive a copy of their previous props, which they can check for differences:

```js
function countIsOdd (state, action, props, oldProps) {
  if (props.peers.count === oldProps.peers.count) return state

  return props.peers.counter % 2 !== 0
}
```

Now the `countIsOdd` calculation will only run when the counter actually changes.

### Nested fat reducers

If `buildReducer` recieves a `props.peers` from the outside, it will simply pass it along to its children unchanged. This means that the top-most `buildReducer` acts as the root of the `peers` tree. If the top-most `buildReducer` also happens to be the top-most reducer in the store, then `peers` will have the same shape as the Redux `getState()`.

### Custom props

To customize the props going into a reducer, use the `filterReducer` function:

```js
import { buildReducer, filterReducer } from 'redux-keto'

counterState = filterReducer(
  buildReducer({ maxCount, counter }),
  props => ({ otherState: props.peers.otherState })
}

const rootReducer = buildReducer({ counterState, otherState })
```

The second parameter to `filterReducer` is a function that translates the outer props into props for the inner reducer.

In this example, `filterReducer` renames the global `props.peers.otherState` into `props.otherState`. Because the inner props don't include a `peers` member, the inner `buildReducer` will add one. This means that the `counter` reducer can continue to refer to `props.peers.maxCount` as before, no matter where it is located in the global state tree.

### Reducer lists

Applications often manage lists of things. For example, a chat platform might manage multiple conversations, each with its own state. To handle cases like this, `redux-keto` provides a `mapReducer` function:

```js
import { mapReducer } from 'redux-keto'

const chatsById = mapReducer(
  chatReducer,

  // The list of ids:
  props => props.peers.activeChatIds,

  // Filter the props:
  (props, id) => ({ chatId: id }),

  // Filter the actions:
  (action, id) => {
    if (action.payload.chatId === id) return action
  }
)
```

The first `mapReducer` parameter is the reducer to replicate, and the second parameter returns a list of ids. There will be one `chatReducer` for each id.

The final two optional parameters are the props filter and action filter. In this example, the props filter passes the chat id in as a prop, while the action filter ensures that the individual reducers will only run if their `id` matches the `id` in the action's payload.

### Isolating reducers

Like `mapReducer`, the `filterReducer` function also accepts an optional action filter. This can be useful for creating stand-alone sub-stores that still talk to the rest of the app:

```js
const subsystem = filterReducer(
  subsystemReducer,

  // Filter the props:
  props => ({ settings: props.peers.subsystemSettings }),

  // Filter the actions:
  action => {
    if (/^SUBSYSTEM_/.test(action.type)) {
      return action
    }
    if (action.type === 'LOGIN') {
      return { type: 'SUBSYSTEM_INIT'}
    }
  }
)
```

In this example, the `subsystemReducer` will only receive actions that start with `SUBSYSTEM_`. It will also recieve a `SUBSYSTEM_INIT` action when the outer system receives a `LOGIN` action.

### Default state

The first time a reducer runs, it has no pre-existing state. On the other hand, allowing `oldProps.peers` to just be `undefined` would make writing reducers much more difficult. To solve this, `redux-keto` looks for a property called `defaultState` on each reducer function. If it finds one, it uses that as the initial state rather than `undefined`. This allows `oldProps.peers` to have a useful tree structure, even on the first run.

### Circular Dependencies

The `peers` property creates the illusion of time travel. It reflects the current action's outcome before all the reducers have even finished running.

It achieves this magic using memoized lazy evaluation. The `peers.maxCount` property in the orignal example is actually a getter that calls the `maxCount` reducer on-the-spot to find the next state (unless `maxCount` has already run).

This means that circular dependencies will not work. If a reducer tries to read its own output, even indirectly, it will fail with a `ReferenceError`.
