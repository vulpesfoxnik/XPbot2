function constant(value) {
    return {enumerable: true, value: value};
}
constant.hidden = function(value) { return {value: value}; };

function getterSetter(gerFn, setFn) {
    return {enumerable: true, get: getFn, set: setFn};
}
getterSetter.hidden = function(getFn, setFn) { return {get: getFn, set: setFn}; };

module.exports = {
    scanify: (value) => value.toLowerCase(),
    constant: constant,
    getterSetter: getterSetter,
};
