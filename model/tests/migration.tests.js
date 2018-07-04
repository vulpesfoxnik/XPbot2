const redis = require('redis');
const bluebird = require('bluebird');
bluebird.promisifyAll(redis);
const client = redis.createClient(6379, '172.17.0.2');
const faker = require('faker');

faker.seed(1048838329434);

function buildData(count) {
    return Array.from({length: count}, (x, i) => i).map((n) => {
        const obj = {
            character: faker.name.findName(),
            banned: faker.helpers.randomize(["FALSE", "FALSE", "FALSE", "FALSE", "FALSE", "TRUE"]),
            notices: faker.helpers.randomize(["FALSE", "FALSE", "FALSE", "FALSE", "FALSE", "TRUE"]),
            XP: faker.random.number(1999),
            Gold: faker.random.number(1999),
            title: faker.random.number(40),
            wornItems: randomArray(1, 3, (i) => faker.random.number(56))
        };
        obj.titleList = Array.from(new Set([obj.title, 0].concat(randomArray(0, 3, (i) => faker.random.number(40))))).join(",");
        obj.ownedItems = Array.from(new Set(obj.wornItems.concat([0, 4]).concat(randomArray(0, 3, (i) => faker.random.number(56))))).join(",");
        obj.wornItems = obj.wornItems.join(",");
        return obj;
    });
}

function randomArray(min, max, fn) {
    return [...Array.from({length: faker.random.number({min:min, max:max})}, (x, i) => fn(i))];
}

function scramble(data) {
    return data.map(d => {
        const chance = Number(faker.finance.amount(0, 1, 2));
        if (chance > 0.58) return d;
        else if (chance <= 0.58 && chance > 0.48) {
            const d1 = Object.create(d);
            delete d1.banned;
            delete d1.notices;
            return d1;
        }
        else if (chance <= 0.48 && chance > 0.43) {
            d.Gold = (faker.random.boolean() ? "0" : "") + String(d.Gold) + String(faker.random.number(9999));
            return d;
        }
        else if (chance <= 0.43 && chance > 0.37) {
            const d1 = Object.create(d);
            delete d1.titleList;
            return d1;
        }
        else if (chance <= 0.37 && chance > 0.15) {
            const d1 = Object.create(d);
            delete d1.XP;
            return d1;
        }
        else if (chance <= 0.15 && chance > 0.10) {
            const d1 = Object.create(d);
            d1.XP = "undefined" + d1.XP;
            return d1;
        }
        else if (chance <= 0.10 && chance > 0.05) {
            const d1 = Object.create(d);
            d1.Gold = "undefined" + d1.Gold;
            return d1;
        }
        else if (chance <= 0.05) {
            const d1 = Object.create(d);
            d1.Gold = "undefined" + d1.Gold;
            d1.XP = "undefined" + d1.XP;
            return d1;
        }
        else {
            return d;
        }
    });
}

client.flushallAsync()
    .then(r => console.log(r))
    .then(() => scramble(buildData(4000)))
    .then(objs => {
        return bluebird.all(objs.map(obj => {
            return client.hmsetAsync(obj.character, obj)
        }));
    })
    .then(r => console.log(r))
    .then(() => process.exit(0));