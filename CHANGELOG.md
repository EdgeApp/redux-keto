# redux-keto

## 0.3.5 (2022-11-18)

- fixed: Give `state` the correct TypeScript type in `buildReducer`.

## 0.3.4 (2020-07-07)

- added: Include Typescript definitions with the library.

## 0.3.3 (2020-04-20)

- added: Include Flow type definitions with the library.

## 0.3.2

- Renamed `props` to `next`.
- Fat reducers no longer act as the top-level if `next` is `null`.
- Changed the default `mapReducer` behavior when no `makeNext` function is present.

While the `mapReducer` change is technically breaking, the previous behavior was never documented, including the fact that `makeNext` was optional in the first place. So, at least no documented behavior has changed.

## 0.3.1

Bug fixes:

- Fixed a case where `memoizeReducer` could return undefined.

## 0.3.0

Breaking changes:

- The default `buildReducer` behavior is to use its own state as the props now, rather than wrapping it in a `props.peers` property.
- The `mapReducer` props function now takes a `peers` parameter.
- `mapReducer` no longer takes an action filter.
- The `filterAction` and `filterProps` parameters to `filterReducer` have swapped locations.
- Removed the type definitions. If somebody can set up tooling so we can test these, I'll gladly add them back.

New features:

- The `buildReducer` function now accepts a `makeProps` parameter.
- A `memoizeReducer` function to simplify deriving values.
- Much better control over the `props` construction process.

Known issues:

- The `filterReducer` function still doesn't diff the props and send dummy actions through when they change.

## 0.2.1

- Reducers can now have a `defaultState` property, which provides the initial state. This allows `oldProps.peers` to always have a meaningful structure.
- Reducers now receive a proper initial state, which is either `undefined` or the reducer's `defaultState` property. Before, many reducers would receive `{}` as an inital state, which was a bug.

## 0.2.0

Breaking changes:

- Removed the `unchanged` flag.
- The `peers` are now a property of the `props` object.
- `buildReducer` no longer takes a props filter.

New features:

- Fat reducers now receive their old props.
- Much better circular dependency handling - fewer cases cause errors.
- Added `filterReducer` & `mapReducer`.

Known issues:
If an action is filtered out by `filterReducer` or `mapReducer`, but the action causes a change to props, those prop changes will not pass through to the inner reducer. The action filter should diff the props and pass through a dummy action if they have changed.

## 0.1.0

- Initial experimental release
