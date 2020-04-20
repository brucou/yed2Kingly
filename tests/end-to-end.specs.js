// End to end means that a graphml file is converted into a javascript file
// from which a Kingly machine is constructed and tested
// The strategy is to run the same tests that in integration.specs

const assert = require('assert');
const {fsmContracts, createStateMachine, NO_OUTPUT} = require('kingly');
const {fakeConsole, cartesian} = require('../helpers');
const {execSync} = require('child_process');
const TEST_DIR = 'C:\\Users\\toshiba\\WebstormProjects\\yed2kingly\\tests\\'
const settings = {console: fakeConsole, checkContracts: fsmContracts};
const event1 = { event1: void 0 };
const event2 = { event2: void 0 };
const event3 = { event3: void 0 };
const unknownEvent = { event3: void 0 };
const updateState = (extendedState, updates) => Object.assign({}, extendedState, updates);
const traceTransition = str => ({ outputs: [str], updates: {} });

describe('End-to-end graphml to kingly', function () {
  describe('top_level_conditional_init', function () {
    // run the script on the test file
    const graphMlFile = './graphs/top-level-conditional-init.graphml';
    try {
      execSync(`node ../index ${graphMlFile}`, [],{cwd: TEST_DIR});
    }
    catch(err){
      assert.ok(true, false, `Failed to execute the conversion on file ${graphMlFile}`)
    }

    // require the js file
    const {events, states, getKinglyTransitions} = require(`${graphMlFile}.fsm.cjs`);

    // Build the machine
    const guards = {
      // we test on extended state, so we test also the guard parameters
      // are as expected
      'not(isNumber)': (s, e, stg) => typeof s.n !== 'number',
      isNumber: (s, e, stg) => typeof s.n === 'number',
    };
    const actionFactories = {
      logOther: (s, e, stg) => ({ outputs: `logOther run on ${s.n}`, updates: {} }),
      logNumber: (s, e, stg) => ({ outputs: `logNumber run on ${s.n}`, updates: {} }),
    };
    const fsm1 = createStateMachine({
      initialExtendedState: { n: 0 },
      events,
      states,
      transitions: getKinglyTransitions({actionFactories, guards}),
      updateState
    }, settings);
    const fsm2 = createStateMachine({
      initialExtendedState: { n: "" },
      events,
      states,
      transitions: getKinglyTransitions({actionFactories, guards}),
      updateState
    }, settings);

    // Run the tests
    const outputs1 = [{ [events[0] + 'X']: void 0 }, { [events[0]]: void 0 }, { [events[0]]: void 0 }].map(fsm1);
    const expected1 = [NO_OUTPUT, ['logNumber run on 0'], NO_OUTPUT];
    const outputs2 = [{ [events[0] + 'X']: void 0 }, { [events[0]]: void 0 }, { [events[0]]: void 0 }].map(fsm2);
    const expected2 = [NO_OUTPUT, ['logOther run on '], NO_OUTPUT];
    it('runs the machine as per the graph', function() {
      assert.deepEqual(outputs1, expected1, `Branch machine initialized with number ok`);
      assert.deepEqual(outputs2, expected2, `Branch machine initialized with string ok`);
    });
  });

  describe('no-hierarchy-events-eventless', function() {
    // run the script on the test file
    const graphMlFile = './graphs/no-hierarchy-events-eventless.graphml';
    try {
      execSync(`node ../index ${graphMlFile}`, [],{cwd: TEST_DIR});
    }
    catch(err){
      assert.ok(true, false, `Failed to execute the conversion on file ${graphMlFile}`)
    }

    // require the js file
    const {events, states, getKinglyTransitions} = require(`${graphMlFile}.fsm.cjs`);

    // Build the machine
    const guards = {
      shouldReturnToA: (s, e, stg) => s.shouldReturnToA,
    };
    const actionFactories = {
      logAtoB: (s, e, stg) => traceTransition('A -> B'),
      logAtoC: (s, e, stg) => traceTransition('A -> C'),
      logBtoD: (s, e, stg) => traceTransition('B -> D'),
      logCtoD: (s, e, stg) => traceTransition('C -> D'),
      logDtoA: (s, e, stg) => traceTransition('D -> A'),
    };
    const eventSpace = [event1, event2, unknownEvent];

    const fsmDef1 = {
      updateState,
      initialExtendedState: { shouldReturnToA: false },
      events,
      states,
      transitions: getKinglyTransitions({ actionFactories, guards }),
    };
    const inputSpace = cartesian([0, 1, 2], [0, 1, 2], [0, 1, 2]);
    const cases = inputSpace.map(scenario => {
      return [eventSpace[scenario[0]], eventSpace[scenario[1]], eventSpace[scenario[2]]];
    });
    const outputs1 = cases.map(scenario => {
      const fsm1 = createStateMachine(fsmDef1, settings);
      return scenario.map(fsm1);
    });
    const expected1 = [
      // [event1, event1, event1]
      [['A -> B'], null, null],
      [['A -> B'], null, ['B -> D', null]],
      [['A -> B'], null, null],
      // [event1, event2, event1]
      [['A -> B'], ['B -> D', null], null],
      [['A -> B'], ['B -> D', null], null],
      [['A -> B'], ['B -> D', null], null],
      // [event1, event3, event1]
      [['A -> B'], null, null],
      [['A -> B'], null, ['B -> D', null]],
      [['A -> B'], null, null],
      // [event2, event1, event1]
      [['A -> C'], ['C -> D', null], null],
      [['A -> C'], ['C -> D', null], null],
      [['A -> C'], ['C -> D', null], null],
      // [event2, event2, event1]
      [['A -> C'], null, ['C -> D', null]],
      [['A -> C'], null, null],
      [['A -> C'], null, null],
      // [event2, event3, event1]
      [['A -> C'], null, ['C -> D', null]],
      [['A -> C'], null, null],
      [['A -> C'], null, null],
      // [event3, event1, event1]
      [null, ['A -> B'], null],
      [null, ['A -> B'], ['B -> D', null]],
      [null, ['A -> B'], null],
      // [event3, event2, event1]
      [null, ['A -> C'], ['C -> D', null]],
      [null, ['A -> C'], null],
      [null, ['A -> C'], null],
      // [event3, event3, event1]
      [null, null, ['A -> B']],
      [null, null, ['A -> C']],
      [null, null, null],
    ];

    const fsmDef2 = {
      updateState,
      initialExtendedState: { shouldReturnToA: true },
      events,
      states,
      transitions: getKinglyTransitions({ actionFactories, guards }),
    };
    const outputs2 = cases.map(scenario => {
      const fsm2 = createStateMachine(fsmDef2, settings);
      return scenario.map(fsm2);
    });
    const expected2 = [
      // [event1, event1, event1]
      [['A -> B'], null, null],
      [['A -> B'], null, ['B -> D', 'D -> A']],
      [['A -> B'], null, null],
      // [event1, event2, event1]
      [['A -> B'], ['B -> D', 'D -> A'], ['A -> B']],
      [['A -> B'], ['B -> D', 'D -> A'], ['A -> C']],
      [['A -> B'], ['B -> D', 'D -> A'], null],
      // [event1, event3, event1]
      [['A -> B'], null, null],
      [['A -> B'], null, ['B -> D', 'D -> A']],
      [['A -> B'], null, null],
      // [event2, event1, event1]
      [['A -> C'], ['C -> D', 'D -> A'], ['A -> B']],
      [['A -> C'], ['C -> D', 'D -> A'], ['A -> C']],
      [['A -> C'], ['C -> D', 'D -> A'], null],
      // [event2, event2, event1]
      [['A -> C'], null, ['C -> D', 'D -> A']],
      [['A -> C'], null, null],
      [['A -> C'], null, null],
      // [event2, event3, event1]
      [['A -> C'], null, ['C -> D', 'D -> A']],
      [['A -> C'], null, null],
      [['A -> C'], null, null],
      // [event3, event1, event1]
      [null, ['A -> B'], null],
      [null, ['A -> B'], ['B -> D', 'D -> A']],
      [null, ['A -> B'], null],
      // [event3, event2, event1]
      [null, ['A -> C'], ['C -> D', 'D -> A']],
      [null, ['A -> C'], null],
      [null, ['A -> C'], null],
      // [event3, event3, event1]
      [null, null, ['A -> B']],
      [null, null, ['A -> C']],
      [null, null, null],
    ];

    it('runs the machine as per the graph', function() {
      assert.deepEqual(events, ['event1', 'event2'], `The list of events is correctly parsed`);
      assert.deepEqual(
        states,
        {
          n1ღA: '',
          n2ღB: '',
          n3ღC: '',
          n4ღD: '',
        },
        `The hierarchy of states is correctly parsed`
      );
      assert.deepEqual(outputs1, expected1, `Branch machine initialized with number ok`);
      assert.deepEqual(outputs2, expected2, `Branch machine initialized with string ok`);
    });
  });

  describe('no_hierarchy_eventful_eventless_guards', function() {
    // tests with:
    // - condition1 fulfilled
    // - condition2 fulfilled
    // - condition3 fulfilled
    // - both cond1 and cond2 fulfilled
    // - both cond2 and cond3 fulfilled
    // - none fulfilled
    // [condx, condy]
    // use power of 2 (bit position)
    // Achtung!!!! For the tests, the order of guards in the guards array matters!!!
    // I made it the transitions in same order as the condition so easier to reason about
    // run the script on the test file
    const graphMlFile = './graphs/no-hierarchy-eventful-eventless-guards.graphml';
    try {
      execSync(`node ../index ${graphMlFile}`, [],{cwd: TEST_DIR});
    }
    catch(err){
      assert.ok(true, false, `Failed to execute the conversion on file ${graphMlFile}`)
    }

    // require the js file
    const {events, states, getKinglyTransitions} = require(`${graphMlFile}.fsm.cjs`);

    // Build the machine
    const eventSpace = [{ event: 1 }, { event: 2 }, { event: 4 }, { event: 3 }, { event: 6 }, { event: 0 }];
    const guards = {
      shouldReturnToA: (s, e, stg) => s.shouldReturnToA,
      // This time we test on event data, so we test also the guard parameters
      // are as expected
      condition1: (s, e, stg) => e & 1,
      condition2: (s, e, stg) => e & 2,
      condition3: (s, e, stg) => e & 4,
    };
    const actionFactories = {
      logAtoTemp1: (s, e, stg) => traceTransition('A -> Temp1'),
      logTemp1toA: (s, e, stg) => traceTransition('Temp1 -> A'),
      logAtoTemp2: (s, e, stg) => traceTransition('A -> Temp2'),
      logTemp2toA: (s, e, stg) => traceTransition('Temp2 -> A'),
      logAtoDone: (s, e, stg) => traceTransition('A -> Done'),
    };

    // Two machines to test the guard and achieve all-transition coverage
    const fsmDef1 = {
      updateState,
      initialExtendedState: { shouldReturnToA: false },
      events,
      states,
      transitions: getKinglyTransitions({ actionFactories, guards }),
    };
    const inputSpace = cartesian([0, 1, 2, 3, 4, 5], [0, 1, 2, 3, 4, 5]);
    const cases = inputSpace.map(scenario => {
      return [eventSpace[scenario[0]], eventSpace[scenario[1]]];
    });
    const outputs1 = cases.map(scenario => {
      const fsm1 = createStateMachine(fsmDef1, settings);
      return scenario.map(fsm1);
    });
    const expected1 = [
      // [cond1, cond1]
      [['A -> Temp1', 'Temp1 -> A'], ['A -> Temp1', 'Temp1 -> A']],
      // [cond1, cond2]
      [['A -> Temp1', 'Temp1 -> A'], ['A -> Temp2', 'Temp2 -> A']],
      // [cond1, cond3]
      [['A -> Temp1', 'Temp1 -> A'], ['A -> Done', null]],
      // [cond1, cond12]
      [['A -> Temp1', 'Temp1 -> A'], ['A -> Temp1', 'Temp1 -> A']],
      // [cond1, cond23]
      [['A -> Temp1', 'Temp1 -> A'], ['A -> Temp2', 'Temp2 -> A']],
      // [!cond]
      [['A -> Temp1', 'Temp1 -> A'], null],
      // [cond2, x]
      [['A -> Temp2', 'Temp2 -> A'], ['A -> Temp1', 'Temp1 -> A']],
      [['A -> Temp2', 'Temp2 -> A'], ['A -> Temp2', 'Temp2 -> A']],
      [['A -> Temp2', 'Temp2 -> A'], ['A -> Done', null]],
      [['A -> Temp2', 'Temp2 -> A'], ['A -> Temp1', 'Temp1 -> A']],
      [['A -> Temp2', 'Temp2 -> A'], ['A -> Temp2', 'Temp2 -> A']],
      [['A -> Temp2', 'Temp2 -> A'], null],
      // [cond3, x]
      [['A -> Done', null], null],
      [['A -> Done', null], null],
      [['A -> Done', null], null],
      [['A -> Done', null], null],
      [['A -> Done', null], null],
      [['A -> Done', null], null],
      // [cond12, x]
      [['A -> Temp1', 'Temp1 -> A'], ['A -> Temp1', 'Temp1 -> A']],
      [['A -> Temp1', 'Temp1 -> A'], ['A -> Temp2', 'Temp2 -> A']],
      [['A -> Temp1', 'Temp1 -> A'], ['A -> Done', null]],
      [['A -> Temp1', 'Temp1 -> A'], ['A -> Temp1', 'Temp1 -> A']],
      [['A -> Temp1', 'Temp1 -> A'], ['A -> Temp2', 'Temp2 -> A']],
      [['A -> Temp1', 'Temp1 -> A'], null],
      // [cond23, x]
      [['A -> Temp2', 'Temp2 -> A'], ['A -> Temp1', 'Temp1 -> A']],
      [['A -> Temp2', 'Temp2 -> A'], ['A -> Temp2', 'Temp2 -> A']],
      [['A -> Temp2', 'Temp2 -> A'], ['A -> Done', null]],
      [['A -> Temp2', 'Temp2 -> A'], ['A -> Temp1', 'Temp1 -> A']],
      [['A -> Temp2', 'Temp2 -> A'], ['A -> Temp2', 'Temp2 -> A']],
      [['A -> Temp2', 'Temp2 -> A'], null],
      // [!cond, x]
      [null, ['A -> Temp1', 'Temp1 -> A']],
      [null, ['A -> Temp2', 'Temp2 -> A']],
      [null, ['A -> Done', null]],
      [null, ['A -> Temp1', 'Temp1 -> A']],
      [null, ['A -> Temp2', 'Temp2 -> A']],
      [null, null],
    ];

    const fsmDef2 = {
      updateState,
      initialExtendedState: { shouldReturnToA: true },
      events,
      states,
      transitions: getKinglyTransitions({ actionFactories, guards }),
    };
    const outputs2 = cases.map(scenario => {
      const fsm2 = createStateMachine(fsmDef2, settings);
      return scenario.map(fsm2);
    });
    const expected2 = [
      // [cond1, cond1]
      [['A -> Temp1', 'Temp1 -> A'], ['A -> Temp1', 'Temp1 -> A']],
      // [cond1, cond2]
      [['A -> Temp1', 'Temp1 -> A'], ['A -> Temp2', 'Temp2 -> A']],
      // [cond1, cond3]
      [['A -> Temp1', 'Temp1 -> A'], ['A -> Done', null]],
      // [cond1, cond12]
      [['A -> Temp1', 'Temp1 -> A'], ['A -> Temp1', 'Temp1 -> A']],
      // [cond1, cond23]
      [['A -> Temp1', 'Temp1 -> A'], ['A -> Temp2', 'Temp2 -> A']],
      // [!cond]
      [['A -> Temp1', 'Temp1 -> A'], null],
      // [cond2, x]
      [['A -> Temp2', 'Temp2 -> A'], ['A -> Temp1', 'Temp1 -> A']],
      [['A -> Temp2', 'Temp2 -> A'], ['A -> Temp2', 'Temp2 -> A']],
      [['A -> Temp2', 'Temp2 -> A'], ['A -> Done', null]],
      [['A -> Temp2', 'Temp2 -> A'], ['A -> Temp1', 'Temp1 -> A']],
      [['A -> Temp2', 'Temp2 -> A'], ['A -> Temp2', 'Temp2 -> A']],
      [['A -> Temp2', 'Temp2 -> A'], null],
      // [cond3, x]
      [['A -> Done', null], ['A -> Temp1', 'Temp1 -> A']],
      [['A -> Done', null], ['A -> Temp2', 'Temp2 -> A']],
      [['A -> Done', null], ['A -> Done', null]],
      [['A -> Done', null], ['A -> Temp1', 'Temp1 -> A']],
      [['A -> Done', null], ['A -> Temp2', 'Temp2 -> A']],
      [['A -> Done', null], null],
      // [cond12, x]
      [['A -> Temp1', 'Temp1 -> A'], ['A -> Temp1', 'Temp1 -> A']],
      [['A -> Temp1', 'Temp1 -> A'], ['A -> Temp2', 'Temp2 -> A']],
      [['A -> Temp1', 'Temp1 -> A'], ['A -> Done', null]],
      [['A -> Temp1', 'Temp1 -> A'], ['A -> Temp1', 'Temp1 -> A']],
      [['A -> Temp1', 'Temp1 -> A'], ['A -> Temp2', 'Temp2 -> A']],
      [['A -> Temp1', 'Temp1 -> A'], null],
      // [cond23, x]
      [['A -> Temp2', 'Temp2 -> A'], ['A -> Temp1', 'Temp1 -> A']],
      [['A -> Temp2', 'Temp2 -> A'], ['A -> Temp2', 'Temp2 -> A']],
      [['A -> Temp2', 'Temp2 -> A'], ['A -> Done', null]],
      [['A -> Temp2', 'Temp2 -> A'], ['A -> Temp1', 'Temp1 -> A']],
      [['A -> Temp2', 'Temp2 -> A'], ['A -> Temp2', 'Temp2 -> A']],
      [['A -> Temp2', 'Temp2 -> A'], null],
      // [!cond, x]
      [null, ['A -> Temp1', 'Temp1 -> A']],
      [null, ['A -> Temp2', 'Temp2 -> A']],
      [null, ['A -> Done', null]],
      [null, ['A -> Temp1', 'Temp1 -> A']],
      [null, ['A -> Temp2', 'Temp2 -> A']],
      [null, null],
    ];

    it('runs the machine as per the graph', function() {
      assert.deepEqual(events, ['event'], `The list of events is correctly parsed`);
      assert.deepEqual(
        states,
        {
          n1ღA: '',
          n2ღTemp1: '',
          n3ღTemp2: '',
          n4ღDone: '',
        },
        `The hierarchy of states is correctly parsed`
      );
      assert.deepEqual(outputs1, expected1, `Branch machine initialized with number ok`);
      assert.deepEqual(outputs2, expected2, `Branch machine initialized with string ok`);
    });
  });

  describe('top_level_conditional_init_with_hierarchy', function() {
    // should be exact same tests than top_level_conditional_init
    // run the script on the test file
    const graphMlFile = './graphs/top-level-conditional-init-with-hierarchy.graphml';
    try {
      execSync(`node ../index ${graphMlFile}`, [],{cwd: TEST_DIR});
    }
    catch(err){
      assert.ok(true, false, `Failed to execute the conversion on file ${graphMlFile}`)
    }

    // require the js file
    const {events, states, getKinglyTransitions} = require(`${graphMlFile}.fsm.cjs`);

    // Build the machine
    const guards = {
      // we test on extended state, so we test also the guard parameters
      // are as expected
      'not(isNumber)': (s, e, stg) => typeof s.n !== 'number',
      isNumber: (s, e, stg) => typeof s.n === 'number',
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
      transitions: getKinglyTransitions({ actionFactories, guards }),
    };
    const fsm1 = createStateMachine(fsmDef1, settings);
    const fsmDef2 = {
      updateState,
      initialExtendedState: { n: '' },
      events,
      states,
      transitions: getKinglyTransitions({ actionFactories, guards })
    };
    const fsm2 = createStateMachine(fsmDef2, settings);

    const outputs1 = [{ [events[0] + 'X']: void 0 }, { [events[0]]: void 0 }, { [events[0]]: void 0 }].map(fsm1);
    const expected1 = [NO_OUTPUT, ['logNumber run on 0'], NO_OUTPUT];
    const outputs2 = [{ [events[0] + 'X']: void 0 }, { [events[0]]: void 0 }, { [events[0]]: void 0 }].map(fsm2);
    const expected2 = [NO_OUTPUT, ['logOther run on '], NO_OUTPUT];

    it('runs the machine as per the graph', function() {
      assert.deepEqual(events, ['continue'], `events correctly parsed`);
      assert.deepEqual(
        states,
        {
          "n1ღGroup 1": {
            'n1::n0ღNumber': '',
            'n1::n2ღOther': '',
            'n1::n3ღDone': '',
          },
        },
        `state hierarchy correctly parsed`
      );
      assert.deepEqual(outputs1, expected1, `Branch machine initialized with number ok`);
      assert.deepEqual(outputs2, expected2, `Branch machine initialized with string ok`);
    });
  });

  describe('hierarchy_conditional_init', function() {
    // run the script on the test file
    const graphMlFile = './graphs/hierarchy-conditional-init.graphml';
    try {
      execSync(`node ../index ${graphMlFile}`, [],{cwd: TEST_DIR});
    }
    catch(err){
      assert.ok(true, false, `Failed to execute the conversion on file ${graphMlFile}`)
    }

    // require the js file
    const {events, states, getKinglyTransitions} = require(`${graphMlFile}.fsm.cjs`);

    // Build the machine
    const settings1 = { n: 0 };
    const settings2 = { n: '' };
    // We do the branching on `settings` so we tests also the signature of the guards
    // in passing
    const guards = {
      'not(isNumber)': (s, e, stg) => typeof stg.n !== 'number',
      isNumber: (s, e, stg) => typeof stg.n === 'number',
    };
    const actionFactories = {
      logAtoB: (s, e, stg) => traceTransition('A -> B'),
      logAtoC: (s, e, stg) => traceTransition('A -> C'),
    };

    // Two machines to test the guard and achieve all-transition coverage
    const fsmDef1 = {
      updateState,
      initialExtendedState: void 0,
      events,
      states,
      transitions: getKinglyTransitions({ actionFactories, guards }),
    };
    const fsm1 = createStateMachine(fsmDef1, settings1);
    const outputs1 = [unknownEvent, { event1: void 0 }].map(fsm1);
    const expected1 = [null, [null, 'A -> B']];

    const fsmDef2 = {
      updateState,
      initialExtendedState: void 0,
      events,
      states,
      transitions: getKinglyTransitions({ actionFactories, guards })
    };
    const fsm2 = createStateMachine(fsmDef2, settings2);
    const outputs2 = [unknownEvent, { event1: void 0 }].map(fsm2);
    const expected2 = [null, [null, 'A -> C']];

    it('runs the machine as per the graph', function() {
      assert.deepEqual(events, ['event1'], `The list of events is correctly parsed`);
      assert.deepEqual(
        states,
        {
          n1ღA: '',
          'n2ღGroup 1': {
            'n2::n0ღB': '',
            'n2::n2ღC': '',
          },
        },
        `The hierarchy of states is correctly parsed`
      );
      assert.deepEqual(outputs1, expected1, `Branch machine initialized with number ok`);
      assert.deepEqual(outputs2, expected2, `Branch machine initialized with string ok`);
    });
  });

  describe('deep_hierarchy_conditional_automatic_init_event_eventless', function() {
    // run the script on the test file
    const graphMlFile = './graphs/deep-hierarchy-conditional-automatic-init-event-eventless.graphml';
    try {
      execSync(`node ../index ${graphMlFile}`, [],{cwd: TEST_DIR});
    }
    catch(err){
      assert.ok(true, false, `Failed to execute the conversion on file ${graphMlFile}`)
    }

    // require the js file
    const {events, states, getKinglyTransitions} = require(`${graphMlFile}.fsm.cjs`);

    // Build the machine
    const guards = {
      // we test on extended state, so we test also the guard parameters
      // are as expected
      'not(isNumber)': (s, e, stg) => typeof e.n !== 'number',
      isNumber: (s, e, stg) => typeof e.n === 'number',
      shouldReturnToA: (s, e, stg) => e.shouldReturnToA,
    };
    const actionFactories = {
      logAtoGroup1: (s, e, stg) => traceTransition('A -> Group1'),
      logGroup1toGroup2: (s, e, stg) => traceTransition('Group1 -> B'),
      logGroup2toGroup3: (s, e, stg) => traceTransition('Group2 -> Group3'),
      logGroup3BtoGroup4: (s, e, stg) => traceTransition('Group3 -> Group4'),
      logGroup3toB: (s, e, stg) => traceTransition('Group3 -> B'),
      logGroup3toC: (s, e, stg) => traceTransition('Group3 -> C'),
      logAtoB: (s, e, stg) => traceTransition('A -> B'),
      logAtoC: (s, e, stg) => traceTransition('A -> C'),
      logBtoD: (s, e, stg) => traceTransition('B -> D'),
      logDtoA: (s, e, stg) => traceTransition('D -> A'),
      logCtoD: (s, e, stg) => traceTransition('C -> D'),
    };
    const fsmDef = {
      updateState,
      initialExtendedState: void 0,
      events,
      states,
      transitions: getKinglyTransitions({ actionFactories, guards }),
    };
    const outputs1 = [
      { event1: { n: 0 } },
      { event1: void 0 },
      { event1: void 0 },
      { event2: { shouldReturnToA: false } },
      { event2: { shouldReturnToA: false } },
    ].map(createStateMachine(fsmDef, settings));
    const outputs2 = [
      { event1: { n: 0 } },
      { event1: void 0 },
      { event2: void 0 },
      { event1: { shouldReturnToA: false } },
      { event1: { shouldReturnToA: false } },
    ].map(createStateMachine(fsmDef, settings));
    const outputs3 = [
      { event1: { n: 0 } },
      { event1: void 0 },
      { event1: void 0 },
      { event2: { shouldReturnToA: true } },
      { event2: { shouldReturnToA: false } },
    ].map(createStateMachine(fsmDef, settings));
    const outputs4 = [
      { event1: { n: 0 } },
      { event1: void 0 },
      { event2: void 0 },
      { event1: { shouldReturnToA: true } },
      { event1: { shouldReturnToA: false } },
    ].map(createStateMachine(fsmDef, settings));
    const outputs5 = [
      { event1: { n: '' } },
      { event1: void 0 },
      { event2: void 0 },
      { event1: { shouldReturnToA: true } },
      { event1: { shouldReturnToA: false } },
    ].map(createStateMachine(fsmDef, settings));

    it('runs the machine as per the graph', function() {
      assert.deepEqual(events, ['event1', 'event2'], `events correctly parsed`);
      assert.deepEqual(
        states,
        {
          n1ღA: '',
          'n2ღGroup 1': {
            'n2::n0ღB': '',
            'n2::n2ღGroup 2': {
              'n2::n2::n1ღGroup 3': {
                'n2::n2::n1::n0ღB': '',
                'n2::n2::n1::n2ღC': '',
                'n2::n2::n1::n3ღGroup 4': {
                  'n2::n2::n1::n3::n0ღA': '',
                  'n2::n2::n1::n3::n1ღB': '',
                  'n2::n2::n1::n3::n2ღC': '',
                  'n2::n2::n1::n3::n3ღD': '',
                },
              },
            },
          },
        },
        `state hierarchy correctly parsed`
      );
      // !!! mocha diff shows `null` as [null]!!!
      assert.deepEqual(
        outputs1,
        [
          ['A -> Group1', 'Group1 -> B', null, 'Group2 -> Group3', 'Group3 -> B'],
          ['Group3 -> Group4', null],
          ['A -> B'],
          ['B -> D', null],
          null,
        ],
        `ok`
      );
      assert.deepEqual(
        outputs2,
        [
          ['A -> Group1', 'Group1 -> B', null, 'Group2 -> Group3', 'Group3 -> B'],
          ['Group3 -> Group4', null],
          ['A -> C'],
          ['C -> D', null],
          null,
        ],
        `ok`
      );
      assert.deepEqual(
        outputs3,
        [
          ['A -> Group1', 'Group1 -> B', null, 'Group2 -> Group3', 'Group3 -> B'],
          ['Group3 -> Group4', null],
          ['A -> B'],
          ['B -> D', 'D -> A'],
          ['A -> C'],
        ],
        `ok`
      );
      assert.deepEqual(
        outputs4,
        [
          ['A -> Group1', 'Group1 -> B', null, 'Group2 -> Group3', 'Group3 -> B'],
          ['Group3 -> Group4', null],
          ['A -> C'],
          ['C -> D', 'D -> A'],
          ['A -> B'],
        ],
        `ok`
      );
      assert.deepEqual(
        outputs5,
        [['A -> Group1', 'Group1 -> B', null, 'Group2 -> Group3', 'Group3 -> C'], null, null, null, null],
        `ok`
      );
    });
  });

  describe('hierarchy_history_H', function() {
    // run the script on the test file
    const graphMlFile = './graphs/hierarchy-history-H.graphml';
    try {
      execSync(`node ../index ${graphMlFile}`, [],{cwd: TEST_DIR});
    }
    catch(err){
      assert.ok(true, false, `Failed to execute the conversion on file ${graphMlFile}`)
    }

    // require the js file
    const {events, states, getKinglyTransitions} = require(`${graphMlFile}.fsm.cjs`);

    // Build the machine
    const eventSpace = [event1, event2, event3];
    const guards = {};
    const actionFactories = {
      logGroup1toC: (s, e, stg) => traceTransition('Group1 -> C'),
      logBtoC: (s, e, stg) => traceTransition('B -> C'),
      logBtoD: (s, e, stg) => traceTransition('B -> D'),
      logCtoD: (s, e, stg) => traceTransition('C -> D'),
      logDtoGroup1H: (s, e, stg) => traceTransition('D -> Group1H'),
    };

    // Two machines to test the guard and achieve all-transition coverage
    const fsmDef1 = {
      updateState,
      initialExtendedState: {},
      events,
      states,
      transitions: getKinglyTransitions({ actionFactories, guards }),
    };
    const inputSpace = cartesian([0, 1, 2], [0, 1, 2], [0, 1, 2]);
    const cases = inputSpace.map(scenario => {
      return [eventSpace[scenario[0]], eventSpace[scenario[1]], eventSpace[scenario[2]]];
    });
    const outputs1 = cases.map((scenario, i) => {
      const fsm1 = createStateMachine(fsmDef1, {});
      // console.log(scenario.map(fsm1), i)
      return scenario.map(fsm1);
    });
    const expected1 = [
      // [event1, event1, event1]
      [['B -> D'], null, null],
      [['B -> D'], null, null],
      [['B -> D'], null, [null, 'D -> Group1H']],
      // [event1, event2, event1]
      [['B -> D'], null, null],
      [['B -> D'], null, null],
      [['B -> D'], null, [null, 'D -> Group1H']],
      // [event1, event3, event1]
      [['B -> D'], [null, 'D -> Group1H'], null],
      [['B -> D'], [null, 'D -> Group1H'], null],
      [['B -> D'], [null, 'D -> Group1H'], [null, 'D -> Group1H']],
      // [event2, event1, event1]
      [['B -> C'], ['C -> D'], null],
      [['B -> C'], ['C -> D'], null],
      [['B -> C'], ['C -> D'], [null, 'D -> Group1H']],
      // [event2, event2, event1]
      [['B -> C'], null, ['C -> D']],
      [['B -> C'], null, null],
      [['B -> C'], null, [null, 'D -> Group1H']],
      // [event2, event3, event1]
      [['B -> C'], [null, 'D -> Group1H'], ['C -> D']],
      [['B -> C'], [null, 'D -> Group1H'], null],
      [['B -> C'], [null, 'D -> Group1H'], [null, 'D -> Group1H']],
      // [event3, event1, event1]
      [[null, 'D -> Group1H'], ['B -> D'], null],
      [[null, 'D -> Group1H'], ['B -> D'], null],
      [[null, 'D -> Group1H'], ['B -> D'], [null, 'D -> Group1H']],
      // [event3, event2, event1]
      [[null, 'D -> Group1H'], ['B -> C'], ['C -> D']],
      [[null, 'D -> Group1H'], ['B -> C'], null],
      [[null, 'D -> Group1H'], ['B -> C'], [null, 'D -> Group1H']],
      // [event3, event3, event1]
      [[null, 'D -> Group1H'], [null, 'D -> Group1H'], ['B -> D']],
      [[null, 'D -> Group1H'], [null, 'D -> Group1H'], ['B -> C']],
      [[null, 'D -> Group1H'], [null, 'D -> Group1H'], [null, 'D -> Group1H']],
    ];

    it('runs the machine as per the graph', function() {
      assert.deepEqual(events, ['event3', 'event1', 'event2'], `The list of events is correctly parsed`);
      assert.deepEqual(
        states,
        {
          n1ღD: '',
          'n2ღGroup 1': {
            'n2::n0ღB': '',
            'n2::n1ღC': '',
            'n2::n2ღD': '',
          },
        },
        `The hierarchy of states is correctly parsed`
      );
      assert.deepEqual(outputs1, expected1, `Branch machine initialized with number ok`);
    });
  });

  describe('hierarchy_history_H_star', function() {
    // Should be exactly the same as the hierarchy_history_H case
    // run the script on the test file
    const graphMlFile = './graphs/hierarchy-history-H-star.graphml';
    try {
      execSync(`node ../index ${graphMlFile}`, [],{cwd: TEST_DIR});
    }
    catch(err){
      assert.ok(true, false, `Failed to execute the conversion on file ${graphMlFile}`)
    }

    // require the js file
    const {events, states, getKinglyTransitions} = require(`${graphMlFile}.fsm.cjs`);

    // Build the machine
    const eventSpace = [event1, event2, event3];
    const guards = {};
    const actionFactories = {
      logGroup1toC: (s, e, stg) => traceTransition('Group1 -> C'),
      logBtoC: (s, e, stg) => traceTransition('B -> C'),
      logBtoD: (s, e, stg) => traceTransition('B -> D'),
      logCtoD: (s, e, stg) => traceTransition('C -> D'),
      'logDtoGroup1H*': (s, e, stg) => traceTransition('D -> Group1H*'),
    };

    // Two machines to test the guard and achieve all-transition coverage
    const fsmDef1 = {
      updateState,
      initialExtendedState: {},
      events,
      states,
      transitions: getKinglyTransitions({ actionFactories, guards }),
    };
    const inputSpace = cartesian([0, 1, 2], [0, 1, 2], [0, 1, 2]);
    const cases = inputSpace.map(scenario => {
      return [eventSpace[scenario[0]], eventSpace[scenario[1]], eventSpace[scenario[2]]];
    });
    const outputs1 = cases.map(scenario => {
      const fsm1 = createStateMachine(fsmDef1, settings);
      return scenario.map(fsm1);
    });
    const expected1 = [
      // [event1, event1, event1]
      [['B -> D'], null, null],
      [['B -> D'], null, null],
      [['B -> D'], null, [null, 'D -> Group1H*']],
      // [event1, event2, event1]
      [['B -> D'], null, null],
      [['B -> D'], null, null],
      [['B -> D'], null, [null, 'D -> Group1H*']],
      // [event1, event3, event1]
      [['B -> D'], [null, 'D -> Group1H*'], null],
      [['B -> D'], [null, 'D -> Group1H*'], null],
      [['B -> D'], [null, 'D -> Group1H*'], [null, 'D -> Group1H*']],
      // [event2, event1, event1]
      [['B -> C'], ['C -> D'], null],
      [['B -> C'], ['C -> D'], null],
      [['B -> C'], ['C -> D'], [null, 'D -> Group1H*']],
      // [event2, event2, event1]
      [['B -> C'], null, ['C -> D']],
      [['B -> C'], null, null],
      [['B -> C'], null, [null, 'D -> Group1H*']],
      // [event2, event3, event1]
      [['B -> C'], [null, 'D -> Group1H*'], ['C -> D']],
      [['B -> C'], [null, 'D -> Group1H*'], null],
      [['B -> C'], [null, 'D -> Group1H*'], [null, 'D -> Group1H*']],
      // [event3, event1, event1]
      [[null, 'D -> Group1H*'], ['B -> D'], null],
      [[null, 'D -> Group1H*'], ['B -> D'], null],
      [[null, 'D -> Group1H*'], ['B -> D'], [null, 'D -> Group1H*']],
      // [event3, event2, event1]
      [[null, 'D -> Group1H*'], ['B -> C'], ['C -> D']],
      [[null, 'D -> Group1H*'], ['B -> C'], null],
      [[null, 'D -> Group1H*'], ['B -> C'], [null, 'D -> Group1H*']],
      // [event3, event3, event1]
      [[null, 'D -> Group1H*'], [null, 'D -> Group1H*'], ['B -> D']],
      [[null, 'D -> Group1H*'], [null, 'D -> Group1H*'], ['B -> C']],
      [[null, 'D -> Group1H*'], [null, 'D -> Group1H*'], [null, 'D -> Group1H*']],
    ];

    it('runs the machine as per the graph', function() {
      assert.deepEqual(events, ['event3', 'event1', 'event2'], `The list of events is correctly parsed`);
      assert.deepEqual(
        states,
        {
          n1ღD: '',
          'n2ღGroup 1': {
            'n2::n0ღB': '',
            'n2::n1ღC': '',
            'n2::n2ღD': '',
          },
        },
        `The hierarchy of states is correctly parsed`
      );
      assert.deepEqual(outputs1, expected1, `Branch machine initialized with number ok`);
    });
  });

  describe('deep_hierarchy_history_H_star', function() {
    // Should be exactly the same as the hierarchy_history_H case
    // run the script on the test file
    const graphMlFile = './graphs/deep-hierarchy-history-H-star.graphml';
    try {
      execSync(`node ../index ${graphMlFile}`, [],{cwd: TEST_DIR});
    }
    catch(err){
      assert.ok(true, false, `Failed to execute the conversion on file ${graphMlFile}`)
    }

    // require the js file
    const {events, states, getKinglyTransitions} = require(`${graphMlFile}.fsm.cjs`);

    // Build the machine
    const eventSpace = [event1, event2, event3];
    const guards = {};
    const actionFactories = {
      logGroup1toC: (s, e, stg) => traceTransition('Group1 -> C'),
      logGroup1toD: (s, e, stg) => traceTransition('Group1 -> D'),
      logGroup1toE: (s, e, stg) => traceTransition('Group1 -> E'),
      logBtoC: (s, e, stg) => traceTransition('B -> C'),
      logBtoD: (s, e, stg) => traceTransition('B -> D'),
      logCtoD: (s, e, stg) => traceTransition('C -> D'),
      logDtoD: (s, e, stg) => traceTransition('D -> D'),
      'logGroup1toH*': (s, e, stg) => traceTransition('Group1 -> Group1H*'),
    };

    // Two machines to test the guard and achieve all-transition coverage
    const fsmDef1 = {
      updateState,
      initialExtendedState: {},
      events,
      states,
      transitions: getKinglyTransitions({ actionFactories, guards })
    };
    const inputSpace = cartesian([0, 1, 2], [0, 1, 2], [0, 1, 2]);
    const cases = inputSpace.map(scenario => {
      return [eventSpace[scenario[0]], eventSpace[scenario[1]], eventSpace[scenario[2]]];
    });
    const outputs1 = cases.map(scenario => {
      const fsm1 = createStateMachine(fsmDef1, settings);
      return scenario.map(fsm1);
    });
    const expected1 = [
      // [event1, event1, event1]
      [['B -> D'], ['D -> D'], null],
      [['B -> D'], ['D -> D'], null],
      [['B -> D'], ['D -> D'], ['Group1 -> Group1H*', null]],
      // [event1, event2, event1]
      [['B -> D'], null, ['D -> D']],
      [['B -> D'], null, null],
      [['B -> D'], null, ['Group1 -> Group1H*', null]],
      // [event1, event3, event1]
      [['B -> D'], ['Group1 -> Group1H*', null], ['D -> D']],
      [['B -> D'], ['Group1 -> Group1H*', null], null],
      [['B -> D'], ['Group1 -> Group1H*', null], ['Group1 -> Group1H*', null]],
      // [event2, event1, event1]
      [['B -> C', 'C -> D'], null, null],
      [['B -> C', 'C -> D'], null, null],
      [['B -> C', 'C -> D'], null, ['Group1 -> Group1H*', null]],
      // [event2, event2, event1]
      [['B -> C', 'C -> D'], null, null],
      [['B -> C', 'C -> D'], null, null],
      [['B -> C', 'C -> D'], null, ['Group1 -> Group1H*', null]],
      // [event2, event3, event1]
      [['B -> C', 'C -> D'], ['Group1 -> Group1H*', null], null],
      [['B -> C', 'C -> D'], ['Group1 -> Group1H*', null], null],
      [['B -> C', 'C -> D'], ['Group1 -> Group1H*', null], ['Group1 -> Group1H*', null]],
      // [event3, event1, event1]
      [['Group1 -> Group1H*', null], ['B -> D'], ['D -> D']],
      [['Group1 -> Group1H*', null], ['B -> D'], null],
      [['Group1 -> Group1H*', null], ['B -> D'], ['Group1 -> Group1H*', null]],
      // [event3, event2, event1]
      [['Group1 -> Group1H*', null], ['B -> C', 'C -> D'], null],
      [['Group1 -> Group1H*', null], ['B -> C', 'C -> D'], null],
      [['Group1 -> Group1H*', null], ['B -> C', 'C -> D'], ['Group1 -> Group1H*', null]],
      // [event3, event3, event1]
      [['Group1 -> Group1H*', null], ['Group1 -> Group1H*', null], ['B -> D']],
      [['Group1 -> Group1H*', null], ['Group1 -> Group1H*', null], ['B -> C', 'C -> D']],
      [['Group1 -> Group1H*', null], ['Group1 -> Group1H*', null], ['Group1 -> Group1H*', null]],
    ];

    it('runs the machine as per the graph', function() {
      assert.deepEqual(events, ['event3', 'event2', 'event1'], `The list of events is correctly parsed`);
      assert.deepEqual(
        states,
        {
          n1ღE: '',
          'n2ღGroup 1': {
            'n2::n0ღB': '',
            'n2::n1ღC': '',
            'n2::n2ღGroup 1': {
              'n2::n2::n0ღD': '',
              'n2::n2::n2ღD': '',
            },
          },
        },
        `The hierarchy of states is correctly parsed`
      );
      assert.deepEqual(outputs1, expected1, `Branch machine initialized with number ok`);
    });
  });

  describe('deep_hierarchy_history_H', function() {
    // Should be exactly the same as the hierarchy_history_H case
    // run the script on the test file
    const graphMlFile = './graphs/deep-hierarchy-history-H.graphml';
    try {
      execSync(`node ../index ${graphMlFile}`, [],{cwd: TEST_DIR});
    }
    catch(err){
      assert.ok(true, false, `Failed to execute the conversion on file ${graphMlFile}`)
    }

    // require the js file
    const {events, states, getKinglyTransitions} = require(`${graphMlFile}.fsm.cjs`);

    // Build the machine
    const eventSpace = [event1, event2, event3];
    const guards = {};
    const actionFactories = {
      logGroup1toC: (s, e, stg) => traceTransition('Group1 -> C'),
      logGroup1toD: (s, e, stg) => traceTransition('Group1 -> D'),
      logGroup1toE: (s, e, stg) => traceTransition('Group1 -> E'),
      logBtoC: (s, e, stg) => traceTransition('B -> C'),
      logBtoD: (s, e, stg) => traceTransition('B -> D'),
      logCtoD: (s, e, stg) => traceTransition('C -> D'),
      logDtoD: (s, e, stg) => traceTransition('D -> D'),
      logGroup1toH: (s, e, stg) => traceTransition('Group1 -> Group1H'),
    };

    // Two machines to test the guard and achieve all-transition coverage
    const fsmDef1 = {
      updateState,
      initialExtendedState: {},
      events,
      states,
      transitions: getKinglyTransitions({ actionFactories, guards }),
    };
    const inputSpace = cartesian([0, 1, 2], [0, 1, 2], [0, 1, 2]);
    const cases = inputSpace.map(scenario => {
      return [eventSpace[scenario[0]], eventSpace[scenario[1]], eventSpace[scenario[2]]];
    });
    const outputs1 = cases.map(scenario => {
      const fsm1 = createStateMachine(fsmDef1, settings);
      return scenario.map(fsm1);
    });
    const expected1 = [
      // [event1, event1, event1]
      [['B -> D'], ['D -> D'], null],
      [['B -> D'], ['D -> D'], null],
      [['B -> D'], ['D -> D'], ['Group1 -> Group1H', null, 'Group1 -> D']],
      // [event1, event2, event1]
      [['B -> D'], null, ['D -> D']],
      [['B -> D'], null, null],
      [['B -> D'], null, ['Group1 -> Group1H', null, 'Group1 -> D']],
      // [event1, event3, event1]
      [['B -> D'], ['Group1 -> Group1H', null, 'Group1 -> D'], null],
      [['B -> D'], ['Group1 -> Group1H', null, 'Group1 -> D'], null],
      [['B -> D'], ['Group1 -> Group1H', null, 'Group1 -> D'], ['Group1 -> Group1H', null, 'Group1 -> D']],
      // // [event2, event1, event1]
      [['B -> C', 'C -> D'], null, null],
      [['B -> C', 'C -> D'], null, null],
      [['B -> C', 'C -> D'], null, ['Group1 -> Group1H', null, 'Group1 -> D']],
      // // [event2, event2, event1]
      [['B -> C', 'C -> D'], null, null],
      [['B -> C', 'C -> D'], null, null],
      [['B -> C', 'C -> D'], null, ['Group1 -> Group1H', null, 'Group1 -> D']],
      // // [event2, event3, event1]
      [['B -> C', 'C -> D'], ['Group1 -> Group1H', null, 'Group1 -> D'], null],
      [['B -> C', 'C -> D'], ['Group1 -> Group1H', null, 'Group1 -> D'], null],
      [['B -> C', 'C -> D'], ['Group1 -> Group1H', null, 'Group1 -> D'], ['Group1 -> Group1H', null, 'Group1 -> D']],
      // // [event3, event1, event1]
      [['Group1 -> Group1H', null], ['B -> D'], ['D -> D']],
      [['Group1 -> Group1H', null], ['B -> D'], null],
      [['Group1 -> Group1H', null], ['B -> D'], ['Group1 -> Group1H', null, 'Group1 -> D']],
      // // [event3, event2, event1]
      [['Group1 -> Group1H', null], ['B -> C', 'C -> D'], null],
      [['Group1 -> Group1H', null], ['B -> C', 'C -> D'], null],
      [['Group1 -> Group1H', null], ['B -> C', 'C -> D'], ['Group1 -> Group1H', null, 'Group1 -> D']],
      // // [event3, event3, event1]
      [['Group1 -> Group1H', null], ['Group1 -> Group1H', null], ['B -> D']],
      [['Group1 -> Group1H', null], ['Group1 -> Group1H', null], ['B -> C', 'C -> D']],
      [['Group1 -> Group1H', null], ['Group1 -> Group1H', null], ['Group1 -> Group1H', null]],
    ];

    it('runs the machine as per the graph', function() {
      assert.deepEqual(events, ['event3', 'event2', 'event1'], `The list of events is correctly parsed`);
      assert.deepEqual(
        states,
        {
          n1ღE: '',
          'n2ღGroup 1': {
            'n2::n0ღB': '',
            'n2::n1ღC': '',
            'n2::n2ღGroup 1': {
              'n2::n2::n0ღD': '',
              'n2::n2::n2ღD': '',
            },
          },
        },
        `The hierarchy of states is correctly parsed`
      );
      assert.deepEqual(outputs1, expected1, `Branch machine initialized with number ok`);
    });
  });

});
