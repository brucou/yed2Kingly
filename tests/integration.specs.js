// This takes graph in .graphml strings format, converts it and
// check that the obtained Kingly graph works as it should

const { INIT_EVENT, INIT_STATE, NO_OUTPUT, createStateMachine } = require('kingly');
const assert = require('assert');
const graphs = require('./graphs.fixtures');
const { computeTransitionsAndStatesFromXmlString } = require('../index');
const { formatResult, cartesian } = require('../helpers');
// Use a simple merge to update extended state, that's enough for tests
// but then updates must be an object, not an array
const updateState = (extendedState, updates) => Object.assign({}, extendedState, updates);
const traceTransition = str => ({ outputs: str, updates: {}, });

describe('Conversion yed to kingly', function () {
  const { top_level_conditional_init, deep_hierarchy_conditional_automatic_init_event_eventless, deep_hierarchy_history_H_star, hierarchy_conditional_init, hierarchy_history_H, hierarchy_history_H_star, no_hierarchy_eventful_eventless_guards, no_hierarchy_events_eventless, top_level_conditional_init_with_hierarchy, } = graphs;
  const settings = {};
  const event1 = { event1: void 0 };
  const event2 = { event2: void 0 };
  const unknownEvent = { event3: void 0 };
  const eventSpace = [event1, event2, unknownEvent];

  describe('top_level_conditional_init', function () {
    const { getKinglyTransitions, stateYed2KinglyMap, states, events, errors } =
      computeTransitionsAndStatesFromXmlString(top_level_conditional_init);
    const guards = {
      "not(isNumber)": (s, e, stg) => (typeof s.n !== 'number'),
      "isNumber": (s, e, stg) => (typeof s.n === 'number'),
    };
    const actionFactories = {
      logOther: (s, e, stg) => ({ outputs: `logOther run on ${s.n}`, updates: {} }),
      logNumber: (s, e, stg) => ({ outputs: `logNumber run on ${s.n}`, updates: {} }),
    };
    const fsmDef1 = {
      updateState,
      initialExtendedState: { n: 0 },
      events,
      states,
      transitions: getKinglyTransitions({ actionFactories, guards })
    };
    const fsm1 = createStateMachine(fsmDef1, settings);
    const fsmDef2 = {
      updateState,
      initialExtendedState: { n: "" },
      events,
      states,
      transitions: getKinglyTransitions({ actionFactories, guards })
    };
    const fsm2 = createStateMachine(fsmDef2, settings);

    const outputs1 = [
      { [events[0] + "X"]: void 0 },
      { [events[0]]: void 0 },
      { [events[0]]: void 0 }
    ].map(fsm1);
    const expected1 = [NO_OUTPUT, ["logNumber run on 0"], NO_OUTPUT];
    const outputs2 = [{ [events[0] + "X"]: void 0 }, { [events[0]]: void 0 }, { [events[0]]: void 0 }].map(fsm2);
    const expected2 = [NO_OUTPUT, ["logOther run on "], NO_OUTPUT];
    it('runs the machine as per the graph', function () {
      assert.deepEqual(errors, [], `graphml string is correctly parsed`);
      assert.deepEqual(outputs1, expected1, `Branch machine initialized with number ok`);
      assert.deepEqual(outputs2, expected2, `Branch machine initialized with string ok`);
    });
  });

  describe('no-hierarchy-events-eventless', function () {
    const { getKinglyTransitions, stateYed2KinglyMap, states, events, errors } =
      computeTransitionsAndStatesFromXmlString(no_hierarchy_events_eventless);
    const guards = {
      "shouldReturnToA": (s, e, stg) => s.shouldReturnToA,
    };
    const actionFactories = {
      logAtoB: (s, e, stg) => traceTransition("A -> B"),
      logAtoC: (s, e, stg) => traceTransition("A -> C"),
      logBtoD: (s, e, stg) => traceTransition("B -> D"),
      logCtoD: (s, e, stg) => traceTransition("C -> D"),
      logDtoA: (s, e, stg) => traceTransition("D -> A"),
    };

    // Two machines to test the guard and achieve all-transition coverage
    const fsmDef1 = {
      updateState,
      initialExtendedState: { shouldReturnToA: false },
      events,
      states,
      transitions: getKinglyTransitions({ actionFactories, guards })
    };
    const inputSpace = cartesian([0, 1, 2], [0, 1, 2], [0, 1, 2]);
    const cases = inputSpace.map(scenario => {
      return [
        eventSpace[scenario[0]],
        eventSpace[scenario[1]],
        eventSpace[scenario[2]],
      ]
    })
    const outputs1 = cases.map(scenario => {
      const fsm1 = createStateMachine(fsmDef1, settings);
      return scenario.map(fsm1)
    });
    const expected1 = [
      // [event1, event1, event1]
      [["A -> B"], null, null],
      [["A -> B"], null, ["B -> D", null]],
      [["A -> B"], null, null],
      // [event1, event2, event1]
      [["A -> B"], ["B -> D", null], null],
      [["A -> B"], ["B -> D", null], null],
      [["A -> B"], ["B -> D", null], null],
      // [event1, event3, event1]
      [["A -> B"], null, null],
      [["A -> B"], null, ["B -> D", null]],
      [["A -> B"], null, null],
      // [event2, event1, event1]
      [["A -> C"], ["C -> D", null], null],
      [["A -> C"], ["C -> D", null], null],
      [["A -> C"], ["C -> D", null], null],
      // [event2, event2, event1]
      [["A -> C"], null, ["C -> D", null]],
      [["A -> C"], null, null],
      [["A -> C"], null, null],
      // [event2, event3, event1]
      [["A -> C"], null, ["C -> D", null]],
      [["A -> C"], null, null],
      [["A -> C"], null, null],
      // [event3, event1, event1]
      [null, ["A -> B"], null],
      [null, ["A -> B"], ["B -> D", null]],
      [null, ["A -> B"], null],
      // [event3, event2, event1]
      [null, ["A -> C"], ["C -> D", null]],
      [null, ["A -> C"], null],
      [null, ["A -> C"], null],
      // [event3, event3, event1]
      [null, null, ["A -> B"]],
      [null, null, ["A -> C"]],
      [null, null, null]
    ];

    const fsmDef2 = {
      updateState,
      initialExtendedState: { shouldReturnToA: true },
      events,
      states,
      transitions: getKinglyTransitions({ actionFactories, guards })
    };
    const fsm2 = createStateMachine(fsmDef2, settings);
    const outputs2 = cases.map(scenario => {
      const fsm2 = createStateMachine(fsmDef2, settings);
      return scenario.map(fsm2)
    });
    console.log(`event1 event2 event1`, outputs2[3])
    const expected2 = [
      // [event1, event1, event1]
      [["A -> B"], null, null],
      [["A -> B"], null, ["B -> D", "D -> A"]],
      [["A -> B"], null, null],
      // [event1, event2, event1]
      [["A -> B"], ["B -> D", "D -> A"], ["A -> B"]],
      [["A -> B"], ["B -> D", "D -> A"], ["A -> C"]],
      [["A -> B"], ["B -> D", "D -> A"], null],
      // [event1, event3, event1]
      [["A -> B"], null, null],
      [["A -> B"], null, ["B -> D", "D -> A"]],
      [["A -> B"], null, null],
      // [event2, event1, event1]
      [["A -> C"], ["C -> D", "D -> A"], ["A -> B"]],
      [["A -> C"], ["C -> D", "D -> A"], ["A -> C"]],
      [["A -> C"], ["C -> D", "D -> A"], null],
      // [event2, event2, event1]
      [["A -> C"], null, ["C -> D", "D -> A"]],
      [["A -> C"], null, null],
      [["A -> C"], null, null],
      // [event2, event3, event1]
      [["A -> C"], null, ["C -> D", "D -> A"]],
      [["A -> C"], null, null],
      [["A -> C"], null, null],
      // [event3, event1, event1]
      [null, ["A -> B"], null],
      [null, ["A -> B"], ["B -> D", "D -> A"]],
      [null, ["A -> B"], null],
      // [event3, event2, event1]
      [null, ["A -> C"], ["C -> D", "D -> A"]],
      [null, ["A -> C"], null],
      [null, ["A -> C"], null],
      // [event3, event3, event1]
      [null, null, ["A -> B"]],
      [null, null, ["A -> C"]],
      [null, null, null]
    ];

    it('runs the machine as per the graph', function () {
      assert.deepEqual(errors, [], `graphml string is correctly parsed`);
      assert.deepEqual(events, ["event1", "event2"], `The list of events is correctly parsed`);
      assert.deepEqual(states, {
        "n1ღA": "",
        "n2ღB": "",
        "n3ღC": "",
        "n4ღD": ""
      }, `The hierarchy of states is correctly parsed`);
      assert.deepEqual(outputs1, expected1, `Branch machine initialized with number ok`);
      assert.deepEqual(outputs2, expected2, `Branch machine initialized with string ok`);
    });
  });
});

// TODO: get a real example (can be complex, that's the point,
// but lot of problems with syntax - I must implement the functions, so names should not have space, could take
// one from Kingly test? I need a machine with H* !! take the chess example rewritten? yeah that could be useful
// for tutorial however reusing stupid machine from Kingly let test more conditions so do both

// TODO: think about start... if not using initial control state then I need a start event (use init_event??)
// TODO: rule to add: guards are OK in init transition but no eventless after...
// that is a bit complicated to memorize so maybe just forbid it entirely: no guards in initial transition
// NO, just impose an initial control state and rewrite the tests accordingly, anyways
// I am rewriting them here, That means no guards, no nothing on init in yed, and no actions on the initial ctransition
// path. Should check that too in kingly library...

