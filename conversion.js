const {INIT_STATE, INIT_EVENT} = require('kingly');
const {mapOverTree} = require('fp-rosetree');
const {lensPath, view, mergeAll, concat, forEachObjIndexed, find} = require('ramda');
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
    const atomicStateName = view(lensPath(['y:ShapeNode', 'y:NodeLabel', '#text']), graphData)
    return [yedNodeId, atomicStateName]
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

// NTH: implement rules
// Only ever one [x]
function parseYedLabel(yedEdgeLabel) {
  if (yedEdgeLabel && yedEdgeLabel.split('/').length > 2){
    throw `parseYedLabel > You used ${yedEdgeLabel} as edge label. There can only be one / to avoid misunderstandings.`
  }

  // Label as in yEd i.e. `x [y] / z` string, with x, y, z all optionals
  // Also: z is a string representing a function, but not a function
  const yedEdgeLabelRegExp = /\[(.*)\]/;
  const expressionList = yedEdgeLabel ? yedEdgeLabel.split(yedEdgeLabelRegExp) : [` / `];

  // Possible cases:
  // x [y] / z: expressionList.length === 3
  // x [y]    : expressionList.length === 3
  // [y] / z  : expressionList.length === 3
  // - also covers empty `y` and empty `z`
  // x / z    : expressionList.length === 1
  // x        : expressionList.length === 1
  // / z      : expressionList.length === 1
  // nil      : expressionList.length === 1
  const _actionFactory = (expressionList.length === 3
      ? (expressionList[2] && expressionList[2].split('/')[1])|| ""
      : expressionList[0].split('/')[1] || ""
  ).trim();
  if (_actionFactory === DEFAULT_ACTION_FACTORY_STR) {
    throw `parseYedLabel > You cannot use ${DEFAULT_ACTION_FACTORY_STR} as action!`
  }
  const actionFactory = _actionFactory || DEFAULT_ACTION_FACTORY_STR;

  // Reminder: eventless means !event is truthy so "" is ok
  const event = (expressionList.length === 3
      ? (expressionList[0] && expressionList[0].trim()) || ''
      : expressionList[0].split('/')[0] || ''
  ).trim();
  const guard = (expressionList.length === 3 ? (expressionList[1] && expressionList[1].trim()) || '' : '').trim();

  if ([actionFactory, event, guard].some(str => str.includes(SEP))){
    throw `parseYedLabel > You used ${yedEdgeLabel} as edge label. You cannot use the character ${SEP} in a label!`
  }
  return {actionFactory, event, guard}
}

function aggregateEdgesPerFromEventKey({edges: hashMap, events}, yedEdge) {
  const from = view(lensPath(['@_source']), yedEdge).trim();
  const to = view(lensPath(['@_target']), yedEdge).trim();
  const yedEdgeLabel = getYedEdgeLabel(yedEdge);
  const {actionFactory, event, guard} = parseYedLabel(yedEdgeLabel);
  const fromEventKey = [from, event].join(SEP);

  hashMap[fromEventKey] = hashMap[fromEventKey] || [];
  hashMap[fromEventKey] = hashMap[fromEventKey].concat([
    {predicate: guard.trim(), to: to.trim(), actionFactory: actionFactory.trim()},
  ]);

  return {edges: hashMap, events: event ? events.add(event) : events};
}

/**
 * @modifies {errors}
 * @param {Array} errors
 * @param actionFactories
 * @param guards
 * @param edges
 * @returns {Array} Array contains found errors, empty is no error found
 */
function checkForMissingFunctions(errors, {actionFactories, guards}, edges) {
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
      const {predicate: _predicateStr, to: yedTo, actionFactory: _actionFactoryStr} = guardsTargetActionRecord;
      const predicateStr = _predicateStr.trim();
      const actionFactoryStr = _actionFactoryStr.trim();
      // We do not check that it is a function here to allow a string for testing purposes
      const isGuardPassed = !predicateStr || guards && guards[predicateStr];
      const isActionPassed = !actionFactoryStr || actionFactories[actionFactoryStr];

      if (!isValidStateName(yedTo)) errors.push({
        when: `Checking that the name of the states figuring in the graph are valid`,
        location: `checkForMissingFunctions > getKinglyTransitions`,
        message: `Yed graph file mentions an invalid state |${yedTo}|!`,
        info: {state: yedTo}
      });
      if (!isGuardPassed) errors.push({
        when: `Checking that the transitions figuring in the graph can be mapped to functions implementing them`,
        location: `checkForMissingFunctions > getKinglyTransitions`,
        message: `Yed graph file mentions a guard named |${predicateStr}|. I could not find the implementation of that guard in the parameter |guards| passed!`,
        info: {guards}
      })
      if (!isActionPassed) errors.push({
        when: `Checking that the transitions figuring in the graph can be mapped to functions implementing them`,
        location: `checkForMissingFunctions > getKinglyTransitions`,
        message: `Yed graph file mentions an action factory named |${actionFactoryStr}|. I could not find the implementation of that action factory in the parameter |actionFactories| passed!`,
        info: {actionFactories}
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

  // Previously computed edges is traversed and converted into Kingly transitions
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
