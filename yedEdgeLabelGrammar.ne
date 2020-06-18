MAIN -> OneTransitionLabel                             {% d => d[0] %}
| MultipleTransitionLabel                              {% d => d[0] %}
MultipleTransitionLabel -> ("|" OneTransitionLabel):+  {% d => d[0].map(x => x[1]) %}
OneTransitionLabel ->
  EventClause "[" GuardClause "]" _ "/" ActionsClause  {% d => ({event: d[0][0].join(''), guard: d[2][0].join(''), actions: d[6][0].join('')}) %}
| EventClause "[" GuardClause "]" _                    {% d => ({event: d[0][0].join(''), guard: d[2][0].join(''), actions: ""}) %}
| EventClause "/" ActionsClause                        {% d => ({event: d[0][0].join(''), guard: "", actions: d[2][0].join('')}) %}
| EventClause                                          {% d => ({event: d[0][0].join(''), guard: "", actions: ""}) %}
| "[" GuardClause "]" _ "/" ActionsClause              {% d => ({event: "", guard: d[1][0].join(''), actions: d[5][0].join('')}) %}
| "/" ActionsClause                                    {% d => ({event: "", guard: "", actions: d[1][0].join('')}) %}
| "[" GuardClause "]"                                  {% d => ({event: "", guard: d[1][0].join(''), actions: ""}) %}

EventClause -> [^\/\[\]\|]:+
GuardClause -> [^\[\]]:*
ActionsClause -> [^\/\|\[\]]:*
StringLiteral -> [\w]:+
  _ -> [\s]:*

