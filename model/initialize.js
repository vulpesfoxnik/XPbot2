"use strict";
const fs = require("fs");
const path = require("path");
const db = require('../model');
const {Op, Promise} = require("sequelize");
const logger = require("../util/logger").loggers.get("application");
Promise.promisifyAll(fs);

const ItemType = db.models.ItemType;
const Item = db.models.Item;
const Title = db.models.Title;
const shared = {};

// TODO: Inilialize Database Script
db.sync()
    .then(() => ItemType.count().then(count => count > 0 ? Promise.reject(count) : Promise.resolve(count)))
    .then(() => {
        return ItemType.bulkCreate([
            {id: 1, name: "unclassified", nameView: "Unclassified"},
            {id: 2, name: "item", nameView: "Item"},
            {id: 3, name: "garment", nameView: "Garment"},
            {id: 4, name: "armor", nameView: "Armor"},
            {id: 5, name: "weapon", nameView: "Weapon"}
        ]);
    }, () => logger.info("ItemTypes already loaded. If there is an error, you may need to delete the database."))
    .then(() => ItemType.findAll().then(types => types.reduce((p, t) => {
        p[t.id] = t;
        return p;
    }, {})))
    .then(types => { shared.types = shared; })
    .then(() => Item.count().then(count => count > 0 ? Promise.reject(count) : Promise.resolve(count)
            .then(() => fs.readFileAsync(path.join(__dirname, "..", "data", "itemsNew.json")).then(data => JSON.parse(data)))
    ))
    .then(items => {})

    .catch((err) => logger.info(`Items already loaded. If there is an error, you may need to delete the database. Reason: ${err}`))
;