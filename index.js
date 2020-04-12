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
  mapActionFactoryStrToActionFactoryFn,
  mapGuardStrToGuardFn,
  yedState2KinglyState,
  parseGraphMlString,
} = require('./helpers');
const {DEFAULT_ACTION_FACTORY_STR, STATE_LABEL_SEP, YED_ENTRY_STATE, YED_LABEL_DECODE_SEP} = require('./properties');

// Lenses to access fields deep in xml json
const edgeOriginStateLens = lensPath(['@_source']);
const edgeTargetStateLens = lensPath(['@_target']);
const edgeMlLabelLens = lensPath(['y:PolyLineEdge', 'y:EdgeLabel', '#text']);
const atomicStateLens = lensPath(['y:ShapeNode', 'y:NodeLabel', '#text']);
const compoundStateLens = lensPath(['y:ProxyAutoBoundsNode', 'y:Realizers', 'y:GroupNode', 'y:NodeLabel', '#text']);
const getYedEdgeLabel = edgeML => {
  const data = Array.isArray(edgeML.data) ? edgeML.data : [edgeML.data];
  const d10Record = data.find(d => d['@_key'] === 'd10');
  return view(edgeMlLabelLens, d10Record);
};

// Lenses for traversing the syntax tree
// Note: that could be easier with a xpath query maybe?
const getLabel = (graphObj) => {
  const graphData = graphObj.data;
  const yedNodeId = graphObj['@_id'];
  const d6Key = Array.isArray(graphData)
    ? find(keyRow => keyRow ['@_key'] === 'd6', graphData)
    : graphData['@_key'] === 'd6' ? graphData : null

  if (typeof d6Key === 'undefined') return [yedNodeId, ""]

  if (isCompoundState(graphObj)) {
    const _groupNodes = view(lensPath(['y:ProxyAutoBoundsNode', 'y:Realizers', 'y:GroupNode']), d6Key);
    const groupNodes = Array.isArray(_groupNodes ) ? _groupNodes : [_groupNodes];
    const groupNode = find(row => {
      return view(lensPath(['y:State', '@_closed']), row) === 'false'
    },      groupNodes);
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
  const _label = label.join(STATE_LABEL_SEP);

  return stateLabel === YED_ENTRY_STATE
    ? {}
    : children && children.length === 0 ? {[_label]: ''} : {[_label]: mergeAll(children)};
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

function aggregateEdgesPerFromEventKey({edges: hashMap, events}, yedEdge) {
  const from = view(edgeOriginStateLens, yedEdge).trim();
  const to = view(edgeTargetStateLens, yedEdge).trim();
  // Label as in yEd i.e. `x [y] / z` string, with x, y, z all optionals
  // Also: z is a string representing a function, but not a function
  const yedEdgeLabel = getYedEdgeLabel(yedEdge);
  const yedEdgeLabelRegExp = /\[(.*)\]/;
  const expressionList = yedEdgeLabel ? yedEdgeLabel.split(yedEdgeLabelRegExp) : [`/${DEFAULT_ACTION_FACTORY_STR}`];

  // Possible cases:
  // x [y] / z: expressionList.length === 3
  // x [y]    : expressionList.length === 3
  // [y] / z  : expressionList.length === 3
  // - also covers empty `y` and empty `z`
  // x / z    : expressionList.length === 1
  // x        : expressionList.length === 1
  // / z      : expressionList.length === 1
  // nil      : expressionList.length === 1
  const actionFactory = (expressionList.length === 3
      ? (expressionList[2] && expressionList[2].split('/')[1]) || DEFAULT_ACTION_FACTORY_STR
      : expressionList[0].split('/')[1] || DEFAULT_ACTION_FACTORY_STR
  ).trim();

  // Reminder: eventless means !event is truthy so "" is ok
  const event = (expressionList.length === 3
      ? (expressionList[0] && expressionList[0].trim()) || ''
      : expressionList[0].split('/')[0] || ''
  ).trim();
  const guard = (expressionList.length === 3 ? (expressionList[1] && expressionList[1].trim()) || '' : '').trim();
  const fromEventKey = [from, event].join(YED_LABEL_DECODE_SEP);

  hashMap[fromEventKey] = hashMap[fromEventKey] || [];
  hashMap[fromEventKey] = hashMap[fromEventKey].concat([
    {predicate: guard.trim(), to: to.trim(), actionFactory: actionFactory.trim()},
  ]);
  return {edges: hashMap, events: event ? events.add(event) : events};
}

function computeKinglyTransitionsFactory(stateYed2KinglyMap, edges) {
  // Transitions are computed by means of a function in which the mapping between actions and guards
  // strings and the respective JavaScript functions is injected
  return function getKinglyTransitions({actionFactories, guards}) {
    let transitions = [];
    forEachObjIndexed((arrGuardsTargetActions, fromEventKey) => {
      // Example:
      // yedFrom: "n0::n0" ; userFrom: "entered by user" ; _from: "n0::n0[symbol]entered by user"
      const [yedFrom, _event] = fromEventKey.split(YED_LABEL_DECODE_SEP);
      const _from = yedState2KinglyState(stateYed2KinglyMap, yedFrom);
      const userFrom = stateYed2KinglyMap[yedFrom];
      let from = _from;
      let event = _event;

      // Case: init transition
      if (isInitialTransition(yedFrom, userFrom)) {
        //   Case: top-level init transition
        if (isTopLevelInitTransition(yedFrom, userFrom)) {
          from = INIT_STATE;
          event = INIT_EVENT;
        } else {
          //   Case: non-top-level, i.e. compound state's init transition
          // -> there is a parent to the origin node, that's the compound node we want
          const fromParent = getYedParentNode(yedFrom);
          from = [fromParent, stateYed2KinglyMap[fromParent]].join(STATE_LABEL_SEP);
          event = INIT_EVENT;
        }
      }

      // TODO: some error control here to add
      // - actionStr cannot be found in actionFactories
      // - same for guards
      // - no spacing in actions...
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
          guards: arrGuardsTargetActions.map(arrGuardsTargetAction => {
            const {predicate: predicateStr, to: yedTo, actionFactory: actionFactoryStr} = arrGuardsTargetAction;
            return {
              predicate: mapGuardStrToGuardFn(guards, predicateStr),
              to: computeKinglyDestinationState(stateYed2KinglyMap, yedTo),
              action: mapActionFactoryStrToActionFactoryFn(actionFactories, actionFactoryStr),
            };
          }),
        });
      }
    }, edges);

    return transitions;
  };
}

