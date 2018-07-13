"use strict";
/**
 * Purpose:
 *      File for loading the logger.json file into a proper set of Winston loggers
 *      Should look into colorizing and changing the default "JSON" logger to something more readable.
 *      This will assist in keeping logs of the bots actions to an actual file on the Windows enviroment,
 *      rather than relying on the redirect of git-bash
 */
const winston = require("winston");
const fs = require("fs");
const path = require("path");
const transportMap = Object.keys(winston.transports).reduce((p, k) => {
    p[k.toLowerCase()] = winston.transports[k];
    return p;
}, {});
// const loggingLevels = Object.keys(winston.config.npm.levels).map(k => k.toLowerCase());

const filename = path.join(__dirname, "..", "settings", "logger.json");
const config = JSON.parse(fs.readFileSync(filename, "utf8"));
module.exports = Object.keys(config).reduce((p, k) => {
    const transports = config[k].transports.map((t, i, arr) => {
        const klass = transportMap[t.type];
        if (t.parameters.filename !== undefined) {
            t.parameters.filename = path.join(__dirname, "..", t.parameters.filename)
        }
        return new klass(t.parameters);
    });
    const settings = { transports: transports };
    p.add(k, settings);
    return p;
}, new winston.Container());
