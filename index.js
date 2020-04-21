const {ACTION_IDENTITY, NO_OUTPUT, NO_STATE_UPDATE, fsmContracts} = require('kingly');
// This one is from jest and is terrific to format object nicely
// but we used JSON.stringify in the end as we need JS-legit formatting here
// Kept here because I never remember the name of the module
// const prettyFormat = require('pretty-format');
const prettier = require("prettier");
const fs = require('fs');
const {Command} = require('commander');
const {computeTransitionsAndStatesFromXmlString} = require('./conversion');
const {checkKinglyContracts} = require('./helpers');
const {DEFAULT_ACTION_FACTORY_STR} = require('./properties')
const program = new Command();

// Configure syntax, parse and run
program
  .version('0.1.0')
  .arguments('<file>')
  .action(convertYedFile);
program.parse(process.argv);

// Conversion function
// DOC: We export two files: one cjs for node.js and js for browser esm consumption
// NTH: May could be the export through an option (to generate module.exports = ...)
// NTH: handle several files at the same time
// NTH: add an output option
function convertYedFile(_file) {
  const file = _file.endsWith('.graphml') ? _file : `${file}.graphml`;

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
      let predicateList = new Set();
      let actionList = new Set();
      const transitionsStr = transitionsWithoutGuardsActions.map(transitionRecord => {
        if (transitionRecord.guards) {
          const {from, event, guards} = transitionRecord;
          return `
           { from: "${from}", event: "${event}", guards: [
           ${guards.map(guardRecord => {
            const {predicate, to, action} = guardRecord;
            const predicateStr = predicate.slice(3, -3);
            const actionStr = action.slice(3, -3);
            predicateList.add(predicateStr);
            actionList.add(actionStr);
            // actionList.push(actionStr);

            return `
          {predicate: guards["${predicateStr}"], to: ${JSON.stringify(to)}, action: aF["${actionStr}"]}, 
          `.trim()
          }).join("\n")
            }
      ]}
        `.trim().concat(", ")
        }
        else {
          const {from, event, to, action} = transitionRecord;
          const actionStr = action.slice(3, -3);
          actionList.add(actionStr);

          return `
          { from: "${from}", event: "${event}", to: ${JSON.stringify(to)}, action: aF["${actionStr}"] } 
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
      // const guards = {${Array.from(predicateList)
        .map(pred => `\n//   "${pred}": function (){},`)
        .join("")}
      // };
      // -----Actions------
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
         var NO_OUTPUT = ${JSON.stringify(NO_OUTPUT)};
         var NO_STATE_UPDATE = ${JSON.stringify(NO_STATE_UPDATE)};
         var events = ${JSON.stringify(events)};
         var states = ${JSON.stringify(states)};
         function getKinglyTransitions (record){
         var aF = record.actionFactories;
         var guards = record.guards
         var actionList = ${JSON.stringify(Array.from(actionList))};
         var predicateList = ${JSON.stringify(Array.from(predicateList))};
         aF['ACTION_IDENTITY'] = ${ACTION_IDENTITY}; 
           if (!contains(actionList, Object.keys(aF))) {
             console.error({actionFactories: Object.keys(aF), actionList});
             throw new Error("Some action are missing either in the graph, or in the action implementation object!")
           }
           if (!contains(predicateList, Object.keys(guards))) {
             console.error({guards: Object.keys(guards), predicateList});
             throw new Error("Some guards are missing either in the graph, or in the guard implementation object!")
           }
           const transitions = [
           ${transitionsStr}
           ]; 
           
           return transitions
         }
         `.trim();

      const esmExports = `
         export {
           events,
           states,
           getKinglyTransitions
         }
`.trim();

      const cjsExports = `
         module.exports = {
           events,
           states,
           getKinglyTransitions
         }
`.trim();

      // Write the esm output file
      const esmContents = [fileContents, esmExports].join("\n\n");
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
      const cjsContents = [fileContents, cjsExports].join("\n\n");
      try {
        const prettyFileContents = prettier.format(cjsContents , {semi: true, parser: "babel", printWidth: 120});
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

