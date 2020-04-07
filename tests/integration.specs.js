// This takes graph in .graphml strings format, converts it and
// check that the Kingly graph obtained works as it should

const { INIT_EVENT, INIT_STATE, createStateMachine } = require('kingly');
const assert = require('assert');
const graphs = require('./graphs.fixtures');
const { computeTransitionsAndStatesFromXmlString } = require('../index');
const { formatResult} = require('../helpers');
// Use a simple merge to update extended state, that's enough for tests
// but then updates must be an object, not an array
const updateState = (extendedState, updates) => Object.assign({}, extendedState, updates);

describe('Conversion yed to kingly', function () {
  const { top_level_conditional_init } = graphs;
  const settings = {};

  describe('top_level_conditional_init', function () {
    const { getKinglyTransitions, stateYed2KinglyMap, states, events, errors } =
      computeTransitionsAndStatesFromXmlString(top_level_conditional_init );
    const guards = {
      "not(isNumber)": (s, e, stg) => (typeof s.n !== 'number'),
      "isNumber": (s, e, stg) => (typeof s.n === 'number'),
    };
    const actionFactories= {
      logOther: (s, e, stg) => ({outputs: `logOther run on ${s.n}`, updates: {}}),
      logNumber: (s, e, stg) => ({outputs: `logNumber run on ${s.n}`, updates: {}}),
    };
    const fsmDef1 = {
      updateState,
      initialExtendedState: {n: 0},
      events,
      states,
      transitions: getKinglyTransitions({actionFactories, guards})
    };
    const fsm1 = createStateMachine(fsmDef1, settings);
    const fsmDef2 = {
      updateState,
      initialExtendedState: {n: ""},
      events,
      states,
      transitions: getKinglyTransitions({actionFactories, guards})
    };
    const fsm2 = createStateMachine(fsmDef2, settings);

    // TODO: think about start... if not using initial control state then I need a start event (use init_event??)
    // TODO: rule to add: guards are OK in init transition but no eventless after...
    // that is a bit complicated to memorize so maybe just forbid it entirely: no guards in initial transition
    // NO, just impose an initial control state and rewrite the tests accordingly, anyways
    // I am rewriting them here, That means no guards, no nothing on init in yed, and no actions on the initial ctransition path. Should check that too in kingly library...

    const outputs1 = [
      {[events[0]+"X"]: void 0},
      {[events[0]]: void 0},
      {[events[0]]: void 0}
      ].map(fsm1);
    const expected1 = [null, ["logNumber run on 0"], null];
    const outputs2 = [{[events[0]+"X"]: void 0}, {[events[0]]: void 0}, {[events[0]]: void 0}].map(fsm2);
    const expected2 = [null, ["logOther run on "], null];
    it('runs the machine as per the graph', function () {
      assert.deepEqual(errors, [], `graphml string is correctly parsed`);
      assert.deepEqual(outputs1, expected1, `Branch machine initialized with number ok`);
      assert.deepEqual(outputs2, expected2, `Branch machine initialized with string ok`);
    });
  });
});
