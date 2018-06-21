
module.exports = (function() {
    let self = {
        replaceUnderscores: (str, replacement=' ') => (str||'').replace(/_/g, replacement),
        replaceMultiWhitespace: (str, replacement=' ') => (str||'').replace(/\s{2,}/g, replacement),
        userBBC: (userName) => `[user]${userName}[/user]`,
        pprintObj: (obj) => JSON.stringify(obj, null, 2),
        split2int: (str) => (str || '').split(',').map(x => Number(x)).filter(x => !isNaN(x))
    };

    return self;
}());

function busca(lista, nombre) {
    for (var i = 0; i < lista.length; i++) {
        if (lista[i].title == nombre) {
            return i;
        }
    }
    return -1;
}

function busca2(lista, nombre) {
    var j = -1;
    for (var i = 0; i < lista.length; i++) {
        if (lista[i] == nombre) {
            j = i;
        }
    }
    return j;
}

function busca3(lista, nombre) {
    for (var i = 0; i < lista.length; i++) {
        if (lista[i].id == nombre) {
            return i;
        }
    }
    return -1;
}
