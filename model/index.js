const Sequelize = require('sequelize');

module.exports = function(sequelize) {
    'use strict';
    if (sequelize === undefined) {
        const dsn = `sqlite:${__dirname}/../data/data2.sqlite3`;
        sequelize = new Sequelize(dsn);
    }

    sequelize.import('./item');
    sequelize.import('./itemType');
    sequelize.import('./title');
    sequelize.import('./user');

    Object.keys(sequelize.models).forEach(modelName => {
        if (typeof(sequelize.models[modelName].associate) === 'function') {
            sequelize.models[modelName].associate(sequelize.models);
        }
    });

    return sequelize;
};