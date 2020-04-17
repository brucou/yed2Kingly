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
          {predicate: guards["${predicateStr}"], to: "${to}", action: aF["${actionStr}"]}, 
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
          { from: "${from}", event: "${event}", to: "${to}", action: aF["${actionStr}"] } 
        `.trim().concat(", ")
        }
      }).join("\n");

      // We avoid using import for portability reasons between module or build systems
      // So we add ACTION_IDENTITY, NO_OUTPUT, NO_STATE_UPDATE directly in the code
      // We also tried not to use too many JS language features in case compatibility with IE11- is desired
      const fileContents = `
      // Copy-paste help
      // For debugging purposes, functions should all have a name
      // Using natural language sentences in the graph is valid
      // However, you will have to find a valid JavaScript name for the matching function
      // -----Guards------
      // const guards = {
         ${predicateList.map(pred => `//   "${pred}": function (){},`).join('\n')}
      // };
      // -----Actions------
      // const actions = {
         ${actionList.map(action => `//   "${action}": function (){},`).join('\n')}
      // };
      // ----------------
         function contains(as, bs){
           // returns true if every a in as can be found in bs
           return as.every(function(a){return bs.indexOf(a) > -1} )
         }
         var NO_OUTPUT = ${JSON.stringify(NO_OUTPUT)};
         var NO_STATE_UPDATE = ${JSON.stringify(NO_STATE_UPDATE)};
         var events = ${JSON.stringify(events)};
         var states = ${JSON.stringify(states)};
         function getKinglyTransitions (record){
         var aF = record.actionFactories;
         var guards = record.guards
         var actionList = ${JSON.stringify(actionList)};
         var predicateList = ${JSON.stringify(predicateList)};
         aF['ACTION_IDENTITY'] = ${ACTION_IDENTITY}; 
          // We require the actionFactories objects to have EXACTLY the required actions
          // We could test just an inclusion but we are lazy and better to start strict and relax later
           if (contains(actionList, Object.keys(aF))) {
             console.error({actionFactories: aF, actionList});
             throw new Error("Some action are missing either in the graph, or in the action implementation object!")
           }
           if (contains(predicateList, Object.keys(guards))) {
             console.error({guards, predicateList});
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
        console.error(err);
        process.exit(1);
      }
    }
  } catch (err) {
    // The actual message must have already be logged in the console
    console.error(`Exiting due to errors`);
    process.exit(1);
  }
}

// TODO: use a left/right option monad. Error management is getting painful
// like wrap prettier in try catch with left/right associated, I do not accumulate errors so I should definitely try
// an option monad
// Do that after passing at least one tests of real end-to-end kingly conversion
// TODO left:
// - check directly the generated states and transitions with Kingly but now! ABSOLUTELY DO IT
// - tests!!
// - handle errors
//   - wrong kingly format (syntax)
//   - wrong kingly format (semantics)
//   - in both case, run kingly in check contract mode with fake action & guards

// TODO: rewrite the demo on website with this (at least one) and update the version of kingly and
// check it works. Chess example good it has history inside
// or real world also!!

// DOC:
// Top Init transition (in yed) cannot have actions or event but can have guards (rule comes from Kingly)
// no ACTION_IDENTITY entry in actionFactories prop (not worth throwing an exception)

// TODO: see how to santize guard and action names:
// function sanitize(string) {
//   const map = {
//     ' ': '_',
//     '(': '$',
//     ')': '$',
//     '"': '&quot;',
//     "'": '&#x27;',
//     "/": '&#x2F;',
//   };
//   const reg = /[ ()"'/]/ig;
//   return string.trim().replace(reg, (match)=>(map[match]));
// }
// LISTER les characters que je peux remplacer et trouver un remplacement
// can be a ot: #@!`~-+= etc.
// If some characters are forbidden, throw an error in advance
// yeah probably allow "() " and forbid the rest and check that (apply to predicate, action and event
// No actually I don't want to forbid non english base. So after replacing "() " check that the identifier is valid identifier
// the best way to do that is either eval or use a javascript parser.
// Could have an option in which the version of JS is chosen and a parser is chosen accordingly
// todo maybe a day just write the NTH for now
// for now assume the most restricting i.e. ES3
