const strings = require("./resource/strings");

class Helper {
    constructor(fChatInstance, channel) {
        this._fChatInstance = fChatInstance;
        this._channel = channel;
    }

    adminOnly(fn) {
        return (args, sender) => {
            if (this._fChatInstance.isUserChatOP(this._channel, sender.character)) {
                fn(args, sender);
            } else {
                this.sendMsgPrivate(sender, strings.UNAUTHORIZED);
            }
        }
    }

    sendMsgPrivate(sender, message) {
        if (arguments.length < 2)
            return (message) => this._fChatInstance.sendPrivMessage(sender.character, message);
        this._fChatInstance.sendPrivMessage(sender.character, message);
    }

    sendMsgChannel(message) {
        this._fChatInstance.sendMessage(message, this._channel);
    }


}





module.exports = {
    misc: require('./misc'),
    Helper: Helper
};
