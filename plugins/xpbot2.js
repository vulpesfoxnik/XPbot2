var fChatLibInstance;
var channel;
var jsonfile = require('jsonfile');
var redis = require("redis");
var client = redis.createClient(6379, "127.0.0.1");
const User = require('../model/user');
var titles = require('./etc/titles.js');
var items = require('./etc/items.js');
var configuration = require('./etc/config.js');

module.exports = function (parent, chanName) {
    fChatLibInstance = parent;

    var cmdHandler = {};
    channel = chanName;
	
	client.on("error", function (err) {
        console.log("Redis error " + err);
    });
	
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////Version 2.3d
	
	//cmdHandler.migrate = function (args, data) {
	//	userlist = jsonfile.readFileSync("userlist.json");
	//	var i;
	//	for (i = 0; i < userlist.length; i++) {
	//		var nuevo = {};
	//		nuevo.character = userlist[i].nombre;
	//		nuevo.banned = false;
	//		nuevo.XP = userlist[i].XP;
	//		nuevo.Gold = userlist[i].Gold;
	//		nuevo.title = 0;
	//		nuevo.titleList = "0";
	//		nuevo.wornItems = "0";
	//		nuevo.ownedItems = "0,4";
	//		nuevo.notices = false;
	//		client.hmset(userlist[i].nombre, nuevo);
	//	}
	//	fChatLibInstance.sendPrivMessage(data.character, "Added " + i + "characters from the old database.");
	//}
	
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	
	
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	///////////////////////////DATABASE BROWSER THINGY MEOW//////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	
	cmdHandler.browse = function (args, data) {
		if (fChatLibInstance.isUserChatOP(channel, data.character)) {
			client.scan(args, function (err, result) {
				fChatLibInstance.sendPrivMessage(data.character, "Cursor: " + result[0]);
				var lista = result[1];
				for (var i = 0; i < lista.length; i++) {
					cmdHandler.show(lista[i], data);
				}
			});
		} else {
			fChatLibInstance.sendPrivMessage(data.character, "You are not an admin.");
		}
	}
	
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	
	//****************************
	//Admin only commands
	//****************************

  cmdHandler.ban = adminOnly(function (args, data) {
    const user = new User(args);
    const reply = respondPrivate(data.character);
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

	cmdHandler.giveXP(adminOnly(function (args, data){
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
    	(user)=>user.addExp(amount).then(
    		(user)=>reply(`Master, I have rewarded ${amount} XP to ${user.userCode}'s records.`)
				, ()=>reply(`Master, I was [b]unable[/b] to reward ${amount} XP to ${user.userCode}.`)
			)
			, ()=>reply(`Master, ${user.userCode} does not exist!`)
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
      (user)=>user.addGold(amount).then(
        (user)=>reply(`Master, I have deposited ${amount} gold to ${user.userCode}'s account.`)
        , ()=>reply(`Master, I was [b]unable[/b] to deposit ${amount} gold to ${user.userCode}'s account.`)
      )
      , ()=>reply(`Master, ${user.userCode} does not exist!`)
    );
  });
	
	cmdHandler.giveTitle = function (args, data) {
		if (fChatLibInstance.isUserChatOP(channel, data.character)) {
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
						fChatLibInstance.sendPrivMessage(data.character, "The title of " + result[0] + " has been given to " + result[1] + ".");
						fChatLibInstance.sendPrivMessage(result[1], "You have been given the title of " + result[0] + ".");
					} else {
						fChatLibInstance.sendPrivMessage(data.character, "The title " + result[0] + " wasn't found.");
					}
				} else {
					fChatLibInstance.sendPrivMessage(data.character, "Character " + result[1] + " wasn't found.");
				}
			});
		} else {
			fChatLibInstance.sendPrivMessage(data.character, "You are not an admin.");
		}
	}
	
	cmdHandler.takeTitle = function (args, data) {
		if (fChatLibInstance.isUserChatOP(channel, data.character)) {
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
						fChatLibInstance.sendPrivMessage(data.character, "The title of " + result[0] + " has been taken from " + result[1] + ".");
						fChatLibInstance.sendPrivMessage(result[1], "The title of " + result[0] + " has been taken from you.");
					} else {
						fChatLibInstance.sendPrivMessage(data.character, "Title not found.");
					}
				} else {
					fChatLibInstance.sendPrivMessage(data.character, "Character " + result[1] + " wasn't found.");
				}
			});
		} else {
			fChatLibInstance.sendPrivMessage(data.character, "You are not an admin.");
		}
	}
	
	cmdHandler.show = function (args, data) {
		if (fChatLibInstance.isUserChatOP(channel, data.character)) {
			client.hgetall(args, function (err, result) {
				if (result != null) {
					var message = `${(titles[result.title]||{}).title} ${args} has ${result.Gold} Gold and ${result.XP} XP, `;
					var wornItemList = parseStringToIntArray(result.wornItems ||'');
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
					fChatLibInstance.sendPrivMessage(data.character, message);
				} else {
					fChatLibInstance.sendPrivMessage(data.character, "Character " + args + " wasn't found.");
				}
			});
		} else {
			fChatLibInstance.sendPrivMessage(data.character, "You are not an admin.");
		}
	}

	function respondPrivate(character, message) {
		if (arguments.length >= 2) {
			return fChatLibInstance.sendPrivMessage(character, message);
		}
		return (message)=>respondPrivate(character, message);
	}

	function respondChannel(message) {
    fChatLibInstance.sendMessage(message, channel);
	}

	function viewObject(object) {
		return JSON.stringify(object, null, 2)
	}
	function sanitizeName (str) {
    return str.replace(/\s+/g, ' ');
	}
	function userBBC(userName) {
		return `[user]${userName}[/user]`;
	}

	function adminOnly (fn) {
		return (args, messenger)=> {
      if (fChatLibInstance.isUserChatOP(channel, messenger.character)) {
				fn(args, messenger);
      } else {
        respondPrivate(messenger.character, "You are not my master!");
      }
		};
	}

	cmdHandler.copyCharacter = adminOnly((args, mesenger)=>{
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
        , ()=> {
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

	/* cmdHandler.toggleXPtrade = function (args, data) {
		if (fChatLibInstance.isUserChatOP(channel, data.character)) {
			if (xptrade) {
				xptrade = false;
				fChatLibInstance.sendPrivMessage(data.character, "XP trade has been disabled.");
			} else {
				xptrade = true;
				fChatLibInstance.sendPrivMessage(data.character, "XP trade has been enabled.");
			}
			var nuevo = {};
			nuevo.xptrade = xptrade;
			nuevo.goldtrade = goldtrade;
			client.hmset("configuration", nuevo);
		} else {
			fChatLibInstance.sendPrivMessage(data.character, "You are not an admin.");
		}
	} */
	
	/* cmdHandler.toggleGoldtrade = function (args, data) {
		if (fChatLibInstance.isUserChatOP(channel, data.character)) {
			if (goldtrade) {
				goldtrade = false;
				fChatLibInstance.sendPrivMessage(data.character, "Gold trade has been disabled.");
			} else {
				goldtrade = true;
				fChatLibInstance.sendPrivMessage(data.character, "Gold trade has been enabled.");
			}
			var nuevo = {};
			nuevo.xptrade = xptrade;
			nuevo.goldtrade = goldtrade;
			client.hmset("configuration", nuevo);
		} else {
			fChatLibInstance.sendPrivMessage(data.character, "You are not an admin.");
		}
	} */
	
	//***********************
	//Listeners
	//***********************

	function initializeCharacter (identifier) {
    return client.hmset(
      identifier
      , {
        character: identifier, banned: "FALSE", XP: 0, Gold: 0, title: 0
				, titleList: "0", wornItems: "0", ownedItems: "0,4", notices: "FALSE"
      }
    );
	}

	fChatLibInstance.addJoinListener((parent, event) => {
		const identity = event.character.identity;
		if (event.channel === channel) {
			// This is a bit of a hack, but it should work. Since GH doesn't use XP, we can use it as our base identifier.
			// This saves us having to check both 'character' and 'xp' in succession.
			client.hexists(identity, "titleList",  (err, wasFound) => {
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
	
	fChatLibInstance.addMessageListener(function(parent, data){
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
										fChatLibInstance.sendPrivMessage(data.character, cantidad + " XP has been traded to " + destino + ".");
										fChatLibInstance.sendPrivMessage(destino, data.character + " has given you " + cantidad + " XP.");
									} else {
										fChatLibInstance.sendPrivMessage(data.character, "XP ammount should be a positive number and you must afford the transfer.");
									}
								} else {
									fChatLibInstance.sendPrivMessage(data.character, "Character " + destino + " is banned.");
								}
							} else {
								fChatLibInstance.sendPrivMessage(data.character, "Character " + destino + " wasn't found.");
							}
						});
					}
				} else {
					fChatLibInstance.sendPrivMessage(data.character, "You're not listed, leave and rejoin the room to get added.");
				}
			});
		} else {
			fChatLibInstance.sendPrivMessage(data.character, "XP trade is disabled.");
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
										fChatLibInstance.sendPrivMessage(data.character, cantidad + " Gold has been traded to " + destino + ".");
										fChatLibInstance.sendPrivMessage(destino, data.character + " has given you " + cantidad + " Gold.");
									} else {
										fChatLibInstance.sendPrivMessage(data.character, "Gold amount should be a positive number and you must have the Gold to transfer.");
									}
								} else {
									fChatLibInstance.sendPrivMessage(data.character, "Character " + destino + " is banned.");
								}
							} else {
								fChatLibInstance.sendPrivMessage(data.character, "Character " + destino + " wasn't found.");
							}
						});
					}
				} else {
					fChatLibInstance.sendPrivMessage(data.character, "You are not listed, leave and rejoin the room to get added.");
				}
			});
		} else {
			fChatLibInstance.sendPrivMessage(data.character, "Gold trading is disabled.");
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
					var message = `${(titles[result.title]||{}).title} ${data.character }  has  ${result.Gold} Gold and ${result.XP} + " XP, "`;
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
					fChatLibInstance.sendPrivMessage(data.character, message);
				}
			} else {
				fChatLibInstance.sendPrivMessage(data.character, "You're not listed, leave and rejoin the room to get added.");
			}
		});
	}
	
	cmdHandler.view = function (args, data) {
		client.hgetall(args, function (err, result) {
			if (result != null) {
				if (result.banned == "FALSE") {
					var message = titles[result.title].title + " " + args + ".";
					fChatLibInstance.sendPrivMessage(data.character, message);
				} else {
					fChatLibInstance.sendPrivMessage(data.character, "That character is banned.");
				}
			} else {
				fChatLibInstance.sendPrivMessage(data.character, "Character " + args + " wasn't found.");
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
							fChatLibInstance.sendMessage(data.character + " now has the title of " + args + ".", channel);
						} else {
							fChatLibInstance.sendPrivMessage(data.character, "The title " + args + " was not found for your character.");
						}
					}
				} else {
					fChatLibInstance.sendPrivMessage(data.character, "You are not listed, leave and rejoin the room to get added.");
				}
			});
		} else {
			fChatLibInstance.sendPrivMessage(data.character, "The title " + args + " does not exist.");
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
							fChatLibInstance.sendPrivMessage(data.character, "The item " + args + " has been equipped.");
						} else {
							fChatLibInstance.sendPrivMessage(data.character, "The item " + args + " wasn't found in your inventory or is already equipped.");
						}
					}
				} else {
					fChatLibInstance.sendPrivMessage(data.character, "You're not listed, leave and rejoin the room to get added.");
				}
			});
		} else {
			fChatLibInstance.sendPrivMessage(data.character, "The item " + args + " does not exist.");
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
							fChatLibInstance.sendPrivMessage(data.character, "The item " + args + " has been unequipped.");
						} else {
							fChatLibInstance.sendPrivMessage(data.character, "The item " + args + " wasn't equipped.");
						}
					}
				} else {
					fChatLibInstance.sendPrivMessage(data.character, "You're not listed, leave and rejoin the room to get added.");
				}
			});
		} else {
			fChatLibInstance.sendPrivMessage(data.character, "The item " + args + " does not exist.");
		}
	}


	function lineItem (item) {
	  return `- ${item.title} for ${item.Gold} Gold and ${item.XP} XP`;
	}

  cmdHandler.titleShop = function (args, data) {
    respondPrivate(data.character, `Welcome to the Title Shop!
The current titles you can buy are:
${titles.filter((x)=>!x.hidden).map(lineItem).join('\n')}`
    );
	};


  cmdHandler.weapons = function (args, data) {
		respondPrivate(data.character, `Welcome to the Weapon Shop!
The current weapons you can buy are:
${items.filter((x)=>x.type === 'weapon' && !x.hidden).map(lineItem).join('\n')}`
    );
	};

	cmdHandler.armor = function (args, data) {
    respondPrivate(data.character, `Welcome to the Weapon Shop!
The current armor you can buy are:
${items.filter((x)=>x.type === 'armor' && !x.hidden).map(lineItem).join('\n')}`
    );
	};

	cmdHandler.clothes = function (args, data) {
    respondPrivate(data.character, `Welcome to the Clothing Shop!
The current clothing you can buy are:
${items.filter((x)=>x.type === 'garment' && !x.hidden).map(lineItem).join('\n')}`
    );
	};

	cmdHandler.items = function (args, data) {
    respondPrivate(data.character, `Welcome to the Item Shop!
The current items you can buy are:
${items.filter((x)=>x.type === 'item' && !x.hidden).map(lineItem).join('\n')}`
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
							fChatLibInstance.sendPrivMessage(data.character, "The title " + args + " has been added to your title list. You now have " + result.Gold + " Gold and " + result.XP + " XP left.");
							fChatLibInstance.sendMessage(data.character + " now has the title of " + args + ".", channel);
						} else {
							fChatLibInstance.sendPrivMessage("You can't afford to buy that title, You currently have " + result.Gold + " Gold and " + result.XP + " XP.");
						}
					}
				} else {
					fChatLibInstance.sendPrivMessage(data.character, "You're not listed, leave and rejoin the room to get added.");
				}
			});
		} else {
			fChatLibInstance.sendPrivMessage("The title " + args + " wasn't found in the shop.");
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
							fChatLibInstance.sendPrivMessage(data.character, "The item " + args + " has been added to your item list. You now have " + result.Gold + " Gold and " + result.XP + " XP left.");
						} else {
							fChatLibInstance.sendPrivMessage("You can't afford to buy that item, You currently have " + result.Gold + " Gold and " + result.XP + " XP.");
						}
					}
				} else {
					fChatLibInstance.sendPrivMessage(data.character, "You're not listed, leave and rejoin the room to get added.");
				}
			});
		} else {
			fChatLibInstance.sendPrivMessage("The item " + args + " wasn't found in the shop.");
		}
	}
	// = is to set a variable, == is to compare two values, === is to compare type and value
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
						fChatLibInstance.sendPrivMessage(data.character, "Gold and XP gain notification activated.");
					} else {
						result.notices = "FALSE";
						client.hmset(data.character, result);
						fChatLibInstance.sendPrivMessage(data.character, "Gold and XP gain notification disabled.");
					}
				}
			} else {
				fChatLibInstance.sendPrivMessage(data.character, "You're not listed, leave and rejoin the room to get added.");
			}
		});
	}

    return cmdHandler;
};


function busca(lista, nombre) {
    for (var i = 0; i < lista.length; i++) {
        if (lista[i].title == nombre) {
            return i;
        }
    }
    return -1;
}

function busca2(lista, nombre) {
    var j = -1;
    for (var i = 0; i < lista.length; i++) {
        if (lista[i] == nombre) {
            j = i;
        }
    }
    return j;
}

function busca3(lista, nombre) {
    for (var i = 0; i < lista.length; i++) {
        if (lista[i].id == nombre) {
            return i;
        }
    }
    return -1;
}

function parseStringToIntArray(myString) {
    return (myString||'').split(',').map(x=>Number(x)).filter(x=>!isNaN(x));
}