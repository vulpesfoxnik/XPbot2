const fs = require('fs');
/**
 * @type {Array<TitleSource>}
 */
module.exports = JSON.parse(fs.readFileSync("./data/titles.json")) ||[];

/**
 * @typedef {object} TitleSource
 * @param  {number} id
 * @param {string} title
 * @param {number} XP
 * @param {number} Gold
 * @param {boolean} hidden
 */
