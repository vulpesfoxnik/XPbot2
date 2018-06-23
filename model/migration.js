const redis = require("redis");
const client = redis.createClient(6379, "172.17.0.2");
const db = require('../model')();
const Op = require('sequelize').Op;
const Promise = require('sequelize').Promise;
const {scanify} = require("./util");
const crypto = require('crypto');
const {performance} = require('perf_hooks');

const legacyUserKeys = {
    gold: "gold",
    exp: "XP",
    ownedTitles: "titleList",
    equippedTitle: "title",
    ownedItems: "ownedItems",
    equippedItems: "wornItems",
    notices: "notices",
    banned: "banned",
    identifier: "character"
};

function iLookup(obj, key) {
    const origKey = Object.keys(obj).find(k => k.toLowerCase() === key.toLowerCase());
    return origKey && obj[origKey];
}

function fuzzyBoolean(value) {
    return !(/^(f(?:alse)?|0)$/i).exec(String(value))
}

const iBooleanLookup = (obj, key) => fuzzyBoolean(iLookup(obj, key) || false);

function scan(cursor, count=1000) {
    return new Promise((resolve, reject) => {
        client.scan(String(cursor), "MATCH", "*", "COUNT", String(count), function (err, data) {
            if (err) {
                reject(err);
            }
            resolve(data);
        });
    });
}

function getRedisUser(key) {
    return new Promise((resolve, reject) => {
        client.hgetall(key, (err, instance) => {
            if (err) {
                reject(err);
            }
            resolve(instance);
        });
    });
}

function keyIsOfType(key) {
    return new Promise((resolve, reject) => {
        client.type(key, (err, type) => {
            if (err) {
                reject(err);
            }
            resolve({key: key, type: type});
        });
    });
}

const User = db.models.User;
const Item = db.models.Item;
const Title = db.models.Title;
const cache = {
    items: undefined,
    titles: undefined,
};

const crawlResults = (scanResult) => {
    console.log(JSON.stringify(scanResult));
    const nextCursor = scanResult[0];
    const keys = scanResult[1];
    return Promise.all(keys.map(keyIsOfType))
        .then(typedKeys => Promise.all(typedKeys.filter(k => k.type === "hash").map(k => getRedisUser(k.key))))
        .then(users => {
            if (!users || users.length < 1) return Promise.resolve(null);
            const normalizedUsers = users.filter(u => Boolean(iLookup(u, legacyUserKeys.equippedTitle))).map(user => {
                const id = scanify(String(iLookup(user, legacyUserKeys.identifier)));
                return {
                    id: id,
                    model: {
                        identifier: String(iLookup(user, legacyUserKeys.identifier)),
                        identifierScan: id,
                        gold: Number(iLookup(user, legacyUserKeys.gold) || 0),
                        exp: Number(iLookup(user, legacyUserKeys.exp) || 0),
                        banned: iBooleanLookup(user, legacyUserKeys.banned),
                        notices: iBooleanLookup(user, legacyUserKeys.notices),
                        password: crypto.randomBytes(16).toString('base64'),
                    },
                    additionalProperties: {
                        ownedItemIds: (iLookup(user, legacyUserKeys.ownedItems) || "0,4").split(",").map(Number),
                        equippedItemIds: (iLookup(user, legacyUserKeys.ownedItems) || "0,4").split(",").map(Number),
                        equippedTitleIds: (iLookup(user, legacyUserKeys.equippedTitle) || "0").split(",").map(Number),
                        ownedTitleIds: (iLookup(user, legacyUserKeys.ownedTitles) || "0").split(",").map(Number),
                    },
                };
            });

            if (!normalizedUsers || normalizedUsers.length < 1) return Promise.resolve(null);
            return User.bulkCreate(normalizedUsers.map(u => u.model))
                .then(() => User.findAll({where: {identifierScan: {[Op.in]: normalizedUsers.map(u => u.id)}}}))
                .then(models => models && Promise.all(models.map(user => {
                    const props = normalizedUsers.find(u => u.id === user.identifierScan).additionalProperties;
                    user.setOwnedItems(cache.items.filter(i => props.ownedItemIds.includes(i.id)));
                    user.setEquippedItems(cache.items.filter(i => props.equippedItemIds.includes(i.id)));
                    user.setOwnedTitles(cache.titles.filter(i => props.ownedTitleIds.includes(i.id)));
                    user.setEquippedTitle(cache.titles.filter(i => props.equippedTitleIds.includes(i.id)));
                    return user.save();
                })));
        })
        .then(() => nextCursor !== "0" ? scan(nextCursor).then(crawlResults) : true);
};

console.log("Migrating...");
const start = performance.now();
Promise.all([Item.findAll(), Title.findAll()])
    .then(results => {
        cache.items = results[0];
        cache.titles = results[1];
        return 0;
    })
    .then(scan)
    .then(crawlResults)
    .then(() => {
        console.log("Complete!");
        const stop = performance.now();
        console.log(`Time taken: ${stop - start} milliseconds`);
    })
    .catch(err => console.log(err));

