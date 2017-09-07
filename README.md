# redux-keto

> A tool for building fat reducers

Redux works best when the reducers contain most of the business logic. Unfortunately, it's hard to make this work in practice. One problem is that reducers can't talk to each other. This library provides an easy way to let one reducer's results influence another.

This is useful in many situations, such as when an application's behavior depends on its settings. If the affected reducers can't access the settings state, they can't be adjust their behavior to match. This pushes the business logic into the components and middleware, which makes the system hard to understand. The `redux-keto` library encourages the opposite approach, pushing business logic back into the reducers where it belongs. Fatter reducers mean healthier systems (hence the [name](https://en.wikipedia.org/wiki/Low-carbohydrate_diet)).

The redux-keto library implements a single function, `buildReducer`, which works a lot like Redux's built-in `combineReducers` function. Besides the normal `state` and `action` parameters, this function passes a third parameter, `peers`, to each of its children. Reducers can use `peers` to pass values between each other in a fully-reactive, auto-updating way.

## Usage

Suppose an app has two pieces of state, a `counter` and a user-settable `maxCount`. The counter should never exceed `maxCount`, so it also needs update itself whenever `maxCount` changes.

Using `redux-keto`, the `maxCount` reducer can be perfectly normal:

```js
function maxCount (state = 0, action) {
  return action.type === 'CHANGE_MAX_COUNT' ? action.payload : state
}
```

The `counter` reducer is only a little more complicated, since it needs to access the `maxCount` state:

```js
function counter (state = 0, action, peers) {
  return Math.min(
    peers.maxCount,
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

To derive a value from some existing state, just create a reducer that ignores its `state` and `action` parameters:

```js
function countIsEven (state, action, peers) {
  return peers.counter % 2 === 0
}
```

Now `countIsEven` will stay in sync with the `counter` no matter what happens. Because this is just a normal reducer, it will also appear in `peers` so other reducers can access it.

To optimize cases where the peers haven't changed, reducers can check the `peers.unchanged` flag:

```js
function countIsOdd (state, action, peers) {
  if (peers.unchanged) return state

  return peers.counter % 2 !== 0
}
```

Now the `countIsOdd` calculation will only run when the counter actually changes. Reading the `unchanged` flag triggers extra book-keeping, so this optimization is not worthwhile if comparing the peers would be slower than the calculation being avoided.

### Accessing a Parent's Peers

When one `buildReducer` is nested inside another, it is sometimes useful to give the inner reducers access to the outer reducer's peers. To accomplish this, the `buildReducer` function accepts a function that maps its own peers into its children's peers:

```js
function filterPeers (peers) {
  return { settings: peers.settings }
}

const mainApp = buildReducer({ /* reducers... */ }, filterPeers)
const settings = buildReducer({ /* reducers... */ })
const rootReducer = buildReducer({ mainApp, settings })
```

In this example, the reducers inside `mainApp` not only have access to each other, but also to a `peers.settings` value copied in from the outside.

### Circular Dependencies

The `peers` parameter achieves its magic using memoized lazy evaluation. The `peers.maxCount` property in the orignal example is actually a getter function which invokes the `maxCount` reducer to calculate the new value on the spot.

This means that circular dependencies will not work. If a reducer depends on its own output, even indirectly, it will fail with a `ReferenceError`.
