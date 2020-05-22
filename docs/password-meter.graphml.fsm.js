// Copy-paste help
// For debugging purposes, guards and actions functions should all have a name
// Using natural language sentences for labels in the graph is valid
// guard and action functions name still follow JavaScript rules though
// -----Guards------
// const guards = {
//   "!letter and numbers?": function (){},
//   "letter and numbers?": function (){},
// };
// -----Actions------
// const actions = {
//   "display initial screen": function (){},
//   "display weak password screen": function (){},
//   "display strong password screen": function (){},
//   "display password submitted screen": function (){},
// };
// ----------------
function contains(as, bs) {
  return as.every(function (a) {
    return bs.indexOf(a) > -1;
  });
}
var NO_OUTPUT = [];
var NO_STATE_UPDATE = [];
var events = ["navigated to url", "typed", "clicked submit"];
var states = { n1ღdone: "", n2ღstrong: "", n3ღweak: "" };
function getKinglyTransitions(record) {
  var aF = record.actionFactories;
  var guards = record.guards;
  var actionList = [
    "display initial screen",
    "display weak password screen",
    "display strong password screen",
    "display password submitted screen",
  ];
  var predicateList = ["!letter and numbers?", "letter and numbers?"];
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
    { from: "nok", event: "init", to: "n3ღweak", action: aF["display initial screen"] },
    {
      from: "n3ღweak",
      event: "typed",
      guards: [
        { predicate: guards["!letter and numbers?"], to: "n3ღweak", action: aF["display weak password screen"] },
        { predicate: guards["letter and numbers?"], to: "n2ღstrong", action: aF["display strong password screen"] },
      ],
    },
    {
      from: "n2ღstrong",
      event: "typed",
      guards: [
        { predicate: guards["letter and numbers?"], to: "n2ღstrong", action: aF["display strong password screen"] },
        { predicate: guards["!letter and numbers?"], to: "n3ღweak", action: aF["display weak password screen"] },
      ],
    },
    { from: "n2ღstrong", event: "clicked submit", to: "n1ღdone", action: aF["display password submitted screen"] },
  ];

  return transitions;
}

export { events, states, getKinglyTransitions };
