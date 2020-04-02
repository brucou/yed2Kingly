const { ACTION_IDENTITY, INIT_STATE, INIT_EVENT, historyState, SHALLOW, DEEP } = require('kingly')
const parser = require('fast-xml-parser');
const { mapOverTree } = require('fp-rosetree');
const { lensPath, view, mergeAll, concat, forEachObjIndexed } = require('ramda');
const STATE_LABEL_SEP = 'ღ';
const YED_LABEL_DECODE_SEP = 'ღ';
const DEFAULT_ACTION_FACTORY_STR = 'ACTION_IDENTITY';
const DEFAULT_ACTION_FACTORY = ACTION_IDENTITY;
const YED_ENTRY_STATE = 'init';
const YED_SHALLOW_HISTORY_STATE = "H";
const YED_DEEP_HISTORY_STATE = "H*";

function T() { return true}

function isCompoundState(graphObj) {
  return graphObj['@_yfiles.foldertype'] === 'group'
}

function isGraphRoot(graphObj) {
  return 'key' in graphObj
}

function getYedParentNode(yedFrom) {
  return yedFrom.split('::').slice(0, -1).join('::')
}

function yedStatetoKinglyState(stateYed2KinglyMap, yedState) {
  return [yedState, stateYed2KinglyMap[yedState]].join(STATE_LABEL_SEP);
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

function computeKinglyDestinationState(stateYed2KinglyMap, yedTo) {
  // History states are states which user named H (shallow) or H* (deep)
  if (isHistoryDestinationState(stateYed2KinglyMap, yedTo)) {
    return isDeepHistoryDestinationState(stateYed2KinglyMap, yedTo)
      ? historyState(DEEP, yedStatetoKinglyState(stateYed2KinglyMap, getYedParentNode(yedTo)))
      : historyState(SHALLOW, yedStatetoKinglyState(stateYed2KinglyMap, getYedParentNode(yedTo)))

  }
  else {
    return yedStatetoKinglyState(stateYed2KinglyMap, yedTo);
  }
}

function computeTransitionsAndStatesFromXmlString(yedString) {
  const atomicStateLens = lensPath(['y:ShapeNode', 'y:NodeLabel', '#text']);
  const compoundStateLens = lensPath(['y:ProxyAutoBoundsNode', 'y:Realizers', 'y:GroupNode', 'y:NodeLabel', '#text']);

  const getLabel = graphObj => {
    const graphData = graphObj.data;
    const lens = isCompoundState(graphObj) ? compoundStateLens : atomicStateLens;
    const dataKeys = Array.isArray(graphData)
      ? graphData.reduce((acc, dataItem) => {
        return Object.assign(acc, { [dataItem['@_key']]: view(lens, dataItem) })
      }, {})
      : graphData['@_key'] === 'd6'
        ? { d6: view(lens, graphData) }
        : {};
    const stateLabel = dataKeys.d6 || "";

    return [graphObj['@_id'], stateLabel]
  };
  const getChildren = graphObj => graphObj.graph ? graphObj.graph.node : [];
  const constructStateHierarchy = (label, children) => {
    const [yedLabel, stateLabel] = label;
    const _label = label.join(STATE_LABEL_SEP);

    return stateLabel === YED_ENTRY_STATE
      ? {}
      : children && children.length === 0
        ? { [_label]: "" }
        : { [_label]: mergeAll(children) }
  };
  const constructStateYed2KinglyMap = (label, children) => {
    const [yedLabel, stateLabel] = label;
    const newMap = yedLabel === void 0
      ? {}
      : { [label[0]]: label[1] }

    return mergeAll(concat(children, [newMap]))
  };
  const stateHierarchyLens = {
    getLabel,
    getChildren,
    constructTree: constructStateHierarchy,
  };
  const stateYed2KinglyLens = {
    getLabel,
    getChildren,
    constructTree: constructStateYed2KinglyMap,
  };
  const { graphml: graphObj } = parser.parse(yedString, { ignoreAttributes: false });
  const stateHierarchy = mapOverTree(stateHierarchyLens, x => x, graphObj)[STATE_LABEL_SEP];
  const stateYed2KinglyMap = mapOverTree(stateYed2KinglyLens, x => x, graphObj);

// Compute the transitions (Kingly format) now
  const edgeOriginStateLens = lensPath(['@_source']);
  const edgeTargetStateLens = lensPath(['@_target']);
  const edgeMlLabelLens = lensPath(['y:PolyLineEdge', 'y:EdgeLabel', '#text'])
  const getEdgeMlLabel = edgeML => {
    const data = Array.isArray(edgeML.data) ? edgeML.data : [edgeML.data];
    const d10Record = data.find(d => d['@_key'] === 'd10');
    return view(edgeMlLabelLens, d10Record) || "";
  };
  const edgesML = graphObj.graph.edge;

// `edges` is an intermediate computation to derive the transitions in Kingly format
// Kingly only admits one transition record per (from, event) couple
// Additionally, when there is no guard to check, a simplified transition format can be used
// i.e. {from, event, to, actionFactory}
// else standard format: {from, event, guards : [{predicate, to, actionFactory}]}
// To prepare for deriving transitions, we use a hashmap which conflates all matching transitions
// in an array
// : `from` and `event` are string so need for a ES6 Map here, ES3 objects suffice
  const edges = edgesML.reduce((biHashMap, edgeML) => {
    const from = view(edgeOriginStateLens, edgeML).trim();
    const to = view(edgeTargetStateLens, edgeML).trim();
    // Label as in yEd i.e. `x [y] / z` string, with x, y, z all optionals
    // Also: z is a string representing a function, but not a function
    const edgeMlLabel = getEdgeMlLabel(edgeML);
    const yedLabelRegExp = /\[(.*)\]/;
    const expressionList = edgeMlLabel.split(yedLabelRegExp);

    // Possible cases:
    // x [y] / z: expressionList.length === 3
    // x [y]    : expressionList.length === 3
    // [y] / z  : expressionList.length === 3
    // - also covers empty `y` and empty `z`
    // x / z    : expressionList.length === 1
    // x        : expressionList.length === 1
    // / z      : expressionList.length === 1
    // nil      : expressionList.length === 1
    const actionFactory = (
      expressionList.length === 3
        ? expressionList[2] && expressionList[2].split('/')[1] || DEFAULT_ACTION_FACTORY_STR
        : expressionList[0].split('/')[1] || DEFAULT_ACTION_FACTORY_STR
    ).trim();

    // Reminder: eventless means !event is truthy so can be null, undefined or "" (or num<>0 -)
    const event = (
      expressionList.length === 3
        ? expressionList[0] && expressionList[0].trim() || ""
        : expressionList[0].split('/')[0] || ""
    ).trim();
    const guard = (
      expressionList.length === 3
        ? expressionList[1] && expressionList[1].trim() || ""
        : ""
    ).trim();
    const fromEventKey = [from, event].join(YED_LABEL_DECODE_SEP);

    biHashMap[fromEventKey] = biHashMap[fromEventKey] || [];
    biHashMap[fromEventKey] = biHashMap[fromEventKey].concat([
      { predicate: guard.trim(), to: to.trim(), actionFactory: actionFactory.trim() }
    ]);
    return biHashMap
  }, {});

// With `edges`, the right format is computed according to whether there
// is only one non-trivial guard in the transition or not
// TODO: also check that event, predicate etc. are strings nothing weird
  function getKinglyTransitions({ actionFactories, guards }) {
    let transitions = [];
    forEachObjIndexed((arrGuardsTargetActions, fromEventKey) => {
      // Example:
      // yedFrom: "n0::n0" ; userFrom: "entered by user" ; _from: "n0::n0[symbol]entered by user"
      const [yedFrom, _event] = fromEventKey.split(YED_LABEL_DECODE_SEP);
      const _from = yedStatetoKinglyState(stateYed2KinglyMap, yedFrom);
      const userFrom = stateYed2KinglyMap[yedFrom];
      let from = _from;
      let event = _event;

      // Case: init transition
      if (isInitialTransition(yedFrom, userFrom)) {
        //   Case: top-level init transition
        if (isTopLevelInitTransition(yedFrom, userFrom)) {
          from = INIT_STATE;
          event = INIT_EVENT;
        }
        //   Case: non-top-level, i.e. compound state's init transition
        // -> there is a parent to the origin node, that's the compound node we want
        else {
          const fromParent = getYedParentNode(yedFrom)
          from = [fromParent, stateYed2KinglyMap[fromParent]].join(STATE_LABEL_SEP)
          event = INIT_EVENT;
        }
      }

      // TODO: replace history states
      // TODO: some error control here to add
      // - actionStr cannt be found in actionFactories
      // - same for guards
      // TODOL deal with initial control state or maybe impose it to be passed? not possible
      // use initial transition
      // {from: INIT_STATE, event: INIT_EVENT, to: initialControlState, action: ACTION_IDENTITY}])
      // call it I if exists else pass it from outside? should be able to programtically find it?
      // TODO: init transitions start with the compound state not a specific named state

      // Case: simplifiable syntax, e.g. no predicate, and only one transition in array
      if (arrGuardsTargetActions.length === 1 && !arrGuardsTargetActions[0].predicate) {
        const { to: yedTo, actionFactory: actionFactoryStr } = arrGuardsTargetActions[0];

        transitions.push({
          from,
          event,
          to: computeKinglyDestinationState(stateYed2KinglyMap, yedTo),
          action: actionFactoryStr === DEFAULT_ACTION_FACTORY_STR
            ? DEFAULT_ACTION_FACTORY
            : actionFactories[actionFactoryStr]
        })
      }
      // Case: non-simplifiable syntax
      else {
        transitions.push({
          from,
          event,
          guards: arrGuardsTargetActions.map(arrGuardsTargetAction => {
            const { predicate: predicateStr, to: yedTo, actionFactory: actionFactoryStr } = arrGuardsTargetAction;
            return {
              predicate: guards[predicateStr] || T,
              to: computeKinglyDestinationState(stateYed2KinglyMap, yedTo),
              action: actionFactoryStr === DEFAULT_ACTION_FACTORY_STR
                ? DEFAULT_ACTION_FACTORY
                : actionFactories[actionFactoryStr]
            }
          })
        })
      }
    }, edges);

    return transitions
  }

  return {
    stateHierarchy, stateYed2KinglyMap, getKinglyTransitions
  }
}

// Lenses for traversing the syntax tree

module.exports = {
  computeTransitionsAndStatesFromXmlString
}

// const {errors, warnings} = validateEdge

// RULES:
// Only ever one [x]
// Only ever one /
// Never ever the SEP (heart symbol)
// yEd action cannot be named ACTION_IDENTITY and no such entry in actionFactories prop
// No event allowed on initial states (top-level or else)

// TODO left:
// - read parameters
// - read a graphml file
// - handle errors
//   - not graphml file or not found
//   - wrong kingly format (syntax)
//   - wrong kingly format (semantics)
//   - what else?
// - write a file
//   - probably PUG or liquid or ejs whatever template possible
//   - remember export transitions is a function, states too
