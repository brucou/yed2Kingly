// Copy-paste help
// For debugging purposes, functions should all have a name
// Using natural language sentences in the graph is valid
// However, you will have to find a valid JavaScript name for the matching function
// -----Guards------
// const guards = {
// };
// -----Actions------
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
var NO_OUTPUT = null;
var NO_STATE_UPDATE = [];
var events = ["event3", "event2", "event1"];
var states = {
  n1ღE: "",
  "n2ღGroup 1": { "n2::n0ღB": "", "n2::n1ღC": "", "n2::n2ღGroup 1": { "n2::n2::n0ღD": "", "n2::n2::n2ღD": "" } },
};
function getKinglyTransitions(record) {
  var aF = record.actionFactories;
  var guards = record.guards;
  var actionList = [
    "logGroup1toH*",
    "ACTION_IDENTITY",
    "logBtoC",
    "logBtoD",
    "logCtoD",
    "logGroup1toD",
    "logGroup1toC",
    "logDtoD",
  ];
  var predicateList = [];
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
    { from: "n2ღGroup 1", event: "event3", to: "n1ღE", action: aF["logGroup1toH*"] },
    { from: "n1ღE", event: "", to: { deep: "n2ღGroup 1" }, action: aF["ACTION_IDENTITY"] },
    { from: "nok", event: "init", to: "n2::n0ღB", action: aF["ACTION_IDENTITY"] },
    { from: "n2::n0ღB", event: "event2", to: "n2::n1ღC", action: aF["logBtoC"] },
    { from: "n2::n0ღB", event: "event1", to: "n2::n2::n2ღD", action: aF["logBtoD"] },
    { from: "n2::n1ღC", event: "", to: "n2::n2::n0ღD", action: aF["logCtoD"] },
    { from: "n2::n2ღGroup 1", event: "init", to: "n2::n2::n0ღD", action: aF["logGroup1toD"] },
    { from: "n2ღGroup 1", event: "init", to: "n2::n1ღC", action: aF["logGroup1toC"] },
    { from: "n2::n2::n2ღD", event: "event1", to: "n2::n2::n0ღD", action: aF["logDtoD"] },
  ];

  return transitions;
}

export { events, states, getKinglyTransitions };
