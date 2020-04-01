const parser = require('fast-xml-parser');
const { mapOverTree } = require('fp-rosetree');
const { lensPath, view, mergeAll, concat, forEachObjIndexed } = require('ramda');
const STATE_LABEL_SEP = 'ღ';
const YED_LABEL_DECODE_SEP = 'ღ';
const DEFAULT_ACTION_FACTORY = 'ACTION_IDENTITY';
const YED_ENTRY_STATE = 'init';

function computeTransitionsAndStatesFromXmlString(yedString){
  function isCompoundState(graphObj) {
    return graphObj['@_yfiles.foldertype'] === 'group'
  }

  function isGraphRoot(graphObj) {
    return 'key' in graphObj
  }

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
      :children && children.length === 0
        ? { [_label]: "" }
        : { [_label]: mergeAll(children) }
  };
  const constructStateYed2KinglyMap = (label, children) => {
    console.log(`concat`, concat(children, [{ [label[0]]: label[1] }]))
    return mergeAll(concat(children, [{ [label[0]]: label[1] }]))
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
    const from = view(edgeOriginStateLens, edgeML);
    const to = view(edgeTargetStateLens, edgeML);
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
    const actionFactory = expressionList.length === 3
      ? expressionList[2] && expressionList[2].split('/')[1] || DEFAULT_ACTION_FACTORY
      : expressionList[0].split('/')[1] || DEFAULT_ACTION_FACTORY;

    // Reminder: eventless means !event is truthy so can be null, undefined or "" (or num<>0 -)
    const event = expressionList.length === 3
      ? expressionList[0] && expressionList[0].trim() || ""
      : expressionList[0].split('/')[0] || ""
    const guard = expressionList.length === 3
      ? expressionList[1] && expressionList[1].trim() || ""
      : "";
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
  let transitions = [];
  forEachObjIndexed((arrGuardsTargetActions, fromEventKey) => {
    let [from, event] = fromEventKey.split(YED_LABEL_DECODE_SEP);
    event = event.trim();
    from = from.trim();
    if (arrGuardsTargetActions.length === 1) {
      const { predicate, to, actionFactory } = arrGuardsTargetActions[0];
      if (!predicate) {
        transitions.push({ from, event, to, actionFactory })
      }
      else {
        transitions.push({ from, event, guards: arrGuardsTargetActions })
      }
    }
    else {
      transitions.push({ from, event, guards: arrGuardsTargetActions })
    }
  }, edges);

  return {
    stateHierarchy, stateYed2KinglyMap, transitions
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
