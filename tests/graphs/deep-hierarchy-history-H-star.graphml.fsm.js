import { createStateMachine } from "kingly";

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
//   "logGroup1toH*": function (){},
//   "logBtoC": function (){},
//   "logBtoD": function (){},
//   "logCtoD": function (){},
//   "logGroup1toD": function (){},
//   "logGroup1toC": function (){},
//   "logDtoD": function (){},
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
var events = ["event3", "event2", "event1"];
var states = {
  n1ღE: "",
  "n2ღGroup 1": { "n2::n0ღB": "", "n2::n1ღC": "", "n2::n2ღGroup 1": { "n2::n2::n0ღD": "", "n2::n2::n2ღD": "" } },
};
function getKinglyTransitions(record) {
  var aF = record.actionFactories;
  var guards = record.guards;
  var actionList = ["logGroup1toH*", "logBtoC", "logBtoD", "logCtoD", "logGroup1toD", "logGroup1toC", "logDtoD"];
  var predicateList = [];
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
    { from: "n2ღGroup 1", event: "event3", to: "n1ღE", action: chain(["logGroup1toH*"], aF) },
    { from: "n1ღE", event: "", to: { deep: "n2ღGroup 1" }, action: chain([], aF) },
    { from: "nok", event: "init", to: "n2::n0ღB", action: chain([], aF) },
    { from: "n2::n0ღB", event: "event2", to: "n2::n1ღC", action: chain(["logBtoC"], aF) },
    { from: "n2::n0ღB", event: "event1", to: "n2::n2::n2ღD", action: chain(["logBtoD"], aF) },
    { from: "n2::n1ღC", event: "", to: "n2::n2::n0ღD", action: chain(["logCtoD"], aF) },
    { from: "n2::n2ღGroup 1", event: "init", to: "n2::n2::n0ღD", action: chain(["logGroup1toD"], aF) },
    { from: "n2ღGroup 1", event: "init", to: "n2::n1ღC", action: chain(["logGroup1toC"], aF) },
    { from: "n2::n2::n2ღD", event: "event1", to: "n2::n2::n0ღD", action: chain(["logDtoD"], aF) },
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

export { events, states, getKinglyTransitions, createStateMachineFromGraph };
