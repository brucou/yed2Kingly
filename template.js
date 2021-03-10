const {DEFAULT_ACTION_FACTORY_STR} = require('./properties');
const {ACTION_IDENTITY, NO_OUTPUT, NO_STATE_UPDATE, fsmContracts} = require('kingly');

function hasGuards(guards) {
  return guards && (guards.length > 1 || guards.length === 1 && guards[0].predicate.map(p => p.slice(3, -3)).filter(Boolean).length > 0)
}

const implDoStr = `
function chain(arrFns, actions) {
  if (arrFns.length === 1) return actions[arrFns[0]];
  return function chain_(s, ed, stg) {
    return (
      arrFns.reduce(function(acc, fn) {
        var r = actions[fn](s, ed, stg);

        return {
          updates: acc.updates.concat(r.updates),
          outputs: acc.outputs.concat(r.outputs),
        };
      }, { updates: [], outputs: [] })
    );
  };
}
`;

const implEveryStr = `
function every(arrFns, guards) {
  if (arrFns.length === 1) return guards[arrFns[0]];
  return function every_(s, ed, stg) {
    return (
      arrFns.reduce(function(acc, fn) {
        var r = guards[fn](s, ed, stg);

        return r && acc;
      }, true)
    );
  };
}
`;

const cjsImports = `var createStateMachine = require("kingly").createStateMachine;`;
const esmImports = `import {createStateMachine} from "kingly";`;
const esmExports = `
         export {
           events,
           states,
           getKinglyTransitions,
           createStateMachineFromGraph
         }
`.trim();

const cjsExports = `
         module.exports = {
           events,
           states,
           getKinglyTransitions,
           createStateMachineFromGraph
         }
`.trim();

function compileTransitionsStr(transitionsWithoutGuardsActions) {
  let predicateList = new Set();
  let actionList = new Set();
  const transitionsStr = transitionsWithoutGuardsActions.map(transitionRecord => {
    const {from, event, guards} = transitionRecord;

    if (guards && guards.length === 0) throw `Got guards record that is empty array! We have a bug here!`
    if (hasGuards(guards)) {
      return `
           { from: "${from}", event: "${event}", guards: [
           ${guards.map(guardRecord => {
        const {predicate, to, action} = guardRecord;
        const predicates = predicate.map(x => x.slice(3, -3)).filter(Boolean);
        const actions = action.map(x => x.slice(3, -3)).filter(Boolean);
        predicates.forEach(x => predicateList.add(x));
        actions.forEach(x => actionList.add(x));

        return `
          {predicate: every(${JSON.stringify(predicates)}, guards), to: ${JSON.stringify(to)}, action: chain(${JSON.stringify(actions)}, aF)} 
          `.trim().concat(", ")
      }).join("\n")
        }
      ]}
        `.trim().concat(", ")
    }
    else {
      const {from, event, to, action} = transitionRecord;
      const actions = action.map(x => x.slice(3, -3)).filter(Boolean);
      actions.forEach(x => actionList.add(x));

      return `
          { from: "${from}", event: "${event}", to: ${JSON.stringify(to)}, action: chain(${JSON.stringify(actions)}, aF)}
        `.trim().concat(", ")
    }
  }).join("\n");

  return {transitionsStr, predicateList, actionList}
}

// ADR:
// We add ACTION_IDENTITY, NO_OUTPUT, NO_STATE_UPDATE directly in the code
// to limit dependencies
// We also tried not to use too many JS language features in case compatibility with IE11- is desired
function computeFileContents(transitionsWithoutGuardsActions, events, states){
  // Compile the transitions for which we only have the names to actual Kingly transitions
  const {transitionsStr, predicateList, actionList} = compileTransitionsStr(transitionsWithoutGuardsActions);

  return           `
      // Copy-paste help
      // For debugging purposes, guards and actions functions should all have a name
      // Using natural language sentences for labels in the graph is valid
      // guard and action functions name still follow JavaScript rules though
      // -----Guards------
      /**
      * @param {E} extendedState
      * @param {D} eventData
      * @param {X} settings
      * @returns Boolean
      */
      // const guards = {${Array.from(predicateList)
    .map(pred => `\n//   "${pred}": function (){},`)
    .join("")}
      // };
      // -----Actions------
      /**
      * @param {E} extendedState
      * @param {D} eventData
      * @param {X} settings
      * @returns {{updates: U[], outputs: O[]}}
      * (such that updateState:: E -> U[] -> E)
      */
      // const actions = {${Array.from(actionList)
    .map(action => action !== DEFAULT_ACTION_FACTORY_STR
      ? `\n//   "${action}": function (){},`
      : "")
    .join("")}
      // };
      // ----------------
         function contains(as, bs){
           return as.every(function(a){return bs.indexOf(a) > -1} )
         }
         
         ${implDoStr}
         
         ${implEveryStr}
         
         var NO_OUTPUT = ${JSON.stringify(NO_OUTPUT)};
         var NO_STATE_UPDATE = ${JSON.stringify(NO_STATE_UPDATE)};
         var events = ${JSON.stringify(events)};
         var states = ${JSON.stringify(states)};
         function getKinglyTransitions (record){
         var aF = record.actionFactories;
         var guards = record.guards
         var actionList = ${JSON.stringify(Array.from(actionList))};
         var predicateList = ${JSON.stringify(Array.from(predicateList))};
           if (!contains(actionList, Object.keys(aF))) {
             console.error("Some actions are missing either in the graph, or in the action implementation object! Cf actionFactories (you passed that) vs. actionList (from the graph) below. They must have the same items!");
             console.error({actionFactories: Object.keys(aF), actionList});
             var passedAndMissingInGraph = Object.keys(aF).filter(function(k) { return actionList.indexOf(k) === -1});
             passedAndMissingInGraph.length > 0 && console.error("So the following actions were passed in parameters but do not match any action in the graph! This may happen if you modified the name of an action in the graph, but kept using the older name in the implementation! Please check.", passedAndMissingInGraph);
             var inGraphButNotImplemented= actionList.filter(function(k) { return  Object.keys(aF).indexOf(k) === -1});
             inGraphButNotImplemented.length > 0 && console.error("So the following actions declared in the graph are not implemented! Please add the implementation. You can have a look at the comments of the generated fsm file for typing information.", inGraphButNotImplemented);
             throw new Error("Some actions implementations are missing either in the graph, or in the action implementation object!")
           }
           if (!contains(predicateList, Object.keys(guards))) {
             console.error("Some guards are missing either in the graph, or in the action implementation object! Cf guards (you passed that) vs. predicateList (from the graph) below. They must have the same items!");
             console.error({guards: Object.keys(guards), predicateList});
             throw new Error("Some guards are missing either in the graph, or in the guard implementation object!")
           }
           const transitions = [
           ${transitionsStr}
           ]; 
           
           return transitions
         }
         
function createStateMachineFromGraph(fsmDefForCompile, settings){
  var updateState = fsmDefForCompile.updateState;
  var initialExtendedState = fsmDefForCompile.initialExtendedState;

  var transitions = getKinglyTransitions({actionFactories: fsmDefForCompile.actionFactories, guards: fsmDefForCompile.guards});

  var fsm = createStateMachine({
    updateState,
    initialExtendedState,
    states,
    events,
    transitions
  }, settings);

  return fsm
}

         `.trim();

}

module.exports = {
  implDoStr,
  implEveryStr,
  cjsImports,
  cjsExports,
  esmImports,
  esmExports,
  computeFileContents
}
