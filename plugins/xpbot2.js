const strings = require("./lib/resource/strings");
const db = require('../model')();

function XPBot2(fChat, channel) {
    this.fChat = fChat;
    this.channel = channel;
}

function adminOnly(fn) {
    return (args, data, ...extra) => {
        if (this.fChat.isUserChatOP(this.channel, data.character)) {
            fn.apply(this, [args, data, ...extra]);
        } else {
            this.fChat.sendPrivMessage(data.character, strings.UNAUTHORIZED);
        }
    };
}

// === Admin
XPBot2.prototype.browse = function (args, data) {
};
XPBot2.prototype.banUser = adminOnly(function banUser(args, data) {
    const argRegex1 = /^"([^"]+)"$/;
    const argRegex2 = /^([^ ]+)$/;
    const reply = msg => this.fChat.sendPrivMessage(data.character, msg);
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
});
XPBot2.prototype.ban = XPBot2.prototype.banUser;
XPBot2.prototype.unbanUser = function (args, data) {
};
XPBot2.prototype.unban = function (args, data) {
};
XPBot2.prototype.grantXP = function (args, data) {
};
XPBot2.prototype.grantGold = function (args, data) {
};
XPBot2.prototype.grantTitle = function (args, data) {
};
XPBot2.prototype.revokeTitle = function (args, data) {
};
XPBot2.prototype.replicateUser = function (args, data) {
};
XPBot2.prototype.deleteUser = function (args, data) {
};
XPBot2.prototype.sellItem = function (args, data) {
};
XPBot2.prototype.delistItem = function (args, data) {
};

// == User
XPBot2.prototype.tradeXP = function (args, data) {
};
XPBot2.prototype.tradeGold = function (args, data) {
};
XPBot2.prototype.brag = function (args, data) {
};
XPBot2.prototype.myStats = function (args, data) {
};
XPBot2.prototype.view = function (args, data) {
};
XPBot2.prototype.equipTitle = function (args, data) {
};
XPBot2.prototype.equipItem = function (args, data) {
};
XPBot2.prototype.unequipItem = function (args, data) {
};
XPBot2.prototype.grantSilence = function (args, data) {
};
XPBot2.prototype.revokeSilence = function (args, data) {
};
