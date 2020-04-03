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

function tryCatch(fn, errCb) {
  return function tryCatch(...args) {
    try {return fn.apply(fn, args);}
    catch (e) {
      return errCb(e, args);
    }
  };
}

class Yed2KinglyConversionError extends Error {
  constructor(m) {
    super(m);
    this.errors = m;
    this.message = m.map(({ when, location, info, message }) => {
      // formatted message
      const fm = `At ${location}: ${when} => ${message}`;
      console.info(fm, info);
      // TODO: see if I keep or not
      console.err(m);
      return fm
    }).concat([`See extra info in console`]).join('\n');
  }
}

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

// iff no predicate, and only one transition in array
function isSimplifiableSyntax(arrGuardsTargetActions) {
  return arrGuardsTargetActions.length === 1 && !arrGuardsTargetActions[0].predicate
}

function computeKinglyDestinationState(stateYed2KinglyMap, yedTo) {
  if (isHistoryDestinationState(stateYed2KinglyMap, yedTo)) {
    return isDeepHistoryDestinationState(stateYed2KinglyMap, yedTo)
      ? historyState(DEEP, yedStatetoKinglyState(stateYed2KinglyMap, getYedParentNode(yedTo)))
      : historyState(SHALLOW, yedStatetoKinglyState(stateYed2KinglyMap, getYedParentNode(yedTo)))

  }
  else {
    return yedStatetoKinglyState(stateYed2KinglyMap, yedTo);
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

function parseGraphMlString(yedString) {
  return tryCatch(
    (yedString) => {
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
    },
    (e, [yedString]) => {
      throw new Yed2KinglyConversionError([
        {
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
      ])
    }
  )(yedString)
}

// TODO: checking
// - check directly the generated states and transitions with Kingly but now!
// - but maybe also check basic stuff about states (not empty), node labels (only one [] etc)
// Only ever one [x]
// Only ever one /
// Never ever the SEP (heart symbol)
// yEd action cannot be named ACTION_IDENTITY and no such entry in actionFactories prop
// No event allowed on initial states (top-level or else)
// - any yed of the multiple graph types seem to all be graph, with only visuals changing
//   so this algorithm should be fine even with swimlanes and fancy stuff
function computeTransitionsAndStatesFromXmlString(yedString) {
  let errors = [];
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
  const { graphml: graphObj } = parseGraphMlString(yedString);
  const stateHierarchy = mapOverTree(stateHierarchyLens, x => x, graphObj)[STATE_LABEL_SEP];
  const stateYed2KinglyMap = mapOverTree(stateYed2KinglyLens, x => x, graphObj);
  const edgeOriginStateLens = lensPath(['@_source']);
  const edgeTargetStateLens = lensPath(['@_target']);
  const edgeMlLabelLens = lensPath(['y:PolyLineEdge', 'y:EdgeLabel', '#text'])
  const getEdgeMlLabel = edgeML => {
    const data = Array.isArray(edgeML.data) ? edgeML.data : [edgeML.data];
    const d10Record = data.find(d => d['@_key'] === 'd10');
    return view(edgeMlLabelLens, d10Record) || "";
  };
  const yedEdges = graphObj.graph.edge;


// Kingly only admits one transition record per (from, event) couple
// Additionally, when there is no guard to check, a simplified transition format can be used
// i.e. {from, event, to, actionFactory}
// otherwise standard format: {from, event, guards : [{predicate, to, actionFactory}]} is used
// To prepare for deriving transitions, we use a hashmap which conflates all matching transitions
// in an array.
  const aggregateEdgesPerFromEventKey = (hashMap, yedEdge) => {
    const from = view(edgeOriginStateLens, yedEdge).trim();
    const to = view(edgeTargetStateLens, yedEdge).trim();
    // Label as in yEd i.e. `x [y] / z` string, with x, y, z all optionals
    // Also: z is a string representing a function, but not a function
    const edgeMlLabel = getEdgeMlLabel(yedEdge);
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

    // Reminder: eventless means !event is truthy so "" is ok
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

    hashMap[fromEventKey] = hashMap[fromEventKey] || [];
    hashMap[fromEventKey] = hashMap[fromEventKey].concat([
      { predicate: guard.trim(), to: to.trim(), actionFactory: actionFactory.trim() }
    ]);
    return hashMap
  }
  const edges = yedEdges.reduce(
    tryCatch(
      aggregateEdgesPerFromEventKey,
      (e, [hashMap, yedEdge]) => {
        errors.push({
          when: `building (from, event) hashmap`,
          location: `computeTransitionsAndStatesFromXmlString > aggregateEdgesPerFromEventKey`,
          info: {hashMap: JSON.parse(JSON.stringify(hashMap)), yedEdge},
          message,
          possibleCauses: [
            `File is not a valid graphML file`,
            `File is not a valid yed-generated graphML file`,
            `You found a bug in yed2Kindly converter`,
            // `You found a bug in fast-xml=parser (unlikely)`,
          ],
        })
      }),
    {}
  );
if (errors.length > 0) throw new Yed2KinglyConversionError (errors);


  // Transitions are computed by means of a function in which the mapping between actions and guards
  // strings and the respective JavaScript functions is injected
  // Previously computed edges is traversed and converted into Kingly transitions
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

      // TODO: some error control here to add
      // - actionStr cannot be found in actionFactories
      // - same for guards
      // - no spacing in actions...
      if (isSimplifiableSyntax(arrGuardsTargetActions)) {
        const { to: yedTo, actionFactory: actionFactoryStr } = arrGuardsTargetActions[0];

        transitions.push({
          from,
          event,
          to: computeKinglyDestinationState(stateYed2KinglyMap, yedTo),
          action: mapActionFactoryStrToActionFactoryFn(actionFactories, actionFactoryStr)
        })
      }
      else {
        transitions.push({
          from,
          event,
          guards: arrGuardsTargetActions.map(arrGuardsTargetAction => {
            const { predicate: predicateStr, to: yedTo, actionFactory: actionFactoryStr } = arrGuardsTargetAction;
            return {
              predicate: mapGuardStrToGuardFn(guards, predicateStr),
              to: computeKinglyDestinationState(stateYed2KinglyMap, yedTo),
              action: mapActionFactoryStrToActionFactoryFn(actionFactories, actionFactoryStr)
            }
          })
        })
      }
    }, edges);

    return transitions
  }

  return {
    stateHierarchy, stateYed2KinglyMap, getKinglyTransitions, errors
  }
}

// Lenses for traversing the syntax tree

module.exports = {
  computeTransitionsAndStatesFromXmlString
}

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
