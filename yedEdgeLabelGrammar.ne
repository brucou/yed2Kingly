MAIN -> OneTransitionLabel                             {% d => d[0] %}
| MultipleTransitionLabel                              {% d => d[0] %}
MultipleTransitionLabel -> ("|" OneTransitionLabel):+  {% d => d[0].map(x => x[1]) %}
OneTransitionLabel ->
  EventClause "[" GuardClause "]" _ "/" ActionsClause  {% d => ({event: d[0], guard: d[2], actions: d[6]}) %}
| EventClause "[" GuardClause "]" _                    {% d => ({event: d[0], guard: d[2], actions: []}) %}
| EventClause "/" ActionsClause                        {% d => ({event: d[0], guard: [], actions: d[2]}) %}
| EventClause                                          {% d => ({event: d[0], guard: [], actions: []}) %}
| "[" GuardClause "]" _ "/" ActionsClause              {% d => ({event: "", guard: d[1], actions: d[5]}) %}
| "/" ActionsClause                                    {% d => ({event: "", guard: [], actions: d[1]}) %}
| "[" GuardClause "]"                                  {% d => ({event: "", guard: d[1], actions: []}) %}

EventClause -> [^\/\[\]\|]:+                           {% d => d[0].join('') %}
GuardClause -> Guard ("," Guard):*                     {% d =>  [d[0]].concat(d[1].map(dd => dd[1]))  %}
Guard -> [^\[\],]:*                                     {% d => (d[0] || []).join('') %}
ActionsClause -> Action ("," Action):*                 {% d =>  [d[0]].concat(d[1].map(dd => dd[1]))  %}
Action        -> [^\/\|\[\]\(\),]:* ActionsComments:*  {% d => (d[0] || []).join('') %}
ActionsComments -> "(" __ ")" _
StringLiteral -> [\w]:+
  _ -> [\s]:*
  __ -> [^()]:*
