const Op = require('sequelize').Op;
const Model = require('sequelize').Model;
const {user: userBBC, icon: iconBBC} = require('../utility/b-b-code')
const {getterSetter, constant, scanify} = require('./util');

module.exports = function (sequelize, DataTypes) {
    /**
     * @typedef {Object} User
     * @property {number} id
     * @property {string} character
     * @property {string} characterScan
     * @property {number} exp
     * @property {number} gold
     * @property {boolean} banned
     * @property {boolean} notices
     * @property {string} password
     * @property {function(...Item)} setEquippedItems
     * @property {function} getEquippedItems
     * @property {function(...Item)} setOwnedItems
     * @property {function} getOwnedItems
     * @property {function(...Title)} setOwnedTitles,
     * @property {function} getOwnedTitles,
     * @property {function(...Title)} setEquippedTitle,
     * @property {function} getEquippedTitle,
     * @property {function} save
     * @property {function(number, number)} pagination
     *
     * @type {Model} User
     */
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

    const Item = User.sequelize.models.Item;
    const Title = User.sequelize.models.Title;
    Object.defineProperties(User, {
        initializeUser: constant(async function _initializeUser(character) {
            /** @type {User} user */
            let user = await User.create({
                character: character,
                characterScan: scanify(character),
            });
            let baseItems = await Item.findAll({where: {id: {[Op.in]: [0, 4]}}});
            let baseTitle = await Title.findAll({where: {id: 0}});

            await Promise.all([
                user.setOwnedTitles(baseTitle),
                user.setEquippedTitle(baseTitle),
                user.setOwnedItems(baseItems),
                user.setEquippedItems(baseItems),
            ]);
            return await user.save();
        }),
        banByCharacter: constant(async character => {
            let user = await User.find({where: {characterScan: scanify(character)}, rejectOnEmpty: true});
            user.banned = true;
            return await user.save();
        }),
        unbanByCharacter: constant(async character => {
            let user = User.find({where: {characterScan: scanify(character)}, rejectOnEmpty: true});
            user.banned = false;
            return user.save();
        }),
        exists: constant(async character => {
            return await User.count({where: {characterScan: scanify(character)}}) > 0;
        }),
        findUserById: constant(async id => {
            return await User.scope("allData").findById(id, {rejectOnEmpty: false})
        }),
        findByCharacter: constant(async id => {
            return await User.scope("allData").find({where: {characterScan: scanify(id)}, rejectOnEmpty: false});
        }),
        pagination: constant(async function (pageNumber, perPage = 10) {
            pageNumber = Number(pageNumber) <= 0 ? 1 : Number(pageNumber);
            perPage = Number(perPage || 5);
            let totalCount = await User.count();
            let users = await User.scopes('allData').findAll({limit: perPage, offset: (pageNumber - 1) * perPage});
            return {
                totalPages: Math.ceil(totalCount / perPage),
                page: pageNumber,
                perPage: perPage,
                data: users
            };
        }),
    });

    Object.defineProperties(User.prototype, {
        bbcUser: getterSetter(function () {
            return userBBC(this.character);
        }),
        bbcIcon: getterSetter(function () {
            return iconBBC(this.character);
        }),
        copyTo: constant(async function (targetUser) {
            /** @type {User} src */
            let srcUser = this;
            if (!(targetUser instanceof User)) {
                targetUser = await User.findByName(String(target));
                if (!targetUser) {
                    throw new Error(`Unable to find user '${targetUser}': ${e}`)
                }
            }
            targetUser.exp = srcUser.exp;
            targetUser.gold = srcUser.gold;
            targetUser.notices = srcUser.notices;
            targetUser.banned = srcUser.banned;
            let srcItems = await Promise.all([
                srcUser.getOwnedItems(),
                srcUser.getEquippedItems(),
                srcUser.getOwnedTitles(),
                srcUser.getEquippedTitle(),
                targetUser.save(),
            ]);

            await Promise.all([
                targetUser.setOwnedItems(srcItems[0]),
                targetUser.setEquippedItems(srcItems[1]),
                targetUser.setOwnedTitles(srcItems[2]),
                targetUser.setEquippedTitle(srcItems[3]),
            ]);
            return await User.findByIdentifier(targetUser.id);
        }),
    });

    return User;
};
