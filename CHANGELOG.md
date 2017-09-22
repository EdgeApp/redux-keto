# redux-keto

## 0.2.0

Breaking changes:
* Removed the `unchanged` flag.
* The `peers` are now a property of the `props` object.
* `buildReducer` no longer takes a props filter.

New features:
* Fat reducers now receive their old props.
* Much better circular dependency handling - fewer cases cause errors.
* Added `filterReducer` & `mapReducer`.

Known issues:
If an action is filtered out by `filterReducer` or `mapReducer`, but the action causes a change to props, those prop changes will not pass through to the inner reducer. The action filter should diff the props and pass through a dummy action if they have changed.

## 0.1.0

* Initial experimental release
