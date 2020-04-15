const {ACTION_IDENTITY, NO_OUTPUT, NO_STATE_UPDATE} = require('kingly');
// This one is from jest and is terrific to format object nicely
// but we used JSON.stringify in the end as we need JS-legit formatting here
// Kept here because I never remember the name of the module
// const prettyFormat = require('pretty-format');
const prettier = require("prettier");
const fs = require('fs');
const {Command} = require('commander');
const {computeTransitionsAndStatesFromXmlString} = require('./conversion');
const program = new Command();

// Configure syntax, parse and run
program
  .version('0.1.0')
  .arguments('<file>')
  .action(convertYedFile);
program.parse(process.argv);

// Conversion function
// DOC: The assumption here is that the generated JS file is used in the browser,
// so we export a-la ES modules
// NTH: May could be the export through an option (to generate module.exports = ...)
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
      getKinglyTransitions,
      errors,
    } = computeTransitionsAndStatesFromXmlString(yedString);

    if (errors.length > 0) {
      console.error(`${errors.length} error(s) found! See log.`);
      errors.map(console.error);
      throw new Error(errors)
    }
    else {
      // Stringify the transitions without guards and actions (we just have the names of such)
      // to hold the guards and actions
      let predicateList = [];
      let actionList = [];
      const transitionsStr = transitionsWithoutGuardsActions.map(transitionRecord => {
        if (transitionRecord.guards) {
          const {from, event, guards} = transitionRecord;
          return `
           { from: "${from}", event: "${event}", guards: [
           ${guards.map(guardRecord => {
            const {predicate, to, action} = guardRecord;
            const predicateStr = predicate.slice(3, -3);
            const actionStr = action.slice(3, -3);
            predicateList.push(predicateStr);
            actionList.push(actionStr);

            return `
          {predicate: guards["${predicateStr}"], to: "${to}", action: actionFactories["${actionStr}"]}, 
          `.trim()
          }).join("\n")
            }
      ]}
        `.trim().concat(", ")
        }
        else {
          const {from, event, to, action} = transitionRecord;
          const actionStr = action.slice(3, -3);

          return `
          { from: "${from}", event: "${event}", to: "${to}", action: actionFactories["${actionStr}"] } 
        `.trim().concat(", ")
        }
      }).join("\n");

      // We avoid using import for portability reasons between module or build systems
      // So we add ACTION_IDENTITY, NO_OUTPUT, NO_STATE_UPDATE directly in the code
      // We also tried not to use too many JS language features in case compatibility with IE11- is desired
      const fileContents = `
         const NO_OUTPUT = ${JSON.stringify(NO_OUTPUT)};
         const NO_STATE_UPDATE = ${JSON.stringify(NO_STATE_UPDATE)};
         const events = ${JSON.stringify(events)};
         const states = ${JSON.stringify(states)};
         function getKinglyTransitions ({actionFactories, guards}){
         actionFactories['ACTION_IDENTITY'] = ${ACTION_IDENTITY}; 
          // We require the actionFactories objects to have EXACTLY the required actions
          // We could test just an inclusion but we are lazy and better to start strict and relax later
           if (Object.keys(actionFactories).sort().join("") !== "${actionList.sort().join("")}") {
             console.error({actionFactories, actionList: ${JSON.stringify(actionList)}});
             throw new Error("Some action are missing either in the graph, or in the action implementation object!")
           }
           if (Object.keys(guards).sort().join("") !== "${predicateList.sort().join("")}") {
             console.error({actionFactories, predicateList: ${JSON.stringify(predicateList)}});
             throw new Error("Some guards are missing either in the graph, or in the guard implementation object!")
           }
           const transitions = [
           ${transitionsStr}
           ]; 
           
           return transitions
         }
         
         
         export {
         events,
         states,
         getKinglyTransitions
         }
`.trim();

      // Write the output file
      //
      try {
        const prettyFileContents = prettier.format(fileContents, {semi: true, parser: "babel", printWidth: 120});
        fs.writeFileSync(`${file}.fsm.js`, prettyFileContents)
        //file written successfully
      } catch (err) {
        console.error(err)
      }

    }

  } catch (err) {
    console.error(err)
  }
}


// TODO left:
// - handle errors
//   - not graphml file or not found
//   - wrong kingly format (syntax)
//   - wrong kingly format (semantics)
//   - what else?
// TODO: improve
// - log state list, eevent list, guard list, action list, so it can be copied into code
// instead of typed by hand
// actually could be directly: const guards = {} preformatted commented in the output js file!!

// TODO: rewrite the demo on website with this (at least one) and update the version of kingly and
// check it works. Chess exampe good it has history inside
// or real world also!!

// DOC:
// Top Init transition (in yed) cannot have actions or event but can have guards (rule comes from Kingly)
