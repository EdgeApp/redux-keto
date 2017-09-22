export type FatReducer<S, A, P> = (
  state: S | void,
  action: A,
  props: P,
  oldProps: P
) => S

export function buildReducer<A, P> (reducerMap: {
  [key: string]: FatReducer<any, A, P>
}): FatReducer<{ [key: string]: any }, A, P>

export function wrapReducer<S, A, P, Ai, Pi> (
  reducer: FatReducer<S, Ai, Pi>,
  filterProps?: (props: P) => Pi,
  filterAction?: (action: A) => Ai
): FatReducer<S, A, P>

export function mapReducer<S, A, P, Ai, Pi> (
  reducer: FatReducer<S, Ai, Pi>,
  listIds: (props: P) => Array<string>,
  filterProps?: (props: P, id: string) => Pi,
  filterAction?: (action: A, id: string) => Ai
): FatReducer<{ [key: string]: S }, A, P>
