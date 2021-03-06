# Motivation
The yed2Kingly package aims at supporting the creation of state machines with the Kingly state machine library. While by design the Kingly configuration for state machines follows a simple and minimal syntax, crafting and maintaining a large state machine by hand can involve repetitive tasks. Such tasks include for instance looking up a transition and remove it, or checking that a new transition to add does not conflict with an existing one.

Furthermore, a large machine is rarely written directly in a textual format but is rather supported by some kind of visualization whether hand-written graphs or professional graph editors. When switching to text editing, the visual information is lost, the text-based version eventually becomes desynchronized with the visualization.

This is a case in hand where visual tooling can strengthen part of an error-prone manual process, and automate the repetitive tasks.

yEd is a versatile professional graph editor that produces high-quality diagrams for a large set of use cases. yEd is not open source, however, there is no fee linked to its usage as an end-user. I have been using it for the past four years to generate all kinds of diagrams including state machine graphs. The key features that I found extremely valuable in this time are the accessibility to non-professional users (this is no photoshop), its large set of sophisticated automatic highly-customizable layouts, and its text-based versionable graphml format.

This makes yEd a valuable tool to use for state machine creation, edition and maintenance. yEd exists in desktop and online versions. I recommend strongly the desktop version on the grounds that it is more productive for serious tasks, but your mileage may vary. For educational or demonstration purposes, there may be educational value in the online version.

# How does it work?
In a typical process, I start designing a machine from the specifications by drawing it in the yEd editor. When I am done or ready to test the results of my design, I save the file. yEd by default saves its files in a .graphml format. I save the graphml file in the same directory in which I want to use the created state machine. From there, a previously launched watcher runs the `yed2kingly` node script on the newly saved file and generates a JavaScript file that exports the events, state hierarchy and transitions contained in the graph — you can of course also run the script manually instead of using a watcher. The provided exports can then be used as parameters to create a Kingly state machine.

# Install
To use `yed2kingly` in the shell, you need to install the package globally:

```bash
npm install -g yed2kingly
```

# Usage
```bash
yed2kingly file.graphml 
# Or,
y2k file.graphml
```

Running the converter produces two files, targeted at consumption in a browser and node.js environment:

Before:
```bash
src/graphs/file.graphml
```

After:
```bash
src/graphs/file.graphml.fsm.js
src/graphs/file.graphml.fsm.cjs
```

The converter must emit an error or exit with an error code if the converted graph will not give rise to a valid Kingly machine (in particular cf. rules). The idea is to fail as early as possible.

The produced file export three objects: the events, state hierarchy and a transition factory. The first two objects can be used directly as parameters to create a Kingly machine, i.e. they follow the Kingly format. The transition factory requires the developer to associate a JavaScript function to any action and guard labels that is in the graph. The developer thus passed an object containing this information and is returned a Kingly transitions object. I provide an example which should clarify the expected syntax and usage. 

## Rules
Some definitions:
  - An initial transition is that which originates from a node whose label is `init` (or any capitalization of the word, e.g., Init, iNit)
  - A top-level initial transition is that initial transition which does not have any parent node
  - A history pseudo-state is a node whose label is H (shallow history) or H* (deep history)
  - A compound node is a node which is created in the yEd interface by using the group functionality (*Grouping > Group* or *Ctrl-Alt-G* in version 3.19).

- yed2kingly rules:
  - With the exception of history and init pseudo-states, all nodes are converted to Kingly states
  - The Kingly name for a compound state will be the label displayed in the yEd editor for then matching group nodes in a non-collapsed state. This is important as yEd has another name for group node in collapsed state.
  - The label for any edge in the graph maps to a Kingly transition record. The chosen syntax is `event [guard] / action`. Anyone of the event, guard and action can be empty. Hence `[]/` is a valid syntax though not recommended.
  - There cannot be an action in the (unique by construction) top-level initial transition. There may be guards.
  - Labels **must not** include the reserved character `ღ`
  - action label cannot be the reserved label `ACTION_IDENTITY`
  - A label x must be so that the following JavaScript `{[x]: value}` is valid syntactically. This means label can have spaces and a large set of unicode characters as allowed by the JavaScript specifications. Action labels such as *do this, do that* are also valid.
  - Edge labels **must not** have more than one `/` character (action separator)
  
