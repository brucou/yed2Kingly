// Copy-paste help
// For debugging purposes, functions should all have a name
// Using natural language sentences in the graph is valid
// However, you will have to find a valid JavaScript name for the matching function
// -----Guards------
// const guards = {
//   "shouldReturnToA": function (){},
// };
// -----Actions------
// const actions = {
//   "logAtoB": function (){},
//   "logAtoC": function (){},
//   "logBtoD": function (){},
//   "logCtoD": function (){},
//   "logDtoA": function (){},
// };
// ----------------
function contains(as, bs) {
  return as.every(function (a) {
    return bs.indexOf(a) > -1;
  });
}
var NO_OUTPUT = null;
var NO_STATE_UPDATE = [];
var events = ["event1", "event2"];
var states = { n1ღA: "", n2ღB: "", n3ღC: "", n4ღD: "" };
function getKinglyTransitions(record) {
  var aF = record.actionFactories;
  var guards = record.guards;
  var actionList = ["ACTION_IDENTITY", "logAtoB", "logAtoC", "logBtoD", "logCtoD", "logDtoA"];
  var predicateList = ["shouldReturnToA"];
  aF["ACTION_IDENTITY"] = function ACTION_IDENTITY() {
    return {
      outputs: NO_OUTPUT,
      updates: NO_STATE_UPDATE,
    };
  };
  if (!contains(actionList, Object.keys(aF))) {
    console.error({ actionFactories: Object.keys(aF), actionList });
    throw new Error("Some action are missing either in the graph, or in the action implementation object!");
  }
  if (!contains(predicateList, Object.keys(guards))) {
    console.error({ guards: Object.keys(guards), predicateList });
    throw new Error("Some guards are missing either in the graph, or in the guard implementation object!");
  }
  const transitions = [
    { from: "nok", event: "init", to: "n1ღA", action: aF["ACTION_IDENTITY"] },
    { from: "n1ღA", event: "event1", to: "n2ღB", action: aF["logAtoB"] },
    { from: "n1ღA", event: "event2", to: "n3ღC", action: aF["logAtoC"] },
    { from: "n2ღB", event: "event2", to: "n4ღD", action: aF["logBtoD"] },
    { from: "n3ღC", event: "event1", to: "n4ღD", action: aF["logCtoD"] },
    { from: "n4ღD", event: "", guards: [{ predicate: guards["shouldReturnToA"], to: "n1ღA", action: aF["logDtoA"] }] },
  ];

  return transitions;
}

export { events, states, getKinglyTransitions };
