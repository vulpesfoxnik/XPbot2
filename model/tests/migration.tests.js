const redis = require('redis');
const bluebird = require('bluebird');
bluebird.promisifyAll(redis);
const client = redis.createClient(6379, '172.17.0.2');

client.flushallAsync()
    .then(r => console.log(r))
    .then(() => {});
