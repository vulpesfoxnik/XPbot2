const fs = require('fs');
/**
 * @type {Array<ItemSource>}
 */
module.exports = JSON.parse(fs.readFileSync("./data/items.json"))||[];
/**
 * @typedef {('garment'|'weapon'|'armor'|'item'|'unclassified')} ItemType
 */

/**
 * @typedef {object} ItemSource
 * @prop  {number} id
 * @prop {string} title
 * @prop {number} XP
 * @prop {number} Gold
 * @prop {boolean} hidden
 * @prop {ItemType} type
 */
