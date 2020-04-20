const parser = require('fast-xml-parser');
const {YED_DEEP_HISTORY_STATE, YED_SHALLOW_HISTORY_STATE, YED_ENTRY_STATE, SEP, DEFAULT_ACTION_FACTORY_STR,DEFAULT_ACTION_FACTORY} = require('./properties');
const {historyState, SHALLOW, DEEP, fsmContracts, createStateMachine} = require("kingly");
const { mapOverObj } = require('fp-rosetree');

function T() { return true}

// Error handling
function tryCatchFactory(errors) {
  // @side-effect: we modify errors in place
  return function tryCatch(fn, errCb) {
    return function tryCatch(...args) {
      try {return fn.apply(fn, args);}
      catch (e) {
        return errCb(e, errors, args);
      }
    };
  }
}

class Yed2KinglyConversionError extends Error {
  constructor(m) {
    super(m);
    this.errors = m;
    this.message = m.map(({ when, location, info, message }) => {
      // formatted message
      const fm = `At ${location}: ${when} => ${message}`;
      console.info(fm, info);
      console.error(m);
      return fm
    }).concat([`See extra info in console`]).join('\n');
  }
}

function handleAggregateEdgesPerFromEventKeyErrors(e, errors, [hashMap, yedEdge]) {
  errors.push({
    when: `building (from, event) hashmap`,
    location: `computeTransitionsAndStatesFromXmlString > aggregateEdgesPerFromEventKey`,
    info: { hashMap: JSON.parse(JSON.stringify(hashMap)), yedEdge },
    message: e.message,
    possibleCauses: [
      `File is not a valid graphML file`,
      `File is not a valid yed-generated graphML file`,
      `You found a bug in yed2Kindly converter`,
      // `You found a bug in fast-xml=parser (unlikely)`,
    ],
    original: e
  });

  return {}
}

function handleParseGraphMlStringErrors(e, errors, [yedString]) {
  errors.push({
      when: `parsing the graphml string`,
      location: `computeTransitionsAndStatesFromXmlString > parser.parse`,
      info: { yedString },
      possibleCauses: [
        `File is not an XML file`,
        `File is not a graphML file`,
        `File is not a yed-generated graphML file`,
        // `File was read incorrectly from disk`,
        // `You found a bug in fast-xml=parser (unlikely)`,
        // `You found a bug in yed2Kindly converter (maybe)`,
      ],
      message: e.message,
      original: e
    }
  );

  return {}
}

// Predicates
function isCompoundState(graphObj) {
  return graphObj['@_yfiles.foldertype'] === 'group'
}

function isGraphRoot(graphObj) {
  return 'key' in graphObj
}

function isInitialTransition(yedFrom, userFrom) {
  return userFrom === YED_ENTRY_STATE
}

function isTopLevelInitTransition(yedFrom, userFrom) {
  // yEd internal naming is nX::Ny::... so a top-level node will be just nX
  return isInitialTransition(yedFrom, userFrom) && yedFrom.split('::').length === 1
}

function isHistoryDestinationState(stateYed2KinglyMap, yedTo) {
  const x = stateYed2KinglyMap[yedTo].trim();
  return x === YED_SHALLOW_HISTORY_STATE || x === YED_DEEP_HISTORY_STATE
}

function isDeepHistoryDestinationState(stateYed2KinglyMap, yedTo) {
  const x = stateYed2KinglyMap[yedTo].trim();
  return isHistoryDestinationState(stateYed2KinglyMap, yedTo) && x === YED_DEEP_HISTORY_STATE
}

// Conversion helpers
// iff no predicate, and only one transition in array
function isSimplifiableSyntax(arrGuardsTargetActions) {
  return arrGuardsTargetActions.length === 1 && !arrGuardsTargetActions[0].predicate
}

function getYedParentNode(yedFrom) {
  return yedFrom.split('::').slice(0, -1).join('::')
}

function yedState2KinglyState(stateYed2KinglyMap, yedState) {
  return [yedState, stateYed2KinglyMap[yedState]].join(SEP);
}

function computeKinglyDestinationState(stateYed2KinglyMap, yedTo) {
  if (isHistoryDestinationState(stateYed2KinglyMap, yedTo)) {
    return isDeepHistoryDestinationState(stateYed2KinglyMap, yedTo)
      ? historyState(DEEP, yedState2KinglyState(stateYed2KinglyMap, getYedParentNode(yedTo)))
      : historyState(SHALLOW, yedState2KinglyState(stateYed2KinglyMap, getYedParentNode(yedTo)))

  }
  else {
    return yedState2KinglyState(stateYed2KinglyMap, yedTo);
  }
}

