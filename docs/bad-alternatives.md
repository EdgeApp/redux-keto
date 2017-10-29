# Bad alternatives

Without a library like `redux-keto`, implementing the example in the readme is a lot more tricky. Here are the unit tests we need to satisfy:

```js
store.dispatch({ type: 'CHANGE_MAX_COUNT', payload: 20 })
expect(store.getState().maxCount).to.equal(20)

store.dispatch({ type: 'INCREMENT', payload: 10 })
expect(store.getState().counter).to.equal(10)

// Changing the maximum should also change the count:
store.dispatch({ type: 'CHANGE_MAX_COUNT', payload: 5 })
expect(store.getState().maxCount).to.equal(5)
expect(store.getState().counter).to.equal(5)

// We cannot increment past the max:
store.dispatch({ type: 'INCREMENT', payload: 10 })
expect(store.getState().counter).to.equal(5)
```

## Combined Reducers

The first option is to combine both the `count` and `maxCount` reducers into one big reducer:

```js
function rootReducer (state = { count: 0, maxCount: 0 }, action) {
  switch (action.type) {
    case 'INCREMENT':
      return {
        count: Math.min(state.count + action.payload, state.maxCount),
        maxCount: state.maxCount
      }
    case 'CHANGE_MAX_COUNT':
      return {
        count: Math.min(state.count, action.payload),
        maxCount: action.payload
      }
  }
  return state
}
```

This works correctly, but it requires mixing together different concerns.

Imagine a racing simulator where the maximum speed depends on dozens of other parameters, such as engine power, driver weight, slope, wind, tire grip, and so forth. Pretty soon half the app ends up as a single giant reducer, which isn't maintainable. With `redux-keto`, all these values can be separate reducers with values flowing between them naturally.

## `redux-thunk` Solutions

One option is to put `maxCount` into the action payload using `redux-thunk`:

```js
// Action creator required!
function increment (amount) {
  return (dispatch, getState) =>
    dispatch({
      type: 'INCREMENT',
      payload: {
        maxCount: getState().maxCount,
        amount
      }
    })
}

const maxCount = (state = 0, action) =>
  (action.type === 'CHANGE_MAX_COUNT' ? action.payload : state)

const counter = (state = 0, action) => {
  switch (action.type) {
    case 'INCREMENT':
      return Math.min(state + action.payload.amount, action.payload.maxCount)
    case 'CHANGE_MAX_COUNT':
      return Math.min(state, action.payload)
  }
  return state
}

const rootReducer = combineReducers({ maxCount, counter })
```

This allows `maxCount` to have its own simple reducer, but comes at a terrible price. The `INCREMENT` action now depends on the state of the store, which requires a special action creator.

On top of this, the `counter` reducer still needs to be aware of the `CHANGE_MAX_COUNT` action, so the two concerns aren't even that well separated.

Using a separate action creator for `CHANGE_MAX_COUNT` can simplify the `counter` reducer a bit:

```js
function changeMaxCount (maxCount) {
  return (dispatch, getState) => {
    dispatch({ type: 'CHANGE_MAX_COUNT', payload: maxCount })
    dispatch(increment(0))
  }
}

function increment (amount) {
  return (dispatch, getState) =>
    dispatch({
      type: 'INCREMENT',
      payload: {
        maxCount: getState().maxCount,
        amount
      }
    })
}

const maxCount = (state = 0, action) =>
  (action.type === 'CHANGE_MAX_COUNT' ? action.payload : state)

const counter = (state = 0, action) =>
  Math.min(
    action.type === 'INCREMENT'
      ? Math.min(state + action.payload.amount, action.payload.maxCount)
      : state
  )

const rootReducer = combineReducers({ maxCount, counter })
```

Once again, this solution comes at a terrible price. The reducers are simple, but now the action creators are completely tangled. Plus, the `changeMaxCount` thunk is using multiple dispatches, which is a known Redux anti-pattern.

Unfortunately, this sort of state many apps end up in. All the business logic gets tangled up inside the thunks / sagas / selectors / components while the reducers become dumb and useless.

This is why `redux-keto` exists.
