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
 * @param  {number} id
 * @param {string} title
 * @param {number} XP
 * @param {number} Gold
 * @param {boolean} hidden
 * @param {ItemType} type
 */
