export interface Action {
  type: any
  [extraProps: string]: any
}

export interface Peers {
  unchanged: boolean
  [peers: string]: any
}

export type Reducer<S> = (
  state: S | undefined,
  action: Action,
  peers?: Peers
) => S

/**
 * Combines several reducers into one.
 */
export function buildReducer<S> (
  reducerMap: { [key: string]: Reducer<any> },
  filterPeers?: (peers: Peers) => {}
): Reducer<S>
