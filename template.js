const implDoStr = `
function chain(arrFns, actions) {
  return function chain_(s, ed, stg) {
    return (
      arrFns.reduce(function(acc, fn) {
        var r = actions[fn](s, ed, stg);

        return {
          updates: acc.updates.concat(r.updates),
          outputs: acc.outputs.concat(r.outputs),
        };
      }, { updates: [], outputs: [] })
    );
  };
}
`;

const implEveryStr = `
function every(arrFns, guards) {
  return function every_(s, ed, stg) {
    return (
      arrFns.reduce(function(acc, fn) {
        var r = guards[fn](s, ed, stg);

        return r && acc;
      }, true)
    );
  };
}
`;

module.exports = {
  implDoStr,
  implEveryStr
}
