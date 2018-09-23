const db = require('../model').db;
const {User, Item, Title} = db.models;
const {user:userBBC, italic: iBBC, underline:uBBC, sub:subBBC} = require('../utility/b-b-code');
const {constant} = require('./util');
const configuration= require('./etc/config');
const [minWordCount, nullReward, largestReward, postRewardR] = ((postRewards)=>{
  const nullReward = {wordCount: 0, xp: 0, gold: 0};
  const sorted = postRewards.slice().sort((a, b)=> a.wordCount - b.wordCount);
  return [
    (sorted[0]||nullReward).wordCount|| 0
    , nullReward
    , sorted[sorted.length - 1] || nullReward
    , sorted
  ];
})(configuration.postRewards);


const XPBot2PO = XPBot2.prototype;
function XPBot2(fChat, channel) {
  this.fChat = fChat;
  this.channel = channel;


  fChat.addJoinListener((parent, event) => {
    if (event.channel === this.channel) {
      const character = event.character.identity;
      User.exists(character).catch(() => this.registerNewUser(character));
    }
  });

  fChat.addMessageListener((parent, data)=>{
    const wordCount = data.message.split(/\s+/).length;
    if (data.channel === this.channel && wordCount >= minWordCount) {
      const character = data.character.identity;
      User.findByName(character).then((user)=>this.recordMessageXP(user, wordCount), ()=>{});
    }
  });
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


function respondPrivate(character, message) {
  if (arguments.length >= 2) {
    return fChatLibInstance.sendPrivMessage(character, message);
  }
  return (message)=>respondPrivate(character, message);
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
XPBot2PO.browse = privateInteraction(adminOnly(function browse(args, data, reply) {
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
    perPage = Number(perPage || 5);
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
}));
XPBot2PO.ban = XPBot2PO.banUser = privateInteraction(adminOnly(function banUser(args, data, reply) {
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

XPBot2PO.unban = XPBot2PO.unbanUser = privateInteraction(adminOnly(function (args, data, reply) {
}));
XPBot2PO.grantXP = privateInteraction(adminOnly(function (args, data, reply) {
}));
XPBot2PO.grantGold = privateInteraction(adminOnly(function (args, data, reply) {
}));
XPBot2PO.grantTitle = privateInteraction(adminOnly(function (args, data, reply) {
}));
XPBot2PO.revokeTitle = privateInteraction(adminOnly(function (args, data, reply) {
}));
XPBot2PO.transferUser = privateInteraction(adminOnly(function (args, data, reply) {
}));

XPBot2PO.deleteUser = privateInteraction(adminOnly(function (args, data, reply) {
}));

XPBot2PO.sellItem = privateInteraction(adminOnly(function (args, data, reply) {
}));
XPBot2PO.delistItem = privateInteraction(adminOnly(function (args, data, reply) {
}));

// == User
XPBot2PO.tradeXP = privateInteraction(function (args, data, reply) {
});
XPBot2PO.tradeGold = privateInteraction(function (args, data, reply) {
});
XPBot2PO.brag = privateInteraction(function (args, data, reply) {
});
XPBot2PO.myStats = privateInteraction(function (args, data, reply) {
});
XPBot2PO.view = privateInteraction(function (args, data, reply) {
});
XPBot2PO.equipTitle = privateInteraction(function (args, data, reply) {
});
XPBot2PO.equipItem = privateInteraction(function (args, data, reply) {
});
XPBot2PO.unequipItem = privateInteraction(function (args, data, reply) {
});
XPBot2PO.grantSilence = privateInteraction(function (args, data, reply) {
});
XPBot2PO.revokeSilence = privateInteraction(function (args, data, reply) {
});

//
Object.defineProperties(XPBot2PO, {
  respondChannel: constant.hidden(function (message) {
    this.fChat.sendMessage(message, this.channel);
  })
  , registerNewUser: constant.hidden(function (character){
    return User.initializeUser(character).then((user)=>{
      this.respondChannel(
`Welcome, ${userBBC(user.character)}, to ${iBBC('The Slave House')}! I have recorded you into our guest book. Have a nice stay and we will hope to see you again! 
${subBBC(uBBC('I am a bot, this message will not repeat.'))}
`
      );
    });
  })
  , recordMessageXP: constant.hidden(function (user, wordCount) {
    let idx = postRewardR.length - 1, curReward = postRewardR[idx], reward;
    for (;idx <=0; idx -= 1, curReward= postRewardR[idx] ) {
      if (curReward.wordCount < wordCount) {
        reward = curReward;
        break;
      }
    }
    if (reward) {
      user.xp += reward.xp;
      user.gold += reward.gold;
      return user.save();
    }
    return Promise.resolve(user);
  })
});
