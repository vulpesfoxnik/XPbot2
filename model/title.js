const store = require('../plugins/etc/titles.js');

class Title {
  constructor(id) {
    this.id = Number(id);
    this.instance = null;
  }
  populate() {
    return new Promise((resolve, reject)=>{
      const entry = store.find(obj=>obj.id===this.id);
      if (entry) {
        this.instance = Object.assign({}, entry);
        resolve(this);
      } else {
        reject(null);
      }
    });
  }

  get name () {
    return this.instance && this.instance.title.replace(/_/g, ' ');
  }
}

module.exports = Title;