"use strict";
const Sequelize = require("sequelize");
const fs = require("fs");
const path = require("path");

let filename = path.join(__dirname, "..", "settings", "db.json");
let config = JSON.parse(fs.readFileSync(filename, "utf8"));
config.storage = config.storage && path.join(path.dirname(filename), config.storage);

const sequelize = new Sequelize(config);

sequelize.import("./item");
sequelize.import("./itemType");
sequelize.import("./title");
sequelize.import("./user");

Object.keys(sequelize.models).forEach(modelName => {
    const model = sequelize.models[modelName];
    if (typeof(model.associate) === "function") {
        model.associate(sequelize.models);
    }

    if (typeof(model.associateScopes) === "function") {
        model.associateScopes(sequelize.models);
    }
});

module.exports = sequelize;
