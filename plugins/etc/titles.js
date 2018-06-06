const fs = require('fs');
/**
 * @type {Array<TitleSource>}
 */
module.exports = JSON.parse(fs.readFileSync("./data/titles.json")) ||[];

/**
 * @typedef {object} TitleSource
 * @prop  {number} id
 * @prop {string} title
 * @prop {number} XP
 * @prop {number} Gold
 * @prop {boolean} hidden
 */
