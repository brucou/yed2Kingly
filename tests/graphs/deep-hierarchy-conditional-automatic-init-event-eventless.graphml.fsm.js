// Copy-paste help
// For debugging purposes, functions should all have a name
// Using natural language sentences in the graph is valid
// However, you will have to find a valid JavaScript name for the matching function
// -----Guards------
// const guards = {
//   "isNumber": function (){},
//   "not(isNumber)": function (){},
//   "shouldReturnToA": function (){},
// };
// -----Actions------
// const actions = {
//   "logAtoGroup1": function (){},
//   "logGroup1toGroup2": function (){},
//   "logGroup2toGroup3": function (){},
//   "logGroup3BtoGroup4": function (){},
//   "logGroup3toB": function (){},
//   "logGroup3toC": function (){},
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
var states = {
  n1ღA: "",
  "n2ღGroup 1": {
    "n2::n0ღB": "",
    "n2::n2ღGroup 2": {
      "n2::n2::n1ღGroup 3": {
        "n2::n2::n1::n0ღB": "",
        "n2::n2::n1::n2ღC": "",
        "n2::n2::n1::n3ღGroup 4": {
          "n2::n2::n1::n3::n0ღA": "",
          "n2::n2::n1::n3::n1ღB": "",
          "n2::n2::n1::n3::n2ღC": "",
          "n2::n2::n1::n3::n3ღD": "",
        },
      },
    },
  },
};
function getKinglyTransitions(record) {
  var aF = record.actionFactories;
  var guards = record.guards;
  var actionList = [
    "ACTION_IDENTITY",
    "logAtoGroup1",
    "logGroup1toGroup2",
    "logGroup2toGroup3",
    "logGroup3BtoGroup4",
    "logGroup3toB",
    "logGroup3toC",
    "logAtoB",
    "logAtoC",
    "logBtoD",
    "logCtoD",
    "logDtoA",
  ];
  var predicateList = ["isNumber", "not(isNumber)", "shouldReturnToA"];
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
    { from: "n1ღA", event: "event1", to: "n2ღGroup 1", action: aF["logAtoGroup1"] },
    { from: "n2::n0ღB", event: "", to: "n2::n2ღGroup 2", action: aF["ACTION_IDENTITY"] },
    { from: "n2ღGroup 1", event: "init", to: "n2::n0ღB", action: aF["logGroup1toGroup2"] },
    { from: "n2::n2ღGroup 2", event: "init", to: "n2::n2::n1ღGroup 3", action: aF["logGroup2toGroup3"] },
    { from: "n2::n2::n1::n0ღB", event: "event1", to: "n2::n2::n1::n3ღGroup 4", action: aF["logGroup3BtoGroup4"] },
    {
      from: "n2::n2::n1ღGroup 3",
      event: "init",
      guards: [
        { predicate: guards["isNumber"], to: "n2::n2::n1::n0ღB", action: aF["logGroup3toB"] },
        { predicate: guards["not(isNumber)"], to: "n2::n2::n1::n2ღC", action: aF["logGroup3toC"] },
      ],
    },
    { from: "n2::n2::n1::n3::n0ღA", event: "event1", to: "n2::n2::n1::n3::n1ღB", action: aF["logAtoB"] },
    { from: "n2::n2::n1::n3::n0ღA", event: "event2", to: "n2::n2::n1::n3::n2ღC", action: aF["logAtoC"] },
    { from: "n2::n2::n1::n3::n1ღB", event: "event2", to: "n2::n2::n1::n3::n3ღD", action: aF["logBtoD"] },
    { from: "n2::n2::n1::n3::n2ღC", event: "event1", to: "n2::n2::n1::n3::n3ღD", action: aF["logCtoD"] },
    {
      from: "n2::n2::n1::n3::n3ღD",
      event: "",
      guards: [{ predicate: guards["shouldReturnToA"], to: "n2::n2::n1::n3::n0ღA", action: aF["logDtoA"] }],
    },
    { from: "n2::n2::n1::n3ღGroup 4", event: "init", to: "n2::n2::n1::n3::n0ღA", action: aF["ACTION_IDENTITY"] },
  ];

  return transitions;
}

export { events, states, getKinglyTransitions };
