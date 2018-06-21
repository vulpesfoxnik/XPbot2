const {promisify} = require('util');
const redis = require("redis");
const client = redis.createClient(6379, "127.0.0.1");

const expKey = 'XP'
    , goldKey = 'Gold'
    , currentTitle = 'title'
    , titlesKey = 'titleList'
    , itemsKey = 'items'
    , equippedKey = 'wornItems'
    , inventoryKey = 'ownedItems'
    , noticeKey = 'notices';



class User {
    constructor(id) {
        this.id = id;
        this.instance = null;
    }

    populate(force) {
        return new Promise((resolve, reject) => {
            if (!force || this.instance) {
                resolve(this);
            } else {
                client.hgetall(this.id, (err, instance) => {
                    if (instance != null) {
                        this.instance = instance;
                        resolve(this);
                    } else {
                        reject(err);
                    }
                });
            }
        })
    };

    store() {
        return new Promise((resolve, reject) => {
            if (this.instance) {
                client.hmset(this.id, this.instance, (err, resp) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(this);
                    }
                });
            } else {
                reject({null: true});
            }
        });
    }

    copyTo(targetUser) {
        return this.populate(true).then(() => {
            targetUser.instance = Object.assign({}, targetUser.instance, {identifier: this.id});
            return targetUser.store();
        });
    }

    exists() {
        return new Promise((resolve) => {
            client.hexists(this.id, (error, exists) => {
                if (exists) {
                    resolve(this);
                } else {
                    reject(error);
                }
            });
        });
    }

    erase() {
        return new Promise((resolve, reject) => {
            client.del(this.id, (err, response) => {
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
        return new Promise((resolve, reject) => {
            client.hmset(this.id, {
                identifier: this.id,
                banned: String(Boolean(boolean)).toUpperCase()
            }, (err, resp) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(this);
                }
            });
        });
    }


    addExp(amount) {
        return new Promise((resolve, reject) => {
            client.hmget(this.id, expKey, (err, exp) => {
                const newValue = Number(exp) + Number(amount);
                if (isNaN(newValue)) {
                    reject({NaN: true});
                } else {
                    resolve(this.setExp(Math.min(newValue, 0)));
                }
            });
        });
    }

    setExp(amount) {
        return new Promise((resolve, reject) => {
            client.hmset(this.id, expKey, amount, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(this);
                }
            });
        });
    }

    addGold(amount) {
        amount = Number(amount);
        return isNaN(amount) ? Promise.reject({NaN: true}) : new Promise((resolve) => {
            client.hmget(this.id, goldKey, (err, exp) => {
                resolve(this.setExp(Math.max(exp + amount, 0)));
            });
        });
    }

    setGold(amount) {
        return new Promise((resolve, reject) => {
            client.hmset(this.id, goldKey, amount, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(this);
                }
            });
        });
    }


    reset() {
        return new Promise((resolve, reject) => {
            client.hmset(
                this.id
                , {
                    character: this.id, banned: "FALSE", XP: 0, Gold: 0, title: 0
                    , titleList: "0", wornItems: "0", ownedItems: "0,4", notices: "FALSE"
                }
                , (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(this);
                    }
                }
            );
        })
    }
}

module.exports = User;
