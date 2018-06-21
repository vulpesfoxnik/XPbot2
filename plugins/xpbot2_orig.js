const redis = require("redis");
const lib = require("lib");
const client = redis.createClient(6379, "127.0.0.1");
/**
 * @type {User}
 */
const User = require('../model/user');
/**
 * @type {Array<TitleSource>}
 */
const titles = require('./etc/titles.js');
/**
 * @type {Array<ItemSource>}
 */
const items = require('./etc/items.js');
/**
 * @type {ItemStore}
 */
const itemStore = require('../model/item-store');
const configuration = require('./etc/config.js');

function XPBot2(fChatInstance, channel) {
    const helper = new lib.Helper(fChatInstance, channel);
    const commands = {};

    commands.browse = helper.adminOnly(function browse_(args, sender) {
        client.scan(args, function (err, result) {
            helper.sendMsgPrivate(sender, `Cursor: ${result[0]}`);
            let items = result[1];
            for (let i = 0; i < items.length; i++) {
                commands.show(items[i], sender);
            }
        });
    });

    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    //****************************
    //Admin only commands
    //****************************

    commands.ban = helper.adminOnly(function ban_(args, sender) {
        const user = new User(args);
        const reply = helper.sendMsgPrivate(sender.character);
        user.populate().then(
            (user) => user.ban(true).then(
                (user) => reply(`${user.userCode} has been banished from the realm master!`)
                , () => reply(`I failed! ${user.userCode} could not be banished!`)
            )
            , () => {
                reply(`Master, ${user.userCode} couldn't be found.`);
            }
        );
    });

    cmdHandler.unban = adminOnly(function (args, data) {
        const user = new User(args);
        const reply = respondPrivate(data.character);
        user.populate().then(
            (user) => user.ban(false).then(
                (user) => reply(`${user.userCode} is now welcome, master, by your wisdom!`)
                , () => reply(`I failed! ${user.userCode} could not be readmitted, master!`)
            )
            , () => {
                reply(`Master, ${user.userCode} couldn't be found.`);
            }
        );
    });

    cmdHandler.giveXP(adminOnly(function (args, data) {
        const reply = respondPrivate(data.character);
        const parsing = args.match(/!giveXP +(-?\d+) +"([^"]+)"/);
        if (!parsing) {
            reply(`I'm sorry master, I did not understand your request. Please phrase it this way:
    	  To give XP, say:
    		!giveXP 50 "User Name"
    		To take away XP, say:
    		!giveXP -50 "User Name"
    	`);
            return;
        }
        const amount = Number(parsing[0]);
        const user = new User(sanitizeName(parsing[1]));
        user.exists().then(
            (user) => user.addExp(amount).then(
                (user) => reply(`Master, I have rewarded ${amount} XP to ${user.userCode}'s records.`)
                , () => reply(`Master, I was [b]unable[/b] to reward ${amount} XP to ${user.userCode}.`)
            )
            , () => reply(`Master, ${user.userCode} does not exist!`)
        );
    }));

    cmdHandler.giveGold = adminOnly(function (args, data) {
        const reply = respondPrivate(data.character);
        const parsing = args.match(/!giveXP +(-?\d+) +"([^"]+)"/);
        if (!parsing) {
            reply(`I'm sorry master, I did not understand your request. Please phrase it this way:
    	  To give XP, say:
    		!giveGold 50 "User Name"
    		To take away XP, say:
    		!giveGold -50 "User Name"
    	`);
            return;
        }
        const amount = Number(parsing[0]);
        const user = new User(sanitizeName(parsing[1]));
        user.exists().then(
            (user) => user.addGold(amount).then(
                (user) => reply(`Master, I have deposited ${amount} gold to ${user.userCode}'s account.`)
                , () => reply(`Master, I was [b]unable[/b] to deposit ${amount} gold to ${user.userCode}'s account.`)
            )
            , () => reply(`Master, ${user.userCode} does not exist!`)
        );
    });

    cmdHandler.giveTitle = function (args, data) {
        if (fChatInstance.isUserChatOP(channel, data.character)) {
            var arr = args.split(' ');
            var result = arr.splice(0, 1);
            result.push(arr.join(' '));
            client.hgetall(result[1], function (err, chara) {
                if (chara != null) {
                    var indice = busca(titles, result[0]);
                    if (indice != -1) {
                        var currentTitles = parseStringToIntArray(chara.titleList);
                        currentTitles.push(indice);
                        chara.titleList = currentTitles.toString();
                        client.hmset(result[1], chara);
                        fChatInstance.sendPrivMessage(data.character, "The title of " + result[0] + " has been given to " + result[1] + ".");
                        fChatInstance.sendPrivMessage(result[1], "You have been given the title of " + result[0] + ".");
                    } else {
                        fChatInstance.sendPrivMessage(data.character, "The title " + result[0] + " wasn't found.");
                    }
                } else {
                    fChatInstance.sendPrivMessage(data.character, "Character " + result[1] + " wasn't found.");
                }
            });
        } else {
            fChatInstance.sendPrivMessage(data.character, "You are not an admin.");
        }
    }

    cmdHandler.takeTitle = function (args, data) {
        if (fChatInstance.isUserChatOP(channel, data.character)) {
            var arr = args.split(' ');
            var result = arr.splice(0, 1);
            result.push(arr.join(' '));
            client.hgetall(result[1], function (err, chara) {
                if (chara != null) {
                    var indice1 = busca(titles, result[0]);
                    var currentTitles = parseStringToIntArray(chara.titleList);
                    var indice2 = busca2(currentTitles, indice1);
                    if (indice2 != -1) {
                        currentTitles.splice(indice2, 1);
                        chara.titleList = currentTitles.toString();
                        chara.title = 0;
                        client.hmset(result[1], chara);
                        fChatInstance.sendPrivMessage(data.character, "The title of " + result[0] + " has been taken from " + result[1] + ".");
                        fChatInstance.sendPrivMessage(result[1], "The title of " + result[0] + " has been taken from you.");
                    } else {
                        fChatInstance.sendPrivMessage(data.character, "Title not found.");
                    }
                } else {
                    fChatInstance.sendPrivMessage(data.character, "Character " + result[1] + " wasn't found.");
                }
            });
        } else {
            fChatInstance.sendPrivMessage(data.character, "You are not an admin.");
        }
    }

    cmdHandler.show = function (args, data) {
        if (fChatInstance.isUserChatOP(channel, data.character)) {
            client.hgetall(args, function (err, result) {
                if (result != null) {
                    var message = `${(titles[result.title] || {}).title} ${args} has ${result.Gold} Gold and ${result.XP} XP, `;
                    var wornItemList = parseStringToIntArray(result.wornItems || '');
                    var wornItemList2 = [];
                    for (var i = 0; i < wornItemList.length; i++) {
                        var j = busca3(items, wornItemList[i]);
                        wornItemList2[i] = items[j].title;
                    }
                    message += "and is wearing the folowing items: " + wornItemList2.toString() + ".\n";
                    var titleList = parseStringToIntArray(result.titleList || '');
                    var titleList2 = [];
                    for (var i = 0; i < titleList.length; i++) {
                        titleList2[i] = titles[titleList[i]].title;
                    }
                    message += "Has the folowing titles: " + titleList2.toString() + ".\n";
                    var itemList = parseStringToIntArray(result.ownedItems || '');
                    var itemList2 = [];
                    for (var i = 0; i < itemList.length; i++) {
                        var j = busca3(items, itemList[i]);
                        itemList2[i] = items[j].title;
                    }
                    message += "And the folowing items: " + itemList2.toString() + ".";
                    fChatInstance.sendPrivMessage(data.character, message);
                } else {
                    fChatInstance.sendPrivMessage(data.character, "Character " + args + " wasn't found.");
                }
            });
        } else {
            fChatInstance.sendPrivMessage(data.character, "You are not an admin.");
        }
    }


    cmdHandler.copyCharacter = adminOnly((args, mesenger) => {
        const reply = respondPrivate(mesenger.character);
        const parse = args.match(/!renameCharacter +"([^"]+)" +"([^"]+)/);
        if (!parse) {
            reply(`I'm sorry master, I did not understand. Please phase your request this way:
				!copyCharacter "old name" "new name"
			`);
            return;
        }
        const existingUser = new User(sanitizeName(parse[1]));
        existingUser.exists().then(() => {
                const newUser = new User(sanitizeName(parse[2]));
                return existingUser.copyTo(newUser).then(
                    () => {
                        reply(`Yes master. I Transferred all attributes from ${existingUser.userCode} to ${newUser.userCode}[/user].
For your records, this is what I copied:
${viewObject(newUser.instance)}
If you want me to delete the old user, please type:
  !deleteCharacter "${existingUser.id}"
`
                        );
                    }
                    , () => {
                        reply(`I'm sorry master, something has prevented me from copying to ${newUser.userCode}.`);
                    }
                );
            }
            , () => {
                reply(`I'm sorry master, the user you were looking for, ${existingUser.userCode}, was not found.`);
            }
        );
    });

    cmdHandler.deleteCharacter = adminOnly((args, messenger) => {
        const reply = respondPrivate(messenger.character);
        const parse = args.match(/!deleteCharacter +"([^"]+)"/);
        if (!parse) {
            reply(`I'm sorry master, I did not understand. Please phase your request this way:
				!deleteCharacter "character name"
			`);
            return;
        }
        const chara = new User(sanitizeName(parse[1]));
        chara.exists().then(
            () => chara.erase().then(
                () => {
                    reply(`Master, I have wiped ${chara.userCode} from my memory!`);
                }
                , () => {
                    reply(`Master, I am a teapot. I'm sorry, something went wrong. I was unable to delete ${chara.userCode}`);
                }
            )
            , () => {
                reply(`I'm sorry master, I could not find ${chara.userCode}. Perhaps they were already erased?`);
            }
        );
    });

    cmdHandler.sellItem = adminOnly(function (arg, messenger) {
        const reply = respondPrivate(messenger.character);
        const parse = args.match(/!sellItem\s+([^ ]+)\s+([a-z]+)\s+(\d+)\s+(\d+)/);
        if (parse) {
            const itemName = parse[1];
            itemStore.listItem(itemName, parse[2], Number(parse[3]), Number(parse[4])).then(
                (...[itemStore, item, isNewItem]) => reply(
                    `Master, I ${
                        isNewItem ? 'created the new' : 'updated the'
                        } item "${underscoreToSpace(item.title)}" for sale as a "${item.type}" for ${item.Gold} Gold and ${item.XP} XP.`
                )
                , () => reply(`Sorry master, I was unable to add your ${underscoreToSpace(itemName)} to the store.`)
            );
        } else {
            reply(`I'm sorry master, I did not understand. Please phrase your request as follows:
!sellItem Item_Name <item type> <Gold> <XP>

Possible Item Types:
${Object.values(itemStore.constructor.TYPES).map((x) => `• ${x}`).join('\n')}
Gold: Positive Integer
XP: Positive Integer
`);
        }
    });

    cmdHandler.delistItem = adminOnly(function () {
        const reply = respondPrivate(messenger.character);
        const parse = args.match(/!sellItem\s+([^ ]+)\s+(true|false)/);
        if (parse) {
            const itemName = parse[1], hidden = JSON.parse(parse[2]);
            itemStore.hide(itemName, hidden).then(
                () => reply(`Master, I ${hidden ? 'delisted' : 'relisted'} ${underscoreToSpace(itemName)}.`)
                , () => reply(`Master, I wasn't able to change the visiblity of ${underscoreToSpace(itemName)}.`)
            );
        } else {
            reply(`I'm sorry master, I didn't understand your request. Please phase it as such:
!delistItem Item_Name <hidden>
Possible Hidden Value: true false
`
            );
        }

    });

    /* cmdHandler.toggleXPtrade = function (args, data) {
        if (fChatInstance.isUserChatOP(channel, data.character)) {
            if (xptrade) {
                xptrade = false;
                fChatInstance.sendPrivMessage(data.character, "XP trade has been disabled.");
            } else {
                xptrade = true;
                fChatInstance.sendPrivMessage(data.character, "XP trade has been enabled.");
            }
            var nuevo = {};
            nuevo.xptrade = xptrade;
            nuevo.goldtrade = goldtrade;
            client.hmset("configuration", nuevo);
        } else {
            fChatInstance.sendPrivMessage(data.character, "You are not an admin.");
        }
    } */

    /* cmdHandler.toggleGoldtrade = function (args, data) {
        if (fChatInstance.isUserChatOP(channel, data.character)) {
            if (goldtrade) {
                goldtrade = false;
                fChatInstance.sendPrivMessage(data.character, "Gold trade has been disabled.");
            } else {
                goldtrade = true;
                fChatInstance.sendPrivMessage(data.character, "Gold trade has been enabled.");
            }
            var nuevo = {};
            nuevo.xptrade = xptrade;
            nuevo.goldtrade = goldtrade;
            client.hmset("configuration", nuevo);
        } else {
            fChatInstance.sendPrivMessage(data.character, "You are not an admin.");
        }
    } */

    //***********************
    //Listeners
    //***********************

    function initializeCharacter(identifier) {
        return client.hmset(
            identifier
            , {
                character: identifier, banned: "FALSE", XP: 0, Gold: 0, title: 0
                , titleList: "0", wornItems: "0", ownedItems: "0,4", notices: "FALSE"
            }
        );
    }

    fChatInstance.addJoinListener((parent, event) => {
        const identity = event.character.identity;
        if (event.channel === channel) {
            // This is a bit of a hack, but it should work. Since GH doesn't use XP, we can use it as our base identifier.
            // This saves us having to check both 'character' and 'xp' in succession.
            client.hexists(identity, "titleList", (err, wasFound) => {
                console.log(`Join Event!`, event.character.identity, Boolean(wasFound));
                if (wasFound === 0) {
                    initializeCharacter(identity);
                    respondChannel(
                        `${userBBC(identity)} has been added to the database. Welcome to the Slave House! This message will not repeat.`
                    );
                }
            });
        }
    });

    fChatInstance.addMessageListener(function (parent, data) {
        if (data.channel == channel) {
            var palabras = data.message.split(" ");
            var cantidad = palabras.length;
            if (cantidad >= configuration.Short) {
                client.hgetall(data.character, function (err, chara) {
                    if (chara != null) {
                        const gold = Math.max(Number(chara.Gold), 0)
                            , xp = Math.max(Number(chara.XP), 0);
                        let goldGain = configuration.ShortG
                            , xpGain = configuration.ShortXP;
                        if (cantidad >= configuration.Long) {
                            xpGain = configuration.LongXP;
                            goldGain = configuration.LongG;
                        } else if (cantidad >= configuration.Med) {
                            xpGain = configuration.MedXP;
                            goldGain = configuration.MedG;
                        }

                        chara.XP = xpGain + xp;
                        chara.Gold = goldGain + gold;
                        client.hmset(data.character, chara);
                        if (chara.notices == "true") {
                            respondPrivate(data.character, `${userBBC(data.character)} + ${xpGain} XP, + ${goldGain} Gold."`);
                        }
                    }
                });
            }
        }
    });

    //****************************
    //User commands
    //****************************

    cmdHandler.tradeXP = function (args, data) {
        if (configuration.xptrade) {
            var arr = args.split(' ');
            var cantidad = parseInt(arr.splice(0, 1));
            var destino = arr.join(' ');
            client.hgetall(data.character, function (err, chara1) {
                if (chara1 != null) {
                    if (chara1.banned == "FALSE") {
                        client.hgetall(destino, function (err, chara2) {
                            if (chara2 != null) {
                                if (chara2.banned == "FALSE") {
                                    if (!isNaN(cantidad) && cantidad > 0 && chara1.XP >= cantidad) {
                                        chara1.XP = (parseInt(chara1.XP) - parseInt(cantidad));
                                        chara2.XP = (parseInt(cantidad) + parseInt(chara2.XP));
                                        client.hmset(data.character, chara1);
                                        client.hmset(destino, chara2);
                                        fChatInstance.sendPrivMessage(data.character, cantidad + " XP has been traded to " + destino + ".");
                                        fChatInstance.sendPrivMessage(destino, data.character + " has given you " + cantidad + " XP.");
                                    } else {
                                        fChatInstance.sendPrivMessage(data.character, "XP ammount should be a positive number and you must afford the transfer.");
                                    }
                                } else {
                                    fChatInstance.sendPrivMessage(data.character, "Character " + destino + " is banned.");
                                }
                            } else {
                                fChatInstance.sendPrivMessage(data.character, "Character " + destino + " wasn't found.");
                            }
                        });
                    }
                } else {
                    fChatInstance.sendPrivMessage(data.character, "You're not listed, leave and rejoin the room to get added.");
                }
            });
        } else {
            fChatInstance.sendPrivMessage(data.character, "XP trade is disabled.");
        }
    }

    cmdHandler.tradeGold = function (args, data) {
        if (configuration.goldtrade) {
            var arr = args.split(' ');
            var cantidad = parseInt(arr.splice(0, 1));
            var destino = arr.join(' ');
            client.hgetall(data.character, function (err, chara1) {
                if (chara1 != null) {
                    if (chara1.banned == "FALSE") {
                        client.hgetall(destino, function (err, chara2) {
                            if (chara2 != null) {
                                if (chara2.banned == "FALSE") {
                                    if (!isNaN(cantidad) && cantidad > 0 && chara1.Gold >= cantidad) {
                                        chara1.Gold = (parseInt(chara1.Gold) - parseInt(cantidad));
                                        chara2.Gold = (parseInt(cantidad) + parseInt(chara2.Gold));
                                        client.hmset(data.character, chara1);
                                        client.hmset(destino, chara2);
                                        fChatInstance.sendPrivMessage(data.character, cantidad + " Gold has been traded to " + destino + ".");
                                        fChatInstance.sendPrivMessage(destino, data.character + " has given you " + cantidad + " Gold.");
                                    } else {
                                        fChatInstance.sendPrivMessage(data.character, "Gold amount should be a positive number and you must have the Gold to transfer.");
                                    }
                                } else {
                                    fChatInstance.sendPrivMessage(data.character, "Character " + destino + " is banned.");
                                }
                            } else {
                                fChatInstance.sendPrivMessage(data.character, "Character " + destino + " wasn't found.");
                            }
                        });
                    }
                } else {
                    fChatInstance.sendPrivMessage(data.character, "You are not listed, leave and rejoin the room to get added.");
                }
            });
        } else {
            fChatInstance.sendPrivMessage(data.character, "Gold trading is disabled.");
        }
    }

    cmdHandler.brag = function (args, data) {
        const reply = respondPrivate(data.character);
        client.hgetall(data.character, function (err, user) {
            if (user != null) {
                if (user.banned === "FALSE") {
                    respondChannel(`${
                    (titles.find((x) => x.id == user.title) || {title: ''}).title || ''
                        } ${
                        userBBC(data.identifier)
                        } has ${
                        user.Gold
                        } Gold and ${
                        user.XP
                        } XP, and is wearing the following items: ${
                        parseStringToIntArray(user.wornItems).map(
                            id => `• ${((items.find(item => item.id === id) || {title: ''}).title || '').replace(/_/g, ' ')}`
                        ).filter(x => x).join(',\n')
                        }`);
                }
            } else {
                reply("You're not listed, leave and rejoin the room to get added.");
            }
        });
    };

    cmdHandler.myStats = function (args, data) {
        client.hgetall(data.character, function (err, result) {
            if (result != null) {
                if (result.banned == "FALSE") {
                    var message = `${(titles[result.title] || {}).title} ${data.character }  has  ${result.Gold} Gold and ${result.XP} + " XP, "`;
                    var wornItemList = parseStringToIntArray(result.wornItems);
                    var wornItemList2 = [];
                    for (var i = 0; i < wornItemList.length; i++) {
                        var j = busca3(items, wornItemList[i]);
                        wornItemList2[i] = items[j].title;
                    }
                    message += "and is wearing the following items: " + wornItemList2.toString() + ".\n";
                    var titleList = parseStringToIntArray(result.titleList);
                    var titleList2 = [];
                    for (var i = 0; i < titleList.length; i++) {
                        titleList2[i] = titles[titleList[i]].title;
                    }
                    message += "Available titles: " + titleList2.toString() + ".\n";
                    var itemList = parseStringToIntArray(result.ownedItems);
                    var itemList2 = [];
                    for (var i = 0; i < itemList.length; i++) {
                        var j = busca3(items, itemList[i]);
                        itemList2[i] = items[j].title;
                    }
                    message += "Items in inventory: " + itemList2.toString() + ".";
                    fChatInstance.sendPrivMessage(data.character, message);
                }
            } else {
                fChatInstance.sendPrivMessage(data.character, "You're not listed, leave and rejoin the room to get added.");
            }
        });
    }

    cmdHandler.view = function (args, data) {
        client.hgetall(args, function (err, result) {
            if (result != null) {
                if (result.banned == "FALSE") {
                    var message = titles[result.title].title + " " + args + ".";
                    fChatInstance.sendPrivMessage(data.character, message);
                } else {
                    fChatInstance.sendPrivMessage(data.character, "That character is banned.");
                }
            } else {
                fChatInstance.sendPrivMessage(data.character, "Character " + args + " wasn't found.");
            }
        });
    }

    cmdHandler.useTitle = function (args, data) {
        var titleAsked = busca(titles, args);
        if (titleAsked != -1) {
            client.hgetall(data.character, function (err, result) {
                if (result != null) {
                    if (result.banned == "FALSE") {
                        var titleList = parseStringToIntArray(result.titleList);
                        indice = busca2(titleList, titleAsked);
                        if (indice != -1) {
                            result.title = titleAsked;
                            client.hmset(data.character, result);
                            fChatInstance.sendMessage(data.character + " now has the title of " + args + ".", channel);
                        } else {
                            fChatInstance.sendPrivMessage(data.character, "The title " + args + " was not found for your character.");
                        }
                    }
                } else {
                    fChatInstance.sendPrivMessage(data.character, "You are not listed, leave and rejoin the room to get added.");
                }
            });
        } else {
            fChatInstance.sendPrivMessage(data.character, "The title " + args + " does not exist.");
        }
    }

    cmdHandler.equip = function (args, data) {
        var itemAsked = busca(items, args);
        if (itemAsked != -1) {
            var itemAskedID = items[itemAsked].id;
            client.hgetall(data.character, function (err, result) {
                if (result != null) {
                    if (result.banned == "FALSE") {
                        var itemList = parseStringToIntArray(result.ownedItems);
                        indice1 = busca2(itemList, itemAskedID);
                        var wornItemList = parseStringToIntArray(result.wornItems);
                        indice2 = busca2(wornItemList, itemAskedID);
                        if (indice1 != -1 && indice2 == -1) {
                            var wornItemList = parseStringToIntArray(result.wornItems);
                            wornItemList.push(itemAskedID);
                            result.wornItems = wornItemList.toString();
                            client.hmset(data.character, result);
                            fChatInstance.sendPrivMessage(data.character, "The item " + args + " has been equipped.");
                        } else {
                            fChatInstance.sendPrivMessage(data.character, "The item " + args + " wasn't found in your inventory or is already equipped.");
                        }
                    }
                } else {
                    fChatInstance.sendPrivMessage(data.character, "You're not listed, leave and rejoin the room to get added.");
                }
            });
        } else {
            fChatInstance.sendPrivMessage(data.character, "The item " + args + " does not exist.");
        }
    }

    cmdHandler.unequip = function (args, data) {
        var itemAsked = busca(items, args);
        if (itemAsked != -1) {
            var itemAskedID = items[itemAsked].id;
            client.hgetall(data.character, function (err, result) {
                if (result != null) {
                    if (result.banned == "FALSE") {
                        var wornItemList = parseStringToIntArray(result.wornItems);
                        indice = busca2(wornItemList, itemAskedID);
                        if (indice != -1) {
                            wornItemList.splice(indice, 1);
                            result.wornItems = wornItemList.toString();
                            client.hmset(data.character, result);
                            fChatInstance.sendPrivMessage(data.character, "The item " + args + " has been unequipped.");
                        } else {
                            fChatInstance.sendPrivMessage(data.character, "The item " + args + " wasn't equipped.");
                        }
                    }
                } else {
                    fChatInstance.sendPrivMessage(data.character, "You're not listed, leave and rejoin the room to get added.");
                }
            });
        } else {
            fChatInstance.sendPrivMessage(data.character, "The item " + args + " does not exist.");
        }
    }


    /**
     *
     * @param {ItemSource|TitleSource} item
     * @returns {string}
     */
    function lineItem(item) {
        return `- ${item.title} for ${item.Gold} Gold and ${item.XP} XP`;
    }

    /**
     *
     * @param {ItemSource|TitleSource} item
     * @returns {boolean}
     */
    function visible(item) {
        return !item.hidden;
    }

    cmdHandler.titleShop = function (args, data) {
        respondPrivate(data.character, `Welcome to the Title Shop!
The current titles you can buy are:
${titles.filter(visible).map(lineItem).join('\n')}`
        );
    };


    cmdHandler.weapons = function (args, data) {
        respondPrivate(data.character, `Welcome to the Weapon Shop!
The current weapons you can buy are:
${itemStore.weapon.filter(visible).map(lineItem).join('\n')}`
        );
    };

    cmdHandler.armor = function (args, data) {
        respondPrivate(data.character, `Welcome to the Weapon Shop!
The current armor you can buy are:
${itemStore.armor.filter(visible).map(lineItem).join('\n')}`
        );
    };

    cmdHandler.clothes = function (args, data) {
        respondPrivate(data.character, `Welcome to the Clothing Shop!
The current clothing you can buy are:
${itemStore.garment.filter(visible).map(lineItem).join('\n')}`
        );
    };

    cmdHandler.items = function (args, data) {
        respondPrivate(data.character, `Welcome to the Item Shop!
The current items you can buy are:
${itemStore.item.filter(visible).map(lineItem).join('\n')}`
        );
    };

    cmdHandler.buyTitle = function (args, data) {
        var titleAsked = busca(titles, args);
        if (titleAsked != -1) {
            client.hgetall(data.character, function (err, result) {
                if (result != null) {
                    if (result.banned == "FALSE") {
                        if (result.Gold >= titles[titleAsked].Gold && result.XP >= titles[titleAsked].XP) {
                            result.Gold -= titles[titleAsked].Gold;
                            result.XP -= titles[titleAsked].XP
                            var titleList = parseStringToIntArray(result.titleList);
                            titleList.push(titleAsked);
                            result.titleList = titleList.toString();
                            result.title = titleAsked;
                            client.hmset(data.character, result);
                            fChatInstance.sendPrivMessage(data.character, "The title " + args + " has been added to your title list. You now have " + result.Gold + " Gold and " + result.XP + " XP left.");
                            fChatInstance.sendMessage(data.character + " now has the title of " + args + ".", channel);
                        } else {
                            fChatInstance.sendPrivMessage("You can't afford to buy that title, You currently have " + result.Gold + " Gold and " + result.XP + " XP.");
                        }
                    }
                } else {
                    fChatInstance.sendPrivMessage(data.character, "You're not listed, leave and rejoin the room to get added.");
                }
            });
        } else {
            fChatInstance.sendPrivMessage("The title " + args + " wasn't found in the shop.");
        }
    }

    cmdHandler.buyItem = function (args, data) {
        var itemAsked = busca(items, args);
        if (itemAsked != -1) {
            client.hgetall(data.character, function (err, result) {
                if (result != null) {
                    if (result.banned == "FALSE") {
                        if (result.Gold >= items[itemAsked].Gold && result.XP >= items[itemAsked].XP) {
                            result.Gold -= items[itemAsked].Gold;
                            result.XP -= items[itemAsked].XP
                            var itemList = parseStringToIntArray(result.ownedItems);
                            itemList.push(items[itemAsked].id);
                            result.ownedItems = itemList.toString();
                            client.hmset(data.character, result);
                            fChatInstance.sendPrivMessage(data.character, "The item " + args + " has been added to your item list. You now have " + result.Gold + " Gold and " + result.XP + " XP left.");
                        } else {
                            fChatInstance.sendPrivMessage("You can't afford to buy that item, You currently have " + result.Gold + " Gold and " + result.XP + " XP.");
                        }
                    }
                } else {
                    fChatInstance.sendPrivMessage(data.character, "You're not listed, leave and rejoin the room to get added.");
                }
            });
        } else {
            fChatInstance.sendPrivMessage("The item " + args + " wasn't found in the shop.");
        }
    }
    // FALSE and false are two different variables, Consider changing them?
    /* tack on .toLowerCase() or .toUpperCase() on strings you want to evaluate.
    Arianna Altomare: Ex: var string = 'Something
    Arianna Altomare: var newStr = string.toLowerCase()*/

    cmdHandler.notify = function (args, data) {
        client.hgetall(data.character, function (err, result) {
            if (result != null) {
                if (result.banned === "FALSE") {
                    if (result.notices === "FALSE") {
                        result.notices = "true";
                        client.hmset(data.character, result);
                        fChatInstance.sendPrivMessage(data.character, "Gold and XP gain notification activated.");
                    } else {
                        result.notices = "FALSE";
                        client.hmset(data.character, result);
                        fChatInstance.sendPrivMessage(data.character, "Gold and XP gain notification disabled.");
                    }
                }
            } else {
                fChatInstance.sendPrivMessage(data.character, "You're not listed, leave and rejoin the room to get added.");
            }
        });
    };

    return cmdHandler;
}

module.exports = XPBot2;
