"use strict";
/**
 * Purpose: migrate all user-like objects that XP-bot had made in version 1 to a proper SQL database (sqlite for now)
 * This way we can avoid any lingering issues related to the poor redis setup.
 * Likely we need to inform the admin to send back the redis_archive.json and the logs to allow us to determine if
 * everything went smoothly
 */
const redis = require("redis");
const client = redis.createClient(6379, "172.17.0.2");
const db = require('../model');
const {Op, Promise} = require("sequelize");
const {scanify} = require("./util");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const {performance} = require("perf_hooks");
const logger = require("../util/logger").loggers.get("application");

const legacyUserKeys = {
    gold: "gold",
    exp: "XP",
    ownedTitles: "titleList",
    equippedTitle: "title",
    ownedItems: "ownedItems",
    equippedItems: "wornItems",
    notices: "notices",
    banned: "banned",
    character: "character"
};

function iLookup(obj, key) {
    const origKey = Object.keys(obj).find(k => k.toLowerCase() === key.toLowerCase());
    return origKey && obj[origKey];
}

function fuzzyBoolean(value) {
    return !(/^(f(?:alse)?|0)$/i).exec(String(value))
}

const iBooleanLookup = (obj, key) => fuzzyBoolean(iLookup(obj, key) || false);

function scan(cursor, count = 50) {
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

function SafeNumber(value) {
    const nValue = Number(value);
    return isNaN(nValue) ? null : nValue;
}

function generatePassword(value) {
    return crypto.randomBytes(16).toString("base64");
}

function timeConversion(millisec) {
    const seconds = (millisec / 1000).toFixed(1);
    const minutes = (millisec / (1000 * 60)).toFixed(1);
    const hours = (millisec / (1000 * 60 * 60)).toFixed(1);
    const days = (millisec / (1000 * 60 * 60 * 24)).toFixed(1);

    if (seconds < 60) {
        return seconds + " seconds";
    } else if (minutes < 60) {
        return minutes + " minutes";
    } else if (hours < 24) {
        return hours + " hours";
    } else {
        return days + " days"
    }
}

const User = db.models.User;
const Item = db.models.Item;
const Title = db.models.Title;
const cache = {
    items: undefined,
    titles: undefined,
};
const archivePath = path.join(__dirname, "archived_redis.json");
const redisMap = {};

const crawlResults = (scanResult) => {
    // TODO: Revisit as a loop making a large Promise that executes all of the items as fast as possible.
    const nextCursor = scanResult[0];
    const keys = scanResult[1];
    crawlResults.count += 1;
    logger.info(`Search #${crawlResults.count}, found ${keys.length} keys.`);
    return Promise.all(keys.map(keyIsOfType))
        .then(typedKeys => Promise.all(typedKeys.filter(k => k.type === "hash").map(k => getRedisUser(k.key)
            .then(u => ({key: k.key, user: u})))/*endMap*/))
        .then(users => {
            users.reduce((m, u) => {
                m[u.key] = u.user;
                return m;
            }, redisMap);
            if (!users || users.length < 1) return Promise.resolve(null);
            const normalizedUsers = users.map(u => u.user).filter(u => Boolean(iLookup(u, legacyUserKeys.equippedTitle))).map(user => {
                const id = scanify(String(iLookup(user, legacyUserKeys.character)));
                return {
                    id: id,
                    model: {
                        character: String(iLookup(user, legacyUserKeys.character)),
                        characterScan: id,
                        gold: (SafeNumber(iLookup(user, legacyUserKeys.gold)) || 0),
                        exp: (SafeNumber(iLookup(user, legacyUserKeys.exp)) || 0),
                        banned: iBooleanLookup(user, legacyUserKeys.banned),
                        notices: iBooleanLookup(user, legacyUserKeys.notices),
                        password: generatePassword(id),
                    },
                    additionalProperties: {
                        ownedItemIds: (iLookup(user, legacyUserKeys.ownedItems) || "0,4").split(",").map(SafeNumber),
                        equippedItemIds: (iLookup(user, legacyUserKeys.equippedItems) || "0,4").split(",").map(SafeNumber),
                        equippedTitleIds: (iLookup(user, legacyUserKeys.equippedTitle) || "0").split(",").map(SafeNumber),
                        ownedTitleIds: (iLookup(user, legacyUserKeys.ownedTitles) || "0").split(",").map(SafeNumber),
                    },
                };
            });

            if (!normalizedUsers || normalizedUsers.length < 1) return Promise.resolve(null);
            return User.bulkCreate(normalizedUsers.map(u => u.model))
                .then(() => User.findAll({where: {characterScan: {[Op.in]: normalizedUsers.map(u => u.id)}}}))
                .then(models => Promise.all((models || []).map(user => {
                    const props = normalizedUsers.find(u => u.id === user.characterScan).additionalProperties;
                    return Promise.all([
                        user.setOwnedItems(cache.items.filter(i => props.ownedItemIds.includes(i.id))),
                        user.setEquippedItems(cache.items.filter(i => props.equippedItemIds.includes(i.id))),
                        user.setOwnedTitles(cache.titles.filter(i => props.ownedTitleIds.includes(i.id))),
                        user.setEquippedTitle(cache.titles.filter(i => props.equippedTitleIds.includes(i.id)))
                    ]).then(() => user.save());
                })));
        })
        .then(() => nextCursor !== "0" ? scan(nextCursor).then(crawlResults) : Promise.resolve(true));
};
crawlResults.count = 0;

const start = performance.now();
db.authenticate()
    .then(() => User.count())
    .then(count => count > 0 ? Promise.reject("Database already migrated.") : Promise.resolve())
    .then(() => Promise.all([Item.findAll(), Title.findAll()]))
    .then(results => {
        cache.items = results[0];
        cache.titles = results[1];
        return 0;
    })
    .then(zero => {
        logger.info("Migrating...");
        return zero;
    })
    .then(scan)
    .then(crawlResults)
    .then(() => {
        fs.writeFileSync(archivePath, JSON.stringify(redisMap), "utf8");
        return Promise.resolve(true);
    })
    .then(() => {
        logger.info("Complete!");
        const stop = performance.now();
        logger.info(`Time taken: ${timeConversion(stop - start)}`);
        return Promise.resolve(true);
    })
    .then(() => process.exit(0))
    .catch(err => {
        logger.error(err);
        process.exit(-1);
    });
