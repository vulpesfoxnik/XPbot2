'use strict';
const db = require('../../model');
const User = db.models.User;

function replyFn(message) {
    console.log(message);
}

function browse(args, data, reply = replyFn) {
    const argumentParser = /^(\d+)(?:\s+([1-9]?[1-9]|100))?$/;
    const matches = argumentParser.exec(args);
    if (!matches) {
        reply(`I apologize master, I'm unsure what to fetch for you. I understand it more like this:\nTo browse all users, say:
        !browse pageNumber
        !browse pageNumber perPage
        and just so you know, perPage is 1-100`);
        return Promise.resolve(undefined);
    }
    let [, pageNumber, perPage] = matches;
    pageNumber = Number(pageNumber) <= 0 ? 1 : Number(pageNumber);
    perPage = Number(perPage || 10);
    return User.count().then(count => {
        return User.scope("allData").findAll({limit: perPage, offset: (pageNumber - 1) * perPage}).then(users => {
            reply(`*** Page ${pageNumber} of ${(count / perPage).toFixed(0)} ***\n${users.map(function describeUser(user) {
                const equippedTitle = (user.equippedTitle && user.equippedTitle[0] && user.equippedTitle[0].titleView) || "(no-title)";
                const equippedItems = (user.equippedItems || []).map(item => `"${item.titleView}"`).join(", ");
                const ownedTitles = (user.ownedTitles || []).map(item => `"${item.titleView}"`).join(", ");
                const ownedItems = (user.ownedItems || []).map(item => `"${item.titleView}"`).join(", ");
                return `${equippedTitle} ${user.character} has ${user.gold} gold, and ${user.exp} exp, wearing ${equippedItems}.
    They own the following items: ${ownedItems}.
    They own the following titles: ${ownedTitles}.`
            }).join("\n")}`);
        }).catch(err => {
            reply("Sorry master, something went wrong when I was fetching your request.");
            console.error(err);
        });
    });
}

User.findAll({limit: 1}).then(user => {
    User.findAll({offset: 29, limit: 1}).then(user2 => {
        console.log(`Before: ${user2[0].exp}`);
        return user[0].copyTo(user2[0]);
    })
        // .then(user2 => User.find({where: {id: user2.id}}))
        .then(user2 => {
            console.log(`After: ${user2.exp}`);
        });
});