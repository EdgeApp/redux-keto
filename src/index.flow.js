// @flow

const flowHack: any = undefined

export type FatReducer<State, Action, Next> = (
  state: State | void,
  action: Action,
  next: Next,
  prev: Next
) => State

export type BuiltReducer<State, Action, Next = State> = (
  state: $Shape<State> | void, // $Shape makes fields optional
  action: Action,
  next?: Next, // These are optional here.
  prev?: Next
) => State

export function buildReducer<O: Object, Action, Next>(
  shape: O
): BuiltReducer<
  $ObjMap<O, <State>(r: FatReducer<State, any, any>) => State>,
  Action,
  Next
> {
  return flowHack
}

declare type FilterReducer = {
  // Full version:
  <State, Action, Next, NewAction, NewNext>(
    reducer: FatReducer<State, NewAction, NewNext>,
    filterAction: (action: Action, next: Next) => NewAction,
    filterNext: (next: Next) => NewNext
  ): FatReducer<State, Action, Next>,

  // No `next` filtering:
  <State, Action, Next, NewAction>(
    reducer: FatReducer<State, NewAction, Next>,
    filterAction: (action: Action, next: Next) => NewAction
  ): FatReducer<State, Action, Next>
}

export const filterReducer: FilterReducer = flowHack

export function mapReducer<State, Action, Next>(
  reducer: FatReducer<
    State,
    Action,
    { +id: string, +root: Next, +self: State }
  >,
  listIds: (next: Next) => string[]
): FatReducer<{ [id: string]: State }, Action, Next> {
  return flowHack
}

type MemoizeReducer = {
  <State, Next, T1>(
    selector1: (next: Next) => T1,
    reducer: (a1: T1) => State
  ): FatReducer<State, any, Next>,

  <State, Next, T1, T2>(
    selector1: (next: Next) => T1,
    selector2: (next: Next) => T2,
    reducer: (a1: T1, a2: T2) => State
  ): FatReducer<State, any, Next>,

  <State, Next, T1, T2, T3>(
    selector1: (next: Next) => T1,
    selector2: (next: Next) => T2,
    selector3: (next: Next) => T3,
    reducer: (a1: T1, a2: T2, a3: T3) => State
  ): FatReducer<State, any, Next>,

  <State, Next, T1, T2, T3, T4>(
    selector1: (next: Next) => T1,
    selector2: (next: Next) => T2,
    selector3: (next: Next) => T3,
    selector4: (next: Next) => T4,
    reducer: (a1: T1, a2: T2, a3: T3, a4: T4) => State
  ): FatReducer<State, any, Next>,

  <State, Next, T1, T2, T3, T4, T5>(
    selector1: (next: Next) => T1,
    selector2: (next: Next) => T2,
    selector3: (next: Next) => T3,
    selector4: (next: Next) => T4,
    selector5: (next: Next) => T5,
    reducer: (a1: T1, a2: T2, a3: T3, a4: T4, a5: T5) => State
  ): FatReducer<State, any, Next>
}

export const memoizeReducer: MemoizeReducer = flowHack
