// Copy-paste help
// For debugging purposes, functions should all have a name
// Using natural language sentences in the graph is valid
// However, you will have to find a valid JavaScript name for the matching function
// -----Guards------
// const guards = {
//   "condition1": function (){},
//   "condition2": function (){},
//   "condition3": function (){},
//   "shouldReturnToA": function (){},
// };
// -----Actions------
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
var NO_OUTPUT = null;
var NO_STATE_UPDATE = [];
var events = ["event"];
var states = { n1ღA: "", n2ღTemp1: "", n3ღTemp2: "", n4ღDone: "" };
function getKinglyTransitions(record) {
  var aF = record.actionFactories;
  var guards = record.guards;
  var actionList = ["ACTION_IDENTITY", "logAtoTemp1", "logAtoTemp2", "logAtoDone", "logTemp1toA", "logTemp2toA"];
  var predicateList = ["condition1", "condition2", "condition3", "shouldReturnToA"];
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
    {
      from: "n1ღA",
      event: "event",
      guards: [
        { predicate: guards["condition1"], to: "n2ღTemp1", action: aF["logAtoTemp1"] },
        { predicate: guards["condition2"], to: "n3ღTemp2", action: aF["logAtoTemp2"] },
        { predicate: guards["condition3"], to: "n4ღDone", action: aF["logAtoDone"] },
      ],
    },
    { from: "n2ღTemp1", event: "", to: "n1ღA", action: aF["logTemp1toA"] },
    { from: "n3ღTemp2", event: "", to: "n1ღA", action: aF["logTemp2toA"] },
    {
      from: "n4ღDone",
      event: "",
      guards: [{ predicate: guards["shouldReturnToA"], to: "n1ღA", action: aF["ACTION_IDENTITY"] }],
    },
  ];

  return transitions;
}

export { events, states, getKinglyTransitions };