## Conventions
The following conventions are not rules and are not enforced in any way. They exists for practicality or readability purposes.

- Nodes for machine states have a rectangular shape
- Init pseudo-states are represented by a small circle with a different color than regular nodes
- Compound states (group nodes in yEd terminology) should also be displayed in a third color 

# Examples
There are plenty of graph examples in the [test directory](https://github.com/brucou/yed2Kingly/tree/master/tests/graphs). An example, extracted from the tests directory and involving compound states and history pseudo-states is as follows:

![example of yed graph with history pseudo-state and compound state](https://imgur.com/VjKaIkL.png)

Running the `yed2Kingly` script produces the following JavaScript file (v0.6):

```js
import { createStateMachine } from "kingly";

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
// const guards = {
// };
// -----Actions------
/**
 * @param {E} extendedState
 * @param {D} eventData
 * @param {X} settings
 * @returns {{updates: U[], outputs: O[]}}
 * (such that updateState:: E -> U[] -> E)
 */
// const actions = {
//   "logGroup1toH": function (){},
//   "logBtoC": function (){},
//   "logBtoD": function (){},
//   "logCtoD": function (){},
//   "logGroup1toD": function (){},
//   "logGroup1toC": function (){},
//   "logDtoD": function (){},
// };
// ----------------
function contains(as, bs) {
  return as.every(function (a) {
    return bs.indexOf(a) > -1;
  });
}

function chain(arrFns, actions) {
  return function chain_(s, ed, stg) {
    return arrFns.reduce(
      function (acc, fn) {
        var r = actions[fn](s, ed, stg);

        return {
          updates: acc.updates.concat(r.updates),
          outputs: acc.outputs.concat(r.outputs),
        };
      },
      { updates: [], outputs: [] }
    );
  };
}

function every(arrFns, guards) {
  return function every_(s, ed, stg) {
    return arrFns.reduce(function (acc, fn) {
      var r = guards[fn](s, ed, stg);

      return r && acc;
    }, true);
  };
}

var NO_OUTPUT = [];
var NO_STATE_UPDATE = [];
var events = ["event3", "event2", "event1"];
var states = {
  Eღn1: "",
  "Group 1ღn2": { "Bღn2::n0": "", "Cღn2::n1": "", "Group 1ღn2::n2": { "Dღn2::n2::n0": "", "Dღn2::n2::n2": "" } },
};
function getKinglyTransitions(record) {
  var aF = record.actionFactories;
  var guards = record.guards;
  var actionList = ["logGroup1toH", "logBtoC", "logBtoD", "logCtoD", "logGroup1toD", "logGroup1toC", "logDtoD"];
  var predicateList = [];
  if (!contains(actionList, Object.keys(aF))) {
    console.error(
      "Some actions are missing either in the graph, or in the action implementation object! Cf actionFactories (you passed that) vs. actionList (from the graph) below. They must have the same items!"
    );
    console.error({ actionFactories: Object.keys(aF), actionList });
    var passedAndMissingInGraph = Object.keys(aF).filter(function (k) {
      return actionList.indexOf(k) === -1;
    });
    passedAndMissingInGraph.length > 0 &&
      console.error(
        "So the following actions were passed in parameters but do not match any action in the graph! This may happen if you modified the name of an action in the graph, but kept using the older name in the implementation! Please check.",
        passedAndMissingInGraph
      );
    var inGraphButNotImplemented = actionList.filter(function (k) {
      return Object.keys(aF).indexOf(k) === -1;
    });
    inGraphButNotImplemented.length > 0 &&
      console.error(
        "So the following actions declared in the graph are not implemented! Please add the implementation. You can have a look at the comments of the generated fsm file for typing information.",
        inGraphButNotImplemented
      );
    throw new Error(
      "Some actions implementations are missing either in the graph, or in the action implementation object!"
    );
  }
  if (!contains(predicateList, Object.keys(guards))) {
    console.error(
      "Some guards are missing either in the graph, or in the action implementation object! Cf guards (you passed that) vs. predicateList (from the graph) below. They must have the same items!"
    );
    console.error({ guards: Object.keys(guards), predicateList });
    throw new Error("Some guards are missing either in the graph, or in the guard implementation object!");
  }
  const transitions = [
    { from: "Group 1ღn2", event: "event3", to: "Eღn1", action: chain(["logGroup1toH"], aF) },
    { from: "Eღn1", event: "", to: { shallow: "Group 1ღn2" }, action: chain([], aF) },
    { from: "nok", event: "init", to: "Bღn2::n0", action: chain([], aF) },
    { from: "Bღn2::n0", event: "event2", to: "Cღn2::n1", action: chain(["logBtoC"], aF) },
    { from: "Bღn2::n0", event: "event1", to: "Dღn2::n2::n2", action: chain(["logBtoD"], aF) },
    { from: "Cღn2::n1", event: "", to: "Dღn2::n2::n0", action: chain(["logCtoD"], aF) },
    { from: "Group 1ღn2::n2", event: "init", to: "Dღn2::n2::n0", action: chain(["logGroup1toD"], aF) },
    { from: "Group 1ღn2", event: "init", to: "Cღn2::n1", action: chain(["logGroup1toC"], aF) },
    { from: "Dღn2::n2::n2", event: "event1", to: "Dღn2::n2::n0", action: chain(["logDtoD"], aF) },
  ];

  return transitions;
}

function createStateMachineFromGraph(fsmDefForCompile, settings) {
  var updateState = fsmDefForCompile.updateState;
  var initialExtendedState = fsmDefForCompile.initialExtendedState;

  var transitions = getKinglyTransitions({
    actionFactories: fsmDefForCompile.actionFactories,
    guards: fsmDefForCompile.guards,
  });

  var fsm = createStateMachine(
    {
      updateState,
      initialExtendedState,
      states,
      events,
      transitions,
    },
    settings
  );

  return fsm;
}

export { events, states, getKinglyTransitions, createStateMachineFromGraph };

```

The exported events, states, getKinglyTransitions can then be used in a regular JavaScript file as follows:

```js
    import {createStateMachine} from 'kingly';
    import {events, states, getKinglyTransitions} from 'tests/graphs/hierarchy-history-H.graphml.fsm.js';
(...)

    const guards = {};
    const actionFactories = {
      logGroup1toC: (s, e, stg) => traceTransition('Group1 -> C'),
      logBtoC: (s, e, stg) => traceTransition('B -> C'),
      logBtoD: (s, e, stg) => traceTransition('B -> D'),
      logCtoD: (s, e, stg) => traceTransition('C -> D'),
      logDtoGroup1H: (s, e, stg) => traceTransition('D -> Group1H'),
    };
    const fsmDef = {
      // NOTE: updateState and initialExtendedState are provided by the user
      updateState,
      initialExtendedState,
      events,
      states,
      transitions: getKinglyTransitions({ actionFactories, guards }),
    };
    const fsm = createStateMachine(fsmDef, settings);

``` 

Alternatively, the `createStateMachineFromGraph` function can also be used. The latter function has the same signature than the `createStateMachine` produced by the compiler, which allows switching between the compiler version and the interpreted version.

# Tests
Tests are run with [mocha](https://mochajs.org/). From the installation directory, run:

```bash
npm run tests
``` 

# Final note
I chose this process after plenty of reflection of pondering over what was the best approach for this functionality. A Babel plugin or macro was a possibility but the level of complexity was much higher -- both from a macro creator and a macro user perspective,and the predictable requirements in term of maintenance were also appreciable. The retained solution is to produce the outputs of the file conversion in a separate, independent JavaScript file. There is thus no necessity to write proprietary JavaScript, it is programming as usual.

This is a first version based on my personal usage. I am interested in hearing your comments and recommendations if you have them about a better way to handle the integration of a graph editor with Kingly JavaScript library. Feel free to open an issue.
