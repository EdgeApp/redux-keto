import { buildReducer, filterReducer, mapReducer } from '../src/index.js'
import { expect } from 'chai'
import { describe, it } from 'mocha'
import { createStore } from 'redux'

describe('buildReducer', function () {
  it('runs readme example', function () {
    function maxCount (state = 0, action) {
      return action.type === 'CHANGE_MAX_COUNT' ? action.payload : state
    }

    function counter (state = 0, action, props) {
      return Math.min(
        props.peers.maxCount,
        action.type === 'INCREMENT' ? state + action.payload : state
      )
    }

    const rootReducer = buildReducer({ maxCount, counter })
    const store = createStore(rootReducer)

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
  })

  it('provides an `oldProps` property', function () {
    const log = []
    function logger (state = 0, action, props, oldProps) {
      log.push(props.peers.dirtier === oldProps.peers.dirtier)
      return state
    }

    function dirtier (state = 0, action) {
      return action.type === 'DIRTY' ? state + 1 : state
    }

    const rootReducer = buildReducer({ logger, dirtier })
    const store = createStore(rootReducer)
    store.dispatch({ type: 'IRRELEVANT' })
    store.dispatch({ type: 'DIRTY' })
    store.dispatch({ type: 'IRRELEVANT' })
    expect(log).to.deep.equal([false, true, false, true])
  })

  it('throws on undefined state', function () {
    function tester (state) {
      return state
    }

    const rootReducer = buildReducer({ tester })
    expect(() => createStore(rootReducer)).to.throw(
      TypeError,
      "Reducer 'tester' returned undefined"
    )
  })

  it('throws on circular references', function () {
    function a (state, action, props) {
      return props.peers.b
    }

    function b (state, action, props) {
      return props.peers.a
    }

    const rootReducer = buildReducer({ a, b })
    expect(() => createStore(rootReducer)).to.throw(
      ReferenceError,
      /depends on its own result/
    )
  })

  it('copies parent props', function () {
    const log = []
    function logger (state = 0, action, props) {
      log.push(props.peers.settings)
      return state
    }

    function settings (state = 0, action) {
      return action.type === 'DIRTY' ? state + 1 : state
    }

    const rootReducer = buildReducer({
      app: buildReducer({ logger }),
      settings
    })
    const store = createStore(rootReducer)
    store.dispatch({ type: 'IRRELEVANT' })
    store.dispatch({ type: 'DIRTY' })
    store.dispatch({ type: 'IRRELEVANT' })
    expect(log).to.deep.equal([0, 0, 1, 1])
  })
})

describe('filterReducer', function () {
  it('basic functionality', function () {
    const log = []
    function logger (state = 0, action, props) {
      log.push(props.settings)
      return state
    }

    function settings (state = 0, action) {
      return action.type === 'DIRTY' ? state + 1 : state
    }

    const rootReducer = buildReducer({
      app: buildReducer({
        logger: filterReducer(
          logger,
          props => ({ settings: props.peers.settings }),
          action => action.type !== 'IGNORED'
        )
      }),
      settings
    })
    const store = createStore(rootReducer)
    store.dispatch({ type: 'IRRELEVANT' })
    store.dispatch({ type: 'IGNORED' })
    store.dispatch({ type: 'DIRTY' })
    store.dispatch({ type: 'IGNORED' })
    store.dispatch({ type: 'IRRELEVANT' })
    expect(log).to.deep.equal([0, 0, 1, 1])
  })
})

describe('mapReducer', function () {
  it('basic functionality', function () {
    let log = []
    function childReducer (state = 0, action, props) {
      log.push(props.id)
      return state
    }

    function list (state = [], action) {
      return action.type === 'INSERT' ? [...state, state.length] : state
    }

    const rootReducer = buildReducer({
      byId: mapReducer(
        childReducer,
        props => props.peers.list,
        (props, id) => ({ id }),
        (action, id) => action.id === id || action.type === 'ALL'
      ),
      list
    })
    const store = createStore(rootReducer)

    store.dispatch({ type: 'INSERT' })
    store.dispatch({ type: 'PING', id: 0 })
    store.dispatch({ type: 'PING', id: 1 })
    store.dispatch({ type: 'PING', id: 2 })
    expect(log).to.deep.equal([0, 0])
    log = []

    store.dispatch({ type: 'INSERT' })
    store.dispatch({ type: 'INSERT' })
    expect(log).to.deep.equal([1, 2])
    log = []

    store.dispatch({ type: 'PING', id: 0 })
    store.dispatch({ type: 'PING', id: 1 })
    store.dispatch({ type: 'PING', id: 2 })
    expect(log).to.deep.equal([0, 1, 2])
    log = []

    store.dispatch({ type: 'ALL' })
    expect(log).to.deep.equal([0, 1, 2])
  })

  it('merges duplicate keys', function () {
    const log = []
    function childReducer (state = 0, action, props) {
      log.push(props.id)
      return props.id
    }

    const rootReducer = mapReducer(
      childReducer,
      () => [0, 0, 1, 0, 2, 1],
      (props, id) => ({ id })
    )
    const store = createStore(rootReducer)
    expect(log).to.deep.equal([0, 1, 2])
    expect(store.getState()).to.deep.equal({ '0': 0, '1': 1, '2': 2 })
  })
})

describe('defaultState', function () {
  // A reducer with its own defaultState:
  const defaultState = new Date()
  function sibling (state) {
    expect(state).to.equal(defaultState)
    return state
  }
  sibling.defaultState = defaultState

  it('passes through filterReducer', function () {
    function innerReducer (state = defaultState, action, props, oldProps) {
      expect(oldProps).has.property('peers')
      expect(oldProps.peers).has.property('level1')
      expect(oldProps.peers.level1).has.property('level2')
      expect(oldProps.peers.level1).has.property('sibling', defaultState)

      expect(props.peers.level1.sibling).to.equal(defaultState)
      // Accessing props.peers.level1.level2 would be circular.

      return state
    }

    const rootReducer = buildReducer({
      level1: filterReducer(
        buildReducer({ level2: innerReducer, sibling }),
        props => props
      )
    })
    rootReducer(void 0, { type: 'INIT' })
  })

  it('passes through mapReducer', function () {
    function innerReducer (state = defaultState, action, props, oldProps) {
      expect(oldProps).has.property('peers')
      expect(oldProps.peers).has.property('level1')
      expect(oldProps.peers.level1).to.deep.equal({}) // No ids yet

      expect(props.peers.level1.id.sibling).to.equal(defaultState)
      // Accessing props.peers.level1.id.level2 would be circular.

      return state
    }

    const rootReducer = buildReducer({
      level1: mapReducer(
        buildReducer({ level2: innerReducer, sibling }),
        props => ['id'],
        props => props
      )
    })
    rootReducer(void 0, { type: 'INIT' })
  })
})
