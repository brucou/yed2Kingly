var createStateMachine = require("kingly").createStateMachine;

// Copy-paste help
// For debugging purposes, guards and actions functions should all have a name
// Using natural language sentences for labels in the graph is valid
// guard and action functions name still follow JavaScript rules though
// -----Guards------
/**
 * @param {E} extendedState
 * @param {D} eventData
 * @param {X} settings
 * @returns Boolean
 */
// const guards = {
//   "condition1": function (){},
//   "condition2": function (){},
//   "condition3": function (){},
//   "shouldReturnToA": function (){},
// };
// -----Actions------
/**
 * @param {E} extendedState
 * @param {D} eventData
 * @param {X} settings
 * @returns {{updates: U[], outputs: O[]}}
 * (such that updateState:: E -> U[] -> E)
 */
// const actions = {
//   "logAtoTemp1": function (){},
//   "logAtoTemp2": function (){},
//   "logAtoDone": function (){},
//   "logTemp1toA": function (){},
//   "logTemp2toA": function (){},
// };
// ----------------
function contains(as, bs) {
  return as.every(function (a) {
    return bs.indexOf(a) > -1;
  });
}

function chain(arrFns, actions) {
  return function chain_(s, ed, stg) {
    return arrFns.reduce(
      function (acc, fn) {
        var r = actions[fn](s, ed, stg);

        return {
          updates: acc.updates.concat(r.updates),
          outputs: acc.outputs.concat(r.outputs),
        };
      },
      { updates: [], outputs: [] }
    );
  };
}

function every(arrFns, guards) {
  return function every_(s, ed, stg) {
    return arrFns.reduce(function (acc, fn) {
      var r = guards[fn](s, ed, stg);

      return r && acc;
    }, true);
  };
}

var NO_OUTPUT = [];
var NO_STATE_UPDATE = [];
var events = ["event"];
var states = { n1ღA: "", n2ღTemp1: "", n3ღTemp2: "", n4ღDone: "" };
function getKinglyTransitions(record) {
  var aF = record.actionFactories;
  var guards = record.guards;
  var actionList = ["logAtoTemp1", "logAtoTemp2", "logAtoDone", "logTemp1toA", "logTemp2toA"];
  var predicateList = ["condition1", "condition2", "condition3", "shouldReturnToA"];
  if (!contains(actionList, Object.keys(aF))) {
    console.error(
      "Some actions are missing either in the graph, or in the action implementation object! Cf actionFactories (you passed that) vs. actionList (from the graph) below. They must have the same items!"
    );
    console.error({ actionFactories: Object.keys(aF), actionList });
    var passedAndMissingInGraph = Object.keys(aF).filter(function (k) {
      return actionList.indexOf(k) === -1;
    });
    passedAndMissingInGraph.length > 0 &&
      console.error(
        "So the following actions were passed in parameters but do not match any action in the graph! This may happen if you modified the name of an action in the graph, but kept using the older name in the implementation! Please check.",
        passedAndMissingInGraph
      );
    var inGraphButNotImplemented = actionList.filter(function (k) {
      return Object.keys(aF).indexOf(k) === -1;
    });
    inGraphButNotImplemented.length > 0 &&
      console.error(
        "So the following actions declared in the graph are not implemented! Please add the implementation. You can have a look at the comments of the generated fsm file for typing information.",
        inGraphButNotImplemented
      );
    throw new Error(
      "Some actions implementations are missing either in the graph, or in the action implementation object!"
    );
  }
  if (!contains(predicateList, Object.keys(guards))) {
    console.error(
      "Some guards are missing either in the graph, or in the action implementation object! Cf guards (you passed that) vs. predicateList (from the graph) below. They must have the same items!"
    );
    console.error({ guards: Object.keys(guards), predicateList });
    throw new Error("Some guards are missing either in the graph, or in the guard implementation object!");
  }
  const transitions = [
    { from: "nok", event: "init", to: "n1ღA", action: chain([], aF) },
    {
      from: "n1ღA",
      event: "event",
      guards: [
        { predicate: every(["condition1"], guards), to: "n2ღTemp1", action: chain(["logAtoTemp1"], aF) },
        { predicate: every(["condition2"], guards), to: "n3ღTemp2", action: chain(["logAtoTemp2"], aF) },
        { predicate: every(["condition3"], guards), to: "n4ღDone", action: chain(["logAtoDone"], aF) },
      ],
    },
    { from: "n2ღTemp1", event: "", to: "n1ღA", action: chain(["logTemp1toA"], aF) },
    { from: "n3ღTemp2", event: "", to: "n1ღA", action: chain(["logTemp2toA"], aF) },
    {
      from: "n4ღDone",
      event: "",
      guards: [{ predicate: every(["shouldReturnToA"], guards), to: "n1ღA", action: chain([], aF) }],
    },
  ];

  return transitions;
}

function createStateMachineFromGraph(fsmDefForCompile, settings) {
  var updateState = fsmDefForCompile.updateState;
  var initialExtendedState = fsmDefForCompile.initialExtendedState;

  var transitions = getKinglyTransitions({
    actionFactories: fsmDefForCompile.actionFactories,
    guards: fsmDefForCompile.guards,
  });

  var fsm = createStateMachine(
    {
      updateState,
      initialExtendedState,
      states,
      events,
      transitions,
    },
    settings
  );

  return fsm;
}

module.exports = {
  events,
  states,
  getKinglyTransitions,
  createStateMachineFromGraph,
};
