const {promisify} = require('util');
const redis = require("redis");
const client = redis.createClient(6379, "127.0.0.1");



class User {
  constructor(id) {
    this.id = id;
    this.instance = null;
  }
  populate() {
    return new Promise((resolve, reject)=>{
      client.hgetall(this.id, (err, instance)=>{
        if (instance != null) {
          this.instance = instance;
          resolve(this);
        } else {
          reject(err);
        }
      });
    })
  };

  copyTo(user) {
    return user.populate().then((user)=>new Promise((resolve)=>{
      const newData = Object.assign({}, user.instance, {identifier: this.id});
      client.hmset(this.id, newData, (err, resp)=>{
        this.populate().finally(()=>resolve(this));
      });
    }));
  }

  exists() {
    return new Promise((resolve)=>{
      client.hexists(this.id, (error, exists)=>{
        if (exists) {
          resolve(this);
        } else {
          reject(error);
        }
      });
    });
  }

  erase() {
    return new Promise((resolve, reject)=>{
      client.del(this.id, (err, response)=>{
        if (err) {
          reject(err);
        } else {
          resolve(null);
        }
      });
    })
  }

  get userCode() {
    return `[user]${this.id}[/user]`;
  }

  get userIcon() {
    return `[icon]${this.id}[/icon]`
  }

  ban(boolean) {
    return new Promise((resolve, reject)=>{
      client.hmset(this.id,{identifier: this.id, banned: Boolean(boolean)}, (err, resp)=>{
        if (err) {
          reject(err);
        } else {
          resolve(this);
        }
      });
    });
  }

  /**
   * @param {Title} title
   */
  giveTitle(title) {
    return this.populate().then(()=>{
      const titles = new Set(this.instance.titles)
    });
  }

  giveItem(item) {

  }

  giveExp() {

  }
  giveGold() {

  }

  giveTitle(title) {

  }
  takeTitle(title) {

  }

  snapshot() {

  }

  delete(){}
}