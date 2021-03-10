module.exports = function convert(argv) {
  const {ACTION_IDENTITY, NO_OUTPUT, NO_STATE_UPDATE, fsmContracts} = require('kingly');
// This one is from jest and is terrific to format object nicely
// but we used JSON.stringify in the end as we need JS-legit formatting here
// Kept here because I never remember the name of the module
// const prettyFormat = require('pretty-format');
  const prettier = require("prettier");
  const prettyFormat = require("pretty-format");
  const fs = require('fs');
  const {Command} = require('commander');
  const {computeTransitionsAndStatesFromXmlString} = require('@brucou/utilities');
  const {checkKinglyContracts} = require('./helpers');
  const {DEFAULT_ACTION_FACTORY_STR} = require('./properties');
  const {implDoStr, implEveryStr, esmExports, cjsExports, cjsImports, esmImports} = require('./template');
  const program = new Command();

// Configure syntax, parse and run
  program
    .version('0.1.0')
    .arguments('<file>')
    .action(convertYedFile);
  program.parse(process.argv);

  function hasGuards(guards){
    return guards && (guards.length > 1 || guards.length === 1 && guards[0].predicate.map(p => p.slice(3, -3)).filter(Boolean).length > 0)
  }

// Conversion function
// DOC: We export two files: one cjs for node.js and js for browser esm consumption
// NTH: Configure exports through an option
// NTH: Handle several files at the same time
// NTH: Add an output option
  function convertYedFile(_file) {
    const file = _file.endsWith('.graphml') ? _file : `${_file}.graphml`;

    // Read the file
    try {
      const yedString = fs.readFileSync(file, 'utf8');
      // Convert the file
      const {
        states,
        stateYed2KinglyMap,
        events,
        transitionsWithoutGuardsActions,
        transitionsWithFakeGuardsActions,
        getKinglyTransitions,
        errors,
      } = computeTransitionsAndStatesFromXmlString(yedString);

      if (errors.length > 0) {
        console.error(`${errors.length} error(s) found! See log.`);
        errors.map(console.error);
        throw new Error(errors)
      }
      else {
        const kinglyErrors = checkKinglyContracts(states, events, transitionsWithFakeGuardsActions);
        if (!kinglyErrors) {
          // console.error(`The input graph does not represent a valid Kingly machine! Cf. log.`)
          throw new Error(`The input graph does not represent a valid Kingly machine! Cf. log.`)
        }

        // Stringify the transitions without guards and actions (we just have the names of such)
        // to hold the guards and actions
        // TODO: refactor that somewhere else
        let predicateList = new Set();
        let actionList = new Set();
        const transitionsStr = transitionsWithoutGuardsActions.map(transitionRecord => {
          const {from, event, guards} = transitionRecord;

          if (guards && guards.length === 0) throw `Got guards record that is empty array! We have a bug here!`
         if (hasGuards(guards) ) {
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

        // We avoid using import for portability reasons between module or build systems
        // So we add ACTION_IDENTITY, NO_OUTPUT, NO_STATE_UPDATE directly in the code
        // We also tried not to use too many JS language features in case compatibility with IE11- is desired
        const fileContents = `
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

        // Write the esm output file
        const esmContents = [esmImports, fileContents, esmExports].join("\n\n");
        try {
          const prettyFileContents = prettier.format(esmContents, {semi: true, parser: "babel", printWidth: 120});
          fs.writeFileSync(`${file}.fsm.js`, prettyFileContents)
          //file written successfully
        } catch (err) {
          console.error(`error writing converted esm file.`);
          console.error(err);
          process.exit(1);
        }

        // Write the cjs output filee
        const cjsContents = [cjsImports, fileContents, cjsExports].join("\n\n");
        try {
          const prettyFileContents = prettier.format(cjsContents, {semi: true, parser: "babel", printWidth: 120});
          fs.writeFileSync(`${file}.fsm.cjs`, prettyFileContents)
          //file written successfully
        } catch (err) {
          console.error(`Error writing converted esm file.`);
          console.error(err);
          process.exit(1);
        }

      }
    } catch (err) {
      // The actual message must have already be logged in the console
      console.error(`Exiting due to errors`, err);
      process.exit(1);
    }
  }

}
