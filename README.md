# redux-keto

> A tool for building fat reducers

[![npm downloads](https://img.shields.io/npm/dm/redux-keto.svg?style=flat-square)](https://www.npmjs.com/package/redux-keto)

The Redux architecture works best when the reducers contain as much business logic as possible. Doing this in practice is hard, though, since reducers can't pass values between each other.

This library provides a way to build "fat reducers", which take an extra `next` argument in addition to the normal `state` and `action` arguments. Fat reducers use this extra parameter to pass values between each other in a fully-reactive, auto-updating way.

Fat reducers work seamlessly with normal reducers, so there are no big changes to the way Redux works. Just use fat reducers wherever they make sense.

## Table of contents
1. [Example](#example)
2. [Derived state](#derived-state)
3. [Customizing `next`](#customizing-next)
   1. [Reducer lists](#reducer-lists)
   1. [Isolated reducers](#isolated-reducers)
4. [Implementation details](#implementation-details)

## Example

Suppose an app has two pieces of state, a `counter` and a user-settable `maxCount`. The counter should never exceed `maxCount`, so it also needs update itself whenever `maxCount` changes.

Using `redux-keto`, the `maxCount` reducer can be perfectly normal:

```js
function maxCount (state = 0, action) {
  return action.type === 'CHANGE_MAX_COUNT' ? action.payload : state
}
```

The `counter` reducer is only a little more complicated, since it needs to consider the `maxCount` state:

```js
function counter (state = 0, action, next) {
  return Math.min(
    next.maxCount,
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

Everything is fully reactive, since the `next` parameter reflects the upcoming state of each reducer. In other words, `next.maxCount` contains the result of running the `maxCount` reducer on the current action. This means that dispatching a `CHANGE_MAX_COUNT` action will automatically update the counter without any extra work. The `counter` reducer always keeps itself up to date by checking the new `maxCount` state on each action.

## Derived state

To derive a value from some existing state, just create a fat reducer that ignores its `state` and `action` parameters:

```js
function countIsEven (state, action, next) {
  return next.counter % 2 === 0
}
```

Now `countIsEven` will stay in sync with the `counter` no matter what happens. Because this is just a normal reducer, it will also appear in `next` so other reducers can access it.

To optimize cases where the state hasn't changed, fat reducers also receive a `prev` parameter, which holds the state *before* the current action. The reducer can compare the two states to see if it needs to do any work:

```js
function countIsOdd (state, action, next, prev) {
  if (next.counter === prev.counter) return state

  return next.counter % 2 === 1
}
```

Now the `countIsOdd` calculation will only run when the counter actually changes.

To automate this, `redux-keto` provides a `memoizeReducer` function. This function works a lot like the [reselect](https://github.com/reactjs/reselect) library, but for reducers:

```js
const isOdd = memoizeReducer(
  next => next.counter,
  counter => counter % 2 === 1
)
```

The last parameter to `memoizeReducer` is the actual calculation. All the previous parameters are functions that grab items out of the next state. If all the items are the equal (`===`) to their previous values, `memoizeReducer` just returns the previous state. Otherwise, `memoizeReducer` runs the calculation with the items as parameters.

## Customizing `next`

By default, `buildReducer` passes `next` through to its children unchanged. If `buildReducer` doesn't receive a `next` parameter, it initializes `next` with its own children. This is why the initial example works—the top-level `buildReducer` doesn't receive a `next` parameter, so it sets up a `next` object with the future `maxCount` and `counter` states as properties. This also means that if `buildReducer` happens to be the top-most reducer in the Redux store, `next` will match the Redux state tree returned by `getState()`.

To customize this behavior, just pass a `makeNext` function as the second parameter to `buildReducer`:

```js
counterState = buildReducer(
  buildReducer({ maxCount, counter }),
  (next, children, id) => children
}
```

The `makeNext` function accepts three parameters, `next`, `children`, and `id`. The `next` parameter is just whatever was passed to `buildReducer`, the `children` parameter holds the future `buildReducer` state, and `id` is the current reducer's name.

In this example, `makeNext` just returns the `children` unconditionally. This means that the `counter` reducer can always refer to `next.maxCount`, no matter where it is located in the Redux state tree.

### Reducer lists

Applications often manage lists of things. For example, a chat platform might manage multiple conversations, each with its own state. To handle cases like this, `redux-keto` provides a `mapReducer` function:

```js
import { mapReducer } from 'redux-keto'

const chatsById = mapReducer(
  chatReducer,

  // The list of ids:
  next => next.activeChatIds,

  // Set up `next` for each child:
  (next, children, id) => ({
    chatId: id,
    root: next,
    get self () {
      return children[id]
    }
  })
)
```

The first `mapReducer` parameter is the reducer to replicate, and the second parameter returns a list of ids. There will be one `chatReducer` for each unique id (duplicates are ignored).

The final parameter is a `makeNext` function, just like the one `buildReducer` accepts. If this isn't provided, `mapReducer` will create a default `next` parameter with the following properties:

* `id` - the current child's id.
* `root` - the `next` parameter passed to `mapReducer`, or `children` if `next` is undefined.
* `self` - the current child's future state.

If you want to replicate this behavior yourself, be sure to implement `self` using a getter function, as shown above. Otherwise, you may get a [circular reference error](#circular-dependencies).

### Isolated reducers

To customize both the actions and `next` parameter going into an individual reducer, use `filterReducer`. This is especially useful with `mapReducer`, since it allows each child reducer to act like its own stand-alone sub-store:

```js
const chatReducer = filterReducer(
  chatSubsystem,

  // Filter the actions (receives the outer `next` parameter):
  (action, next) => {
    if (action.payload.chatId === next.chatId) {
      return action
    }
    if (action.type === 'LOGIN') {
      return { type: 'CHAT_INIT'}
    }
  },

  // Adjust `next` for the child:
  next => ({ settings: next.root.chatSettings })
)
```

In this example, the `chatReducer` will only receive actions where the `chatId` matches its own `chatId`. It will also receive a `CHAT_INIT` message when the outer system receives a `LOGIN` action.

## Implementation details

### Circular dependencies

The `buildReducer` and `mapReducer` functions create the illusion of time travel by passing their own future state into their children. They achieve this magic using memoized lazy evaluation. Each property of the `next` object is actually a getter that calls the corresponding child reducer to calculate the new state on the spot (unless the reducer has already run).

This means that circular dependencies will not work. If a reducer tries to read its own output, even indirectly, it will fail with a `ReferenceError`.

### Default state

The first time a reducer runs, it has no previous state. On the other hand, allowing `prev` to just be `undefined` would make writing reducers much more difficult. To solve this, `redux-keto` looks for a property called `defaultState` on each reducer function. If it finds one, it uses that as the initial state and builds the `prev` parameter based on that. This allows `prev` to have a useful tree structure, even on the first run.
