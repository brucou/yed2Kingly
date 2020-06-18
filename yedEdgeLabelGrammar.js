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
    {"name": "OneTransitionLabel", "symbols": ["EventClause", {"literal":"["}, "GuardClause", {"literal":"]"}, "_", {"literal":"/"}, "ActionsClause"], "postprocess": d => ({event: d[0][0].join(''), guard: d[2][0].join(''), actions: d[6][0].join('')})},
    {"name": "OneTransitionLabel", "symbols": ["EventClause", {"literal":"["}, "GuardClause", {"literal":"]"}, "_"], "postprocess": d => ({event: d[0][0].join(''), guard: d[2][0].join(''), actions: ""})},
    {"name": "OneTransitionLabel", "symbols": ["EventClause", {"literal":"/"}, "ActionsClause"], "postprocess": d => ({event: d[0][0].join(''), guard: "", actions: d[2][0].join('')})},
    {"name": "OneTransitionLabel", "symbols": ["EventClause"], "postprocess": d => ({event: d[0][0].join(''), guard: "", actions: ""})},
    {"name": "OneTransitionLabel", "symbols": [{"literal":"["}, "GuardClause", {"literal":"]"}, "_", {"literal":"/"}, "ActionsClause"], "postprocess": d => ({event: "", guard: d[1][0].join(''), actions: d[5][0].join('')})},
    {"name": "OneTransitionLabel", "symbols": [{"literal":"/"}, "ActionsClause"], "postprocess": d => ({event: "", guard: "", actions: d[1][0].join('')})},
    {"name": "OneTransitionLabel", "symbols": [{"literal":"["}, "GuardClause", {"literal":"]"}], "postprocess": d => ({event: "", guard: d[1][0].join(''), actions: ""})},
    {"name": "EventClause$ebnf$1", "symbols": [/[^\/\[\]\|]/]},
    {"name": "EventClause$ebnf$1", "symbols": ["EventClause$ebnf$1", /[^\/\[\]\|]/], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "EventClause", "symbols": ["EventClause$ebnf$1"]},
    {"name": "GuardClause$ebnf$1", "symbols": []},
    {"name": "GuardClause$ebnf$1", "symbols": ["GuardClause$ebnf$1", /[^\[\]]/], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "GuardClause", "symbols": ["GuardClause$ebnf$1"]},
    {"name": "ActionsClause$ebnf$1", "symbols": []},
    {"name": "ActionsClause$ebnf$1", "symbols": ["ActionsClause$ebnf$1", /[^\/\|\[\]]/], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "ActionsClause", "symbols": ["ActionsClause$ebnf$1"]},
    {"name": "StringLiteral$ebnf$1", "symbols": [/[\w]/]},
    {"name": "StringLiteral$ebnf$1", "symbols": ["StringLiteral$ebnf$1", /[\w]/], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "StringLiteral", "symbols": ["StringLiteral$ebnf$1"]},
    {"name": "_$ebnf$1", "symbols": []},
    {"name": "_$ebnf$1", "symbols": ["_$ebnf$1", /[\s]/], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "_", "symbols": ["_$ebnf$1"]}
]
  , ParserStart: "MAIN"
}
if (typeof module !== 'undefined'&& typeof module.exports !== 'undefined') {
   module.exports = grammar;
} else {
   window.grammar = grammar;
}
})();
