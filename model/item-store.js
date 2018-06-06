const fs = require('fs');
/**
 * @enum {ItemType}
 */
const itemTypes = Object.freeze({
  armor: 'armor'
  , weapon: 'weapon'
  , default: 'item'
  , garment: 'garment'
  , undefined: 'unclassified'
});

/**
 * @type {ItemType[]}
 */
const possibleItemType = Object.values(itemTypes);

module.exports = new class ItemStore {

  static TYPES = itemTypes;

  constructor(store){
    /**
     * @property {Array<ItemSource>} store
     */
    this.store = store;
  }

  /**
   * Update or Create a item
   * @param {string} humanId
   * @param {ItemType} type
   * @param {number} Gold
   * @param {number} XP
   * @returns {Promise<[ItemStore, ItemSource, boolean]>}
   */
  listItem(humanId, type = itemTypes.default, Gold = 0, XP = 0) {
    const normalId = humanId.toLowerCase();
    type = possibleItemType.find(x=>x===type) || itemTypes.undefined;
    return new Promise((resolve, reject)=>{
      try  {
        let output;
        const existing = this.store.find((x)=>x.title.toLowerCase() === normalId);
        if (existing) {
          output = existing;
          existing.type = type;
          existing.XP = XP;
          existing.Gold = Gold;
        } else {
          this.store.push(output = {id: this.store.length, type, Gold, XP, hidden: false});
        }
        this.save();
        resolve([this, output, Boolean(existing)]);
      } catch (e) {
        reject({io:true});
      }
    });
  }

  hide(humanId, state = true) {
    return new Promise((resolve, reject)=>{
      const uncasedID = humanId.toLowerCase();
      const item = this.store.find((x)=>x.title.toLowerCase() === uncasedID);
      if (item) {
        item.hidden = Boolean(state);
        this.save();
        resolve(this)
      }
      resolve({lost:true});
    });
  }
  /**
   * @returns {ItemSource[]}
   */
  get armor() {
    return this.store.filter(x=>x.type === itemTypes.armor);
  }

  /**
   * @returns {ItemSource[]}
   */
  get garment() {
    return this.store.filter(x=>x.type=== itemTypes.garment);
  }

  /**
   * @returns {ItemSource[]}
   */
  get weapon() {
    return this.store.filter(x=>x.type=== itemTypes.weapon);
  }

  /**
   * @returns {ItemSource[]}
   */
  get item() {
    return this.store.filter(x=>x.type=== itemTypes.default);
  }

  /**
   * @returns {ItemSource[]}
   */
  get misc() {
    return this.store.filter(x=>x.type=== itemTypes.undefined);
  }

  save() {
    fs.writeFileSync("./data/items.json", JSON.stringify(this.store, null, 2));
  }
}(require('../plugins/etc/items.js'));