module.exports = function convert(argv) {
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
  const {implDoStr, implEveryStr, esmExports, cjsExports, cjsImports, esmImports, computeFileContents} = require('./template');
  const program = new Command();

// Configure syntax, parse and run
  program
    .version('0.1.0')
    .arguments('<file>')
    .action(convertYedFile);
  program.parse(process.argv);

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
          throw new Error(`The input graph does not represent a valid Kingly machine! Cf. log.`)
        }

        const fileContents = computeFileContents(transitionsWithoutGuardsActions, events, states);

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
