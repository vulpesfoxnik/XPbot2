const db = require('../model');
const User = db.models.User;
const Item = db.models.Item;
const Title = db.models.Title;

function XPBot2(fChat, channel) {
    this.fChat = fChat;
    this.channel = channel;
}

module.exports = XPBot2;

function adminOnly(fn) {
    return function (args, data, reply, ...extra) {
        if (this.fChat.isUserChatOP(this.channel, data.character)) {
            return fn.call(this, args, data, reply, ...extra);
        } else {
            reply("You are not my master!");
        }
    };
}

function privateInteraction(fn) {
    return function (args, data, ...extra) {
        return fn.call(this, args, data, msg => this.fChat.sendPrivMessage(data.character, msg), ...extra);
    };
}

/**
 *
 * @param {User} user
 */
function describeUser(user) {
    const equippedTitle = (user.equippedTitle && user.equippedTitle[0].titleView) || "(no-title)";
    const equippedItems = (user.equippedItems || []).map(item => `"${item.titleView}"`).join(", ");
    const ownedTitles = (user.ownedTitles || []).map(item => `"${item.titleView}"`).join(", ");
    const ownedItems = (user.ownedItems || []).map(item => `"${item.titleView}"`).join(", ");
    return `${equippedTitle} ${user.character} has ${user.gold} gold, and ${user.exp} exp, wearing ${equippedItems}.
    They own the following items: ${ownedItems}.
    They own the following titles: ${ownedTitles}.`
}

// === Admin
XPBot2.prototype.browse = privateInteraction(adminOnly(function browse(args, data, reply) {
    const argumentParser = /^(\d+)(?:\s+([1-9]?[1-9]|100))?$/;
    const matches = argumentParser.exec(args);
    if (!matches) {
        reply(`I apologize master, I'm unsure what to fetch for you. I understand it more like this:
    To browse all users, say:
    !browse page
    !browse page 1-100`);
        return Promise.resolve(undefined);
    }
    let [, pageNumber, perPage] = matches;
    pageNumber = Number(pageNumber);
    perPage = Number(perPage || 20);
    return User.scope("allData").findAll({limit: perPage, offset: pageNumber * perPage}).then(users => {
        reply(`*** Page ${pageNumber + 1} ***\n${users.map(describeUser).join("\n")}`);
    }).catch(err => {
        reply("Sorry master, something went wrong when I was fetching your request.");
    });
}));
XPBot2.prototype.ban = XPBot2.prototype.banUser = privateInteraction(adminOnly(function banUser(args, data, reply) {
    const argRegex1 = /^"([^"]+)"$/;
    const argRegex2 = /^([^ ]+)$/;
    const parsedArgs = argRegex1.exec(args) || argRegex2.exec(args);
    if (!parsedArgs) {
        reply(`I apologize master, I don't understand your request. Please phrase it like this:
        To ban a user, say:
        !banUser "UserName"
        !ban "UserName"`);
        return Promise.resolve();
    }
    const name = parsedArgs[1];
    return User.banByCharacter(name).then(user => {
        reply(`Master, ${user.userCode} has been banished from the realm!`);
        return user;
    }, (reject) => {
        reply(`Master, I have failed. ${name} could not be banished!`);
        return reject;
    }).catch(err => {
        reply(`Master, I was unable to find ${name},`)
    });
}));

XPBot2.prototype.unban = XPBot2.prototype.unbanUser = privateInteraction(adminOnly(function (args, data, reply) {
}));
XPBot2.prototype.grantXP = privateInteraction(adminOnly(function (args, data, reply) {
}));
XPBot2.prototype.grantGold = privateInteraction(adminOnly(function (args, data, reply) {
}));
XPBot2.prototype.grantTitle = privateInteraction(adminOnly(function (args, data, reply) {
}));
XPBot2.prototype.revokeTitle = privateInteraction(adminOnly(function (args, data, reply) {
}));
XPBot2.prototype.transferUser = privateInteraction(adminOnly(function (args, data, reply) {
}));

XPBot2.prototype.deleteUser = privateInteraction(adminOnly(function (args, data, reply) {
}));

XPBot2.prototype.sellItem = privateInteraction(adminOnly(function (args, data, reply) {
}));
XPBot2.prototype.delistItem = privateInteraction(adminOnly(function (args, data, reply) {
}));

// == User
XPBot2.prototype.tradeXP = privateInteraction(function (args, data, reply) {
});
XPBot2.prototype.tradeGold = privateInteraction(function (args, data, reply) {
});
XPBot2.prototype.brag = privateInteraction(function (args, data, reply) {
});
XPBot2.prototype.myStats = privateInteraction(function (args, data, reply) {
});
XPBot2.prototype.view = privateInteraction(function (args, data, reply) {
});
XPBot2.prototype.equipTitle = privateInteraction(function (args, data, reply) {
});
XPBot2.prototype.equipItem = privateInteraction(function (args, data, reply) {
});
XPBot2.prototype.unequipItem = privateInteraction(function (args, data, reply) {
});
XPBot2.prototype.grantSilence = privateInteraction(function (args, data, reply) {
});
XPBot2.prototype.revokeSilence = privateInteraction(function (args, data, reply) {
});
