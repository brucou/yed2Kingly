// Copy-paste help
// For debugging purposes, functions should all have a name
// Using natural language sentences in the graph is valid
// However, you will have to find a valid JavaScript name for the matching function
// -----Guards------
// const guards = {
//   "isNumber": function (){},
//   "not(isNumber)": function (){},
// };
// -----Actions------
// const actions = {
//   "logAtoB": function (){},
//   "logAtoC": function (){},
// };
// ----------------
function contains(as, bs) {
  return as.every(function (a) {
    return bs.indexOf(a) > -1;
  });
}
var NO_OUTPUT = null;
var NO_STATE_UPDATE = [];
var events = ["event1"];
var states = { n1ღA: "", "n2ღGroup 1": { "n2::n0ღB": "", "n2::n2ღC": "" } };
function getKinglyTransitions(record) {
  var aF = record.actionFactories;
  var guards = record.guards;
  var actionList = ["ACTION_IDENTITY", "logAtoB", "logAtoC"];
  var predicateList = ["isNumber", "not(isNumber)"];
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
      from: "n2ღGroup 1",
      event: "init",
      guards: [
        { predicate: guards["isNumber"], to: "n2::n0ღB", action: aF["logAtoB"] },
        { predicate: guards["not(isNumber)"], to: "n2::n2ღC", action: aF["logAtoC"] },
      ],
    },
    { from: "n1ღA", event: "event1", to: "n2ღGroup 1", action: aF["ACTION_IDENTITY"] },
  ];

  return transitions;
}

export { events, states, getKinglyTransitions };
