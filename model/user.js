const Op = require('sequelize').Op;
const {getterSetter, constant, scanify} = require('./util');

module.exports = function (sequelize, DataTypes) {
    const User = sequelize.define("User", {
        id: {type: DataTypes.INTEGER, primaryKey: true, allowNull: false, field: "user_id"},
        character: {type: DataTypes.STRING, field: "character", allowNull: false},
        characterScan: {type: DataTypes.STRING, field: "character_scan", unique: true, allowNull: false},
        exp: {type: DataTypes.INTEGER, field: "exp", defaultValue: 0, allowNull: false},
        gold: {type: DataTypes.INTEGER, field: "gold", defaultValue: 0, allowNull: false},
        banned: {
            type: DataTypes.BOOLEAN, field: "banned", allowNull: false,
            defaultValue: false
        },
        notices: {
            type: DataTypes.BOOLEAN, field: "notices", allowNull: false,
            defaultValue: true
        },
        password: {
            type: DataTypes.STRING, field: "password", allowNull: false, defaultValue: ''
        }
    }, {
        tableName: "users",
        timestamps: false,
        scopes: {}
    });

    User.associate = function associate(models) {
        User.belongsToMany(models.Item, {
            as: "equippedItems",
            through: "user_item",
            foreignKey: "user_id",
            otherKey: "item_id",
            timestamps: false
        });
        User.belongsToMany(models.Item, {
            as: "ownedItems",
            through: "user_owned_item",
            foreignKey: "user_id",
            otherKey: "item_id",
            timestamps: false
        });
        User.belongsToMany(models.Title, {
            as: "equippedTitle",
            through: "user_title",
            foreignKey: "user_id",
            otherKey: "title_id",
            timestamps: false
        });
        User.belongsToMany(models.Title, {
            as: "ownedTitles",
            through: "user_owned_title",
            foreignKey: "user_id",
            otherKey: "title_id",
            timestamps: false
        });
    };

    User.associateScopes = function associateScopes(models) {
        User.addScope("allData", {
            include: [
                {model: models.Item, as: "equippedItems"},
                {model: models.Item, as: "ownedItems"},
                {model: models.Title, as: "equippedTitle"},
                {model: models.Title, as: "ownedTitles"},
            ]
        });
    };

    User.initializeUser = (function () {
        const Item = User.sequelize.models.Item;
        const Title = User.sequelize.models.Title;
        return (character) => {
            return User.create({
                character: character,
                characterScan: scanify(character),
            }).then(savedUser => {
                let items = Item.findAll({where: {id: {[Op.in]: [0, 4]}}});
                let titles = Title.findAll({where: {id: 0}});
                return Promise.all([items, titles]).then(results => {
                    return Promise.all([
                        savedUser.setOwnedTitles(results[1]),
                        savedUser.setEquippedTitle(results[1]),
                        savedUser.setOwnedItems(results[0]),
                        savedUser.setEquippedItems(results[0]),
                    ]).then(() => savedUser.save());
                });
            });
        };
    }());

    Object.defineProperties(User, {
        banByCharacter: constant((id) => {
            return User.find({characterScan: scanify(id)}).then(user => {
                if (!user)
                    return Promise.reject(null);
                user.banned = true;
                return user.save();
            });
        }),
        unbanByCharacter: constant((id) => {
            return User.find({characterScan: scanify(id)}).then(user => {
                if (!user)
                    return Promise.reject(null);
                user.banned = false;
                return user.save();
            });
        }),
    });

    Object.defineProperties(User.prototype, {
        userCode: getterSetter(function () {
            return `[user]${this.character}[/user]`;
        }),
    });

    return User;
};
