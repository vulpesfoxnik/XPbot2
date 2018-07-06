const db = require('../model');

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

// === Admin
XPBot2.prototype.browse = privateInteraction(adminOnly(function (args, data, reply) {
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
    return db.models.User.banByCharacter(name).then(user => {
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
