// Generated automatically by nearley, version 2.19.3
// http://github.com/Hardmath123/nearley
(function () {
function id(x) { return x[0]; }
var grammar = {
    Lexer: undefined,
    ParserRules: [
    {"name": "MAIN", "symbols": ["OneTransitionLabel"], "postprocess": d => d[0]},
    {"name": "MAIN", "symbols": ["MultipleTransitionLabel"], "postprocess": d => d[0]},
    {"name": "MultipleTransitionLabel$ebnf$1$subexpression$1", "symbols": [{"literal":"|"}, "OneTransitionLabel"]},
    {"name": "MultipleTransitionLabel$ebnf$1", "symbols": ["MultipleTransitionLabel$ebnf$1$subexpression$1"]},
    {"name": "MultipleTransitionLabel$ebnf$1$subexpression$2", "symbols": [{"literal":"|"}, "OneTransitionLabel"]},
    {"name": "MultipleTransitionLabel$ebnf$1", "symbols": ["MultipleTransitionLabel$ebnf$1", "MultipleTransitionLabel$ebnf$1$subexpression$2"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "MultipleTransitionLabel", "symbols": ["MultipleTransitionLabel$ebnf$1"], "postprocess": d => d[0].map(x => x[1])},
    {"name": "OneTransitionLabel", "symbols": ["EventClause", {"literal":"["}, "GuardClause", {"literal":"]"}, "_", {"literal":"/"}, "ActionsClause"], "postprocess": d => ({event: d[0], guard: d[2], actions: d[6]})},
    {"name": "OneTransitionLabel", "symbols": ["EventClause", {"literal":"["}, "GuardClause", {"literal":"]"}, "_"], "postprocess": d => ({event: d[0], guard: d[2], actions: []})},
    {"name": "OneTransitionLabel", "symbols": ["EventClause", {"literal":"/"}, "ActionsClause"], "postprocess": d => ({event: d[0], guard: [], actions: d[2]})},
    {"name": "OneTransitionLabel", "symbols": ["EventClause"], "postprocess": d => ({event: d[0], guard: [], actions: []})},
    {"name": "OneTransitionLabel", "symbols": [{"literal":"["}, "GuardClause", {"literal":"]"}, "_", {"literal":"/"}, "ActionsClause"], "postprocess": d => ({event: "", guard: d[1], actions: d[5]})},
    {"name": "OneTransitionLabel", "symbols": [{"literal":"/"}, "ActionsClause"], "postprocess": d => ({event: "", guard: [], actions: d[1]})},
    {"name": "OneTransitionLabel", "symbols": [{"literal":"["}, "GuardClause", {"literal":"]"}], "postprocess": d => ({event: "", guard: d[1], actions: []})},
    {"name": "EventClause$ebnf$1", "symbols": [/[^\/\[\]\|]/]},
    {"name": "EventClause$ebnf$1", "symbols": ["EventClause$ebnf$1", /[^\/\[\]\|]/], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "EventClause", "symbols": ["EventClause$ebnf$1"], "postprocess": d => d[0].join('')},
    {"name": "GuardClause$ebnf$1", "symbols": []},
    {"name": "GuardClause$ebnf$1$subexpression$1", "symbols": [{"literal":","}, "Guard"]},
    {"name": "GuardClause$ebnf$1", "symbols": ["GuardClause$ebnf$1", "GuardClause$ebnf$1$subexpression$1"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "GuardClause", "symbols": ["Guard", "GuardClause$ebnf$1"], "postprocess": d =>  [d[0]].concat(d[1].map(dd => dd[1]))},
    {"name": "Guard$ebnf$1", "symbols": []},
    {"name": "Guard$ebnf$1", "symbols": ["Guard$ebnf$1", /[^\[\],]/], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "Guard", "symbols": ["Guard$ebnf$1"], "postprocess": d => (d[0] || []).join('')},
    {"name": "ActionsClause$ebnf$1", "symbols": []},
    {"name": "ActionsClause$ebnf$1$subexpression$1", "symbols": [{"literal":","}, "Action"]},
    {"name": "ActionsClause$ebnf$1", "symbols": ["ActionsClause$ebnf$1", "ActionsClause$ebnf$1$subexpression$1"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "ActionsClause", "symbols": ["Action", "ActionsClause$ebnf$1"], "postprocess": d =>  [d[0]].concat(d[1].map(dd => dd[1]))},
    {"name": "Action$ebnf$1", "symbols": []},
    {"name": "Action$ebnf$1", "symbols": ["Action$ebnf$1", /[^\/\|\[\]\(\),]/], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "Action$ebnf$2", "symbols": []},
    {"name": "Action$ebnf$2", "symbols": ["Action$ebnf$2", "ActionsComments"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "Action", "symbols": ["Action$ebnf$1", "Action$ebnf$2"], "postprocess": d => (d[0] || []).join('')},
    {"name": "ActionsComments", "symbols": [{"literal":"("}, "__", {"literal":")"}, "_"]},
    {"name": "StringLiteral$ebnf$1", "symbols": [/[\w]/]},
    {"name": "StringLiteral$ebnf$1", "symbols": ["StringLiteral$ebnf$1", /[\w]/], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "StringLiteral", "symbols": ["StringLiteral$ebnf$1"]},
    {"name": "_$ebnf$1", "symbols": []},
    {"name": "_$ebnf$1", "symbols": ["_$ebnf$1", /[\s]/], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "_", "symbols": ["_$ebnf$1"]},
    {"name": "__$ebnf$1", "symbols": []},
    {"name": "__$ebnf$1", "symbols": ["__$ebnf$1", /[^()]/], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "__", "symbols": ["__$ebnf$1"]}
]
  , ParserStart: "MAIN"
}
if (typeof module !== 'undefined'&& typeof module.exports !== 'undefined') {
   module.exports = grammar;
} else {
   window.grammar = grammar;
}
})();