function mapActionFactoryStrToActionFactoryFn(actionFactories, actionFactoryStr) {
  return actionFactoryStr === DEFAULT_ACTION_FACTORY_STR
    ? DEFAULT_ACTION_FACTORY
    : actionFactories[actionFactoryStr]
}

function mapGuardStrToGuardFn(guards, predicateStr) {
  return guards[predicateStr] || T
}

function markFunctionStr(_, str){
  return ["", "", "", str, "", "", ""].join(SEP)
}

function markFunctionNoop(_, str){
  return () => ({outputs: [], updates: []})
}

function markGuardNoop(_, str){
  return () => true
}

function contains(as, bs){
  // returns true if every a in as can be found in bs
  return as.every(a => bs.indexOf(a) > -1)
}

// Parsing
function parseGraphMlString(yedString) {
  // true as third param validates the xml string prior to parsing, possibly throws
  // cf. https://github.com/NaturalIntelligence/fast-xml-parser#xml-to-json
  // Validator returns the following object in case of error;
  // {
  //   err: {
  //     code: code,
  //       msg: message,
  //       line: lineNumber,
  //   },
  // };
  const jsonObj = parser.parse(yedString, { ignoreAttributes: false }, true);
  if (!jsonObj.graphml) throw `Not a graphml file? Could not find a <graphml> tag!`

  return jsonObj
}

// Test helpers
function isFunction(obj) {
  return typeof obj === 'function'
}

function isPOJO(obj) {
  const proto = Object.prototype;
  const gpo = Object.getPrototypeOf;

  if (obj === null || typeof obj !== "object") {
    return false;
  }
  return gpo(obj) === proto;
}

function formatResult(result) {
  if (!isPOJO(result)) {
    return result
  }
  else {
    return mapOverObj({
        key: x => x,
        leafValue: prop => isFunction(prop)
          ? (prop.name || prop.displayName || 'anonymous')
          : Array.isArray(prop)
            ? prop.map(formatResult)
            : prop
      },
      result)
  }
}

const fakeConsole = {
  log: () => {},
  error: () => {},
  warn: () => {},
  info: () => {},
  debug: () => {},
};

function checkKinglyContracts(states, events, transitions) {
  try {
    return createStateMachine({
      initialExtendedState: void 0,
      events,
      states,
      transitions,
      updateState: () => {
      },
    }, {debug: {console: fakeConsole, checkContracts: fsmContracts}});
  }
  catch (err) {
    console.error(err)
    return null
  }
}

// https://stackoverflow.com/questions/12303989/cartesian-product-of-multiple-arrays-in-javascript
// let output = cartesian([1,2],[10,20],[100,200,300]);
// This is the output of that command:
//
//   ```
// [ [ 1, 10, 100 ],
//   [ 1, 10, 200 ],
//   [ 1, 10, 300 ],
//   [ 1, 20, 100 ],
//   [ 1, 20, 200 ],
//   [ 1, 20, 300 ],
//   [ 2, 10, 100 ],
//   [ 2, 10, 200 ],
//   [ 2, 10, 300 ],
//   [ 2, 20, 100 ],
//   [ 2, 20, 200 ],
//   [ 2, 20, 300 ] ]
// ```
const f = (a, b) => [].concat(...a.map(d => b.map(e => [].concat(d, e))));
const cartesian = (a, b, ...c) => (b ? cartesian(f(a, b), ...c) : a);

module.exports = {
  T,
  tryCatchFactory,
  Yed2KinglyConversionError,
  handleAggregateEdgesPerFromEventKeyErrors,
  handleParseGraphMlStringErrors,
  isCompoundState,
  isGraphRoot,
  isInitialTransition,
  isTopLevelInitTransition,
  isSimplifiableSyntax,
  getYedParentNode,
  yedState2KinglyState,
  computeKinglyDestinationState,
  mapActionFactoryStrToActionFactoryFn,
  mapGuardStrToGuardFn,
  parseGraphMlString,
  formatResult,
  cartesian,
  markFunctionStr,
  markFunctionNoop,
  markGuardNoop,
  checkKinglyContracts,
  fakeConsole,
  contains,
}