// TODO: apparently empty actions are set undefined instead of action_identity!!
// occurs likely when there is nothing on the edge label and not init transition edge
// TODO: checking
// - check directly the generated states and transitions with Kingly but now! ABSOLUTELY DO IT
// - but maybe also check basic stuff about states (not empty), node labels (only one [] etc)
// Only ever one [x]
// Only ever one /
// Never ever the SEP (heart symbol)
// yEd action cannot be named ACTION_IDENTITY and no such entry in actionFactories prop
// No event allowed on initial states (top-level or else)
// - any yed of the multiple graph types seem to all be graph, with only visuals changing
//   so this algorithm should be fine even with swimlanes and fancy stuff
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
  console.log(`graphObj.graph.node`, graphObj.graph.node[1].data[1])

  const stateHierarchy = mapOverTree(stateHierarchyLens, x => x, graphObj)[STATE_LABEL_SEP];
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
  // TODO: also check that event, predicate etc. are strings nothing weird
  const getKinglyTransitions = computeKinglyTransitionsFactory(stateYed2KinglyMap, edges);

  return {
    states: stateHierarchy,
    stateYed2KinglyMap,
    events: Array.from(events),
    getKinglyTransitions,
    errors: _errors,
  };
}

module.exports = {
  computeTransitionsAndStatesFromXmlString,
};

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
// TODO: imrpvoe
// - log state list, eevent list, guard list, action list, so it can be copied into code
// instead of typed by hand
// actually could be directly: const guards = {} preformatted commented in the output js file!!
// TODO: publish  new version of kingly
