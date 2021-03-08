const {INIT_STATE, INIT_EVENT} = require('kingly');
const {mapOverTree} = require('fp-rosetree');
const {lensPath, view, mergeAll, concat, forEachObjIndexed, find, difference} = require('ramda');
const nearley = require("nearley");
const prettyFormat = require("pretty-format");
const yedEdgeLabelGrammar = require("./yedEdgeLabelGrammar.js");
const {
  handleAggregateEdgesPerFromEventKeyErrors,
  T,
  tryCatchFactory,
  Yed2KinglyConversionError,
  handleParseGraphMlStringErrors,
  isCompoundState,
  isInitialTransition,
  isSimplifiableSyntax,
  isTopLevelInitTransition,
  getYedParentNode,
  computeKinglyDestinationState,
  mapActionFactoryStrToActionFactoryFn: defaultMapActionFactoryStrToActionFactoryFn,
  mapGuardStrToGuardFn: defaultMapGuardStrToGuardFn,
  yedState2KinglyState,
  parseGraphMlString,
  markFunctionStr,
  markFunctionNoop,
  markGuardNoop,
  trimInside,
} = require('./helpers');
const {DEFAULT_ACTION_FACTORY_STR, SEP, YED_ENTRY_STATE} = require('./properties');

// Lenses for traversing the syntax tree
// Note: that could be easier with a xpath query maybe?
const getYedEdgeLabel = edgeML => {
  const data = Array.isArray(edgeML.data) ? edgeML.data : [edgeML.data];
  const d10Record = data.find(d => d['@_key'] === 'd10');
  return view(lensPath(['y:PolyLineEdge', 'y:EdgeLabel', '#text']), d10Record);
};
const getLabel = (graphObj) => {
  const graphData = graphObj.data;
  const yedNodeId = graphObj['@_id'];

  // Edge case: top-level of the graph has no id
  if (!yedNodeId) return [,];

  const d6Key = Array.isArray(graphData)
    ? find(keyRow => keyRow ['@_key'] === 'd6', graphData)
    : graphData['@_key'] === 'd6' ? graphData : null

  if (typeof d6Key === 'undefined') return [yedNodeId, ""]

  if (isCompoundState(graphObj)) {
    const _groupNodes = view(lensPath(['y:ProxyAutoBoundsNode', 'y:Realizers', 'y:GroupNode']), d6Key);
    const groupNodes = Array.isArray(_groupNodes) ? _groupNodes : [_groupNodes];
    const groupNode = find(row => {
      return view(lensPath(['y:State', '@_closed']), row) === 'false'
    }, groupNodes);
    const groupName = view(lensPath(['y:NodeLabel', '#text']), groupNode);
    return [yedNodeId, groupName]
  }
  else {
    // console.error (`getYedEdgeLabel > not compound state`, graphObj)
    const atomicStateName = view(lensPath(['y:ShapeNode', 'y:NodeLabel', '#text']), graphData) || view(lensPath(['y:GenericNode', 'y:NodeLabel', '#text']), graphData);
    if (!atomicStateName) throw `getYedEdgeLabel > Error while parsing Yed file. Trying to read the name of an atomic state and found none. This may due to the location of the label having changed or being in a new location. For now, we find them under ShapeNode or GenericNode. Please check the file. Graph context: ${prettyFormat(graphObj)} `

    return [yedNodeId, trimInside(atomicStateName)]
  }
};
const getChildren = graphObj => (graphObj.graph ? graphObj.graph.node : []);
const constructStateHierarchy = (label, children) => {
  const [yedLabel, stateLabel] = label;
  const _label = label.join(SEP);
  const isAtomicState = children => children && children.length === 0;
  const isHistoryState = stateLabel => (stateLabel === "H" || stateLabel === "H*");

  return stateLabel === YED_ENTRY_STATE
    ? {}
    : isAtomicState(children)
      ? isHistoryState(stateLabel)
        ? {}
        : {[_label]: ''}
      : {[_label]: mergeAll(children)};
};
const constructStateYed2KinglyMap = (label, children) => {
  const [yedLabel, stateLabel] = label;
  const newMap = yedLabel === void 0 ? {} : {[label[0]]: label[1]};

  return mergeAll(concat(children, [newMap]));
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

/**
 *
 * @param {String} _yedEdgeLabel cf. grammar.
 * @returns {{actionFactory: Array, event: String, guard: Array}[]} `actionFactory` and `guard` are arrays of action strings. For instance, "... / do this, do that" => actionFactory = ["do this", "do that"]
 */
function parseYedLabel(_yedEdgeLabel) {
// Parser for parsing edge labels
  // It is a stateful object, so needs to be recreated every time
  const parser = new nearley.Parser(nearley.Grammar.fromCompiled(yedEdgeLabelGrammar));

  const yedEdgeLabel = _yedEdgeLabel && trimInside(_yedEdgeLabel).trim() || "";
  try{parser.feed(yedEdgeLabel);} catch(e) {
    console.error(e);
    throw new Error(`parseYedLabel > parser.feed: String "${yedEdgeLabel}" fails parsing. \nPlease review the syntax rules for edge labels. \ncf. ttps://brucou.github.io/documentation/v1/tooling/graph_editing.html#Rules`)
  }

  // Two cases from the grammar:
  // 1. multi-transitions label
  // 2. mono-transition label
  let arrTransitions = [];
  const results = parser.results[0];
  // console.warn(`results`, results)
  if (Array.isArray(results)){
    arrTransitions = arrTransitions.concat(results);
  }
  else {
    if (results){
      arrTransitions.push(results);
    }
    else {
      arrTransitions.push({event: "", guard: [], actions: []});
    }
  }

  return arrTransitions.map(transitionRecord => {
    // console.warn(`transitionRecord `, transitionRecord)
    const {event, guard, actions} = transitionRecord;

    return {
      actionFactory: actions.map(action => action.trim()),
      event: event.trim(),
      guard: guard.map(guard => guard.trim())
    }
  })
}

function aggregateEdgesPerFromEventKey(acc, yedEdge) {
  const {edges: hashMap, events} = acc;
  const from = view(lensPath(['@_source']), yedEdge).trim();
  const to = view(lensPath(['@_target']), yedEdge).trim();
  const yedEdgeLabel = getYedEdgeLabel(yedEdge);

  const  transitionsRecords = parseYedLabel(yedEdgeLabel);
  transitionsRecords.forEach(transitionsRecord => {
    const {actionFactory, event, guard} = transitionsRecord;
    const fromEventKey = [from, event].join(SEP);

    hashMap[fromEventKey] = hashMap[fromEventKey] || [];
    hashMap[fromEventKey] = hashMap[fromEventKey].concat([
      {predicate: guard.map(g => g.trim()), to: to.trim(), actionFactory: actionFactory.map(af => af.trim())},
    ]);
    if (event) events.add(event)
  });

  return {edges: hashMap, events};
}

/**
 * @modifies {errors}
 * @param {Array} errors
 * @param actionFactories actions passed by the API user
 * @param guards guards passed by the API user
 * @param Array<{{arrGuardsTargetActions, fromEventKey}}> edges
 * @returns {Array} Array contains found errors, empty is no error found
 */
function checkForMissingFunctions(errors, {actionFactories, guards}, edges) {
  // TODO: that could be refactored with applicative validation?
  forEachObjIndexed((arrGuardsTargetActions, fromEventKey) => {
    const [yedFrom, _event] = fromEventKey.split(SEP);
    // Anything but empty string is a valid state name
    const isValidStateName = Boolean;
    // For now events can be empty string or non-empty strings so always valid
    const isValidEvent = T;

    if (!isValidStateName(yedFrom)) errors.push({
      when: `Checking that the name of the states figuring in the graph are valid`,
      location: `checkForMissingFunctions > getKinglyTransitions`,
      message: `Yed graph file mentions an invalid state |${yedFrom}|!`,
      info: {state: yedFrom}
    });
    if (!isValidEvent(_event)) errors.push({
      when: `Checking that the events figuring in the graph are valid`,
      location: `checkForMissingFunctions > getKinglyTransitions`,
      message: `Yed graph file mentions an invalid event |${_event}|!`,
      info: {_event: _event}
    });

    arrGuardsTargetActions.every(guardsTargetActionRecord => {
      // We do not check that guards and actions are functions, we want to allow for strings
      const {predicate: _predicateList, to: yedTo, actionFactory: _actionFactoryList} = guardsTargetActionRecord;
      const providedGuards = Object.keys(guards);
      const expectedGuards = _predicateList.map(p => p.trim());
      const providedActions = Object.keys(actionFactories);
      const expectedActions = _actionFactoryList.map(af => af.trim());
      const notNeededGuards = difference(providedGuards, expectedGuards);
      const missingGuards = difference(expectedGuards, providedGuards);
      const notNeededActions = difference(providedActions, expectedActions);
      const missingActions = difference(expectedActions, providedActions);

      if (!isValidStateName(yedTo)) errors.push({
        when: `Checking that the name of the states figuring in the graph are valid`,
        location: `checkForMissingFunctions > getKinglyTransitions`,
        message: `Yed graph file mentions an invalid state |${yedTo}|!`,
        info: {state: yedTo}
      });
      if (notNeededGuards.length>0) errors.push({
        when: `Checking that the transitions figuring in the graph can be mapped to functions implementing them`,
        location: `checkForMissingFunctions > getKinglyTransitions`,
        message: `I found guards passed as parameters that do not match to a guard in the yed graph! Please remove them!`,
        info: {notNeededGuards, guards, expectedGuards}
      })
      if (missingGuards.length>0) errors.push({
        when: `Checking that the transitions figuring in the graph can be mapped to functions implementing them`,
        location: `checkForMissingFunctions > getKinglyTransitions`,
        message: `I found guards in the yed graph that cannot be matched to a JavaScript function! Please review the JavaScript guards that you passed.`,
        info: {missingGuards, guards, expectedGuards}
      })
      if (notNeededActions.length>0) errors.push({
        when: `Checking that the transitions figuring in the graph can be mapped to functions implementing them`,
        location: `checkForMissingFunctions > getKinglyTransitions`,
        message: `I found actions passed as parameters that do not match to an action in the yed graph! Please remove them!`,
        info: {notNeededActions, actionFactories, expectedActions}
      })
      if (missingActions.length>0) errors.push({
        when: `Checking that the transitions figuring in the graph can be mapped to functions implementing them`,
        location: `checkForMissingFunctions > getKinglyTransitions`,
        message: `I found actions in the yed graph that cannot be matched to a JavaScript function! Please review the JavaScript actions that you passed.`,
        info: {missingActions, actionFactories, expectedActions}
      })
    });
  }, edges);

  return errors
}

function computeKinglyTransitionsFactory(stateYed2KinglyMap, edges, injected) {
  const mapActionFactoryStrToActionFactoryFn =
    injected && injected.mapActionFactoryStrToActionFactoryFn
    || defaultMapActionFactoryStrToActionFactoryFn;
  const mapGuardStrToGuardFn =
    injected && injected.mapGuardStrToGuardFn
    || defaultMapGuardStrToGuardFn;

  // Transitions are computed by means of a function in which the mapping
  // between actions and guards strings and the respective JavaScript functions
  // is injected
  return function getKinglyTransitions({actionFactories, guards}) {
    let errors = [];
    errors = checkForMissingFunctions(errors, {actionFactories, guards}, edges);

    let transitions = [];
    forEachObjIndexed((arrGuardsTargetActions, fromEventKey) => {
      // console.warn(`arrGuardsTargetActions`, arrGuardsTargetActions)
      // Example:
      // yedFrom: "n0::n0" ; userFrom: "entered by user" ; _from: "n0::n0[symbol]entered by user"
      const [yedFrom, _event] = fromEventKey.split(SEP);
      const _from = yedState2KinglyState(stateYed2KinglyMap, yedFrom);
      const userFrom = stateYed2KinglyMap[yedFrom];
      let from = _from;
      let event = _event;

      // Case: init transition
      if (isInitialTransition(yedFrom, userFrom)) {
        // rule <- No event allowed on initial states
        // Not an unrecoverable error, as the event will be ignored
        if (event.trim()){
          errors.push({message: `getKinglyTransitions > No event allowed on initial states`})
        }
        //   Case: top-level init transition
        if (isTopLevelInitTransition(yedFrom, userFrom)) {
          from = INIT_STATE;
          event = INIT_EVENT;
        } else {
          //   Case: non-top-level, i.e. compound state's init transition
          // -> there is a parent to the origin node, that's the compound node we want
          const fromParent = getYedParentNode(yedFrom);
          from = [fromParent, stateYed2KinglyMap[fromParent]].join(SEP);
          event = INIT_EVENT;
        }
      }

      if (isSimplifiableSyntax(arrGuardsTargetActions)) {
        const {to: yedTo, actionFactory: actionFactoryStr} = arrGuardsTargetActions[0];

        transitions.push({
          from,
          event,
          to: computeKinglyDestinationState(stateYed2KinglyMap, yedTo),
          action: mapActionFactoryStrToActionFactoryFn(actionFactories, actionFactoryStr),
        });
      } else {
        transitions.push({
          from,
          event,
          guards: arrGuardsTargetActions.map(guardsTargetActionRecord => {
            const {predicate: predicateStr, to: yedTo, actionFactory: actionFactoryStr}
              = guardsTargetActionRecord;

            return {
              predicate: mapGuardStrToGuardFn(guards, predicateStr),
              to: computeKinglyDestinationState(stateYed2KinglyMap, yedTo),
              action: mapActionFactoryStrToActionFactoryFn(actionFactories, actionFactoryStr),
            };
          }),
        });
      }
    }, edges);

    return {errors, transitions};
  };
}

function computeTransitionsAndStatesFromXmlString(yedString) {
  // Building the error accumulation capability
  // Could thread this with applicative functors but keeping it simple and plain
  let _errors = [];
  const tryCatch = tryCatchFactory(_errors);

  // Parse the xml string and traverse the xml tree to compute the state hierarchy.
  // Kingly's state names will be made unique with concatenating yed node's name and user-given's
  // node name. The name's unicity comes from yed naming including hierarchy information,
  // e.g. n0::n0::n3 is a node two levels deep.
  // As transitions in the .graphml file only use the yed node's name, we also keep a mapping of
  // the correspondence between how yed labels node vs. how the user does
  // Then we convert the transitions in the graphml, taking care of specific cases:
  // - initial transitions
  //   - yed: node with label YED_ENTRY_STATE
  // - history pseudo-states
  //   - yed: node with label YED_SHALLOW_HISTORY_STATE or YED_DEEP_HISTORY_STATE
  const {graphml: graphObj} = tryCatch(parseGraphMlString, handleParseGraphMlStringErrors)(yedString);
  if (_errors.length > 0) throw new Yed2KinglyConversionError(_errors);

  const stateHierarchy = mapOverTree(stateHierarchyLens, x => x, graphObj)[SEP];
  const stateYed2KinglyMap = mapOverTree(stateYed2KinglyLens, x => x, graphObj);
  const yedEdges = graphObj.graph.edge;

  // Kingly only admits one transition record per (from, event) couple
  // Additionally, when there is no guard to check, a simplified transition format can be used
  // i.e. {from, event, to, actionFactory}
  // otherwise standard format: {from, event, guards : [{predicate, to, actionFactory}]} is used
  // To prepare for deriving transitions, we use a hashmap which conflates all matching transitions
  // in an array:
  // edges ~~ {[from<|>event]: [...]}
  const {edges, events} = yedEdges.reduce(
    tryCatch(aggregateEdgesPerFromEventKey, handleAggregateEdgesPerFromEventKeyErrors),
    {edges: {}, events: new Set()}
  );
  if (_errors.length > 0) throw new Yed2KinglyConversionError(_errors);

  // Previously computed edges are traversed and converted into Kingly transitions
  // 1. transitions with guards and actions assigned to their identifier
  const transitionsWithoutGuardsActions = computeKinglyTransitionsFactory(
    stateYed2KinglyMap,
    edges,
    {mapActionFactoryStrToActionFactoryFn: markFunctionStr, mapGuardStrToGuardFn: markFunctionStr}
  )({actionFactories: {}, guards: {}}).transitions;

  // 2. transitions with guards and actions assigned to a noop function
  const transitionsWithFakeGuardsActions = computeKinglyTransitionsFactory(
    stateYed2KinglyMap,
    edges,
    {mapActionFactoryStrToActionFactoryFn: markFunctionNoop, mapGuardStrToGuardFn: markGuardNoop}
  )({actionFactories: {}, guards: {}}).transitions;

  // 3. Factory to get the real transitions from the real actions and guards
  const getKinglyTransitions = computeKinglyTransitionsFactory(stateYed2KinglyMap, edges);

  return {
    states: stateHierarchy,
    stateYed2KinglyMap,
    edges,
    events: Array.from(events),
    transitionsWithoutGuardsActions,
    transitionsWithFakeGuardsActions,
    getKinglyTransitions,
    computeKinglyTransitionsFactory,
    errors: _errors,
  };
}

module.exports = {
  computeTransitionsAndStatesFromXmlString,
};
