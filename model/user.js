const Op = require('sequelize').Op;
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
     */
    const User = sequelize.define("User", {
        id: {type: DataTypes.INTEGER, primaryKey: true, allowNull: true, field: "user_id"},
        character: {
            type: DataTypes.STRING, field: "character", allowNull: false,
            set(value) {
                if (value !== this.getDataValue("character")) {
                    this.setDataValue("character", value);
                    this.setDataValue("characterScan", scanify(value));
                }
            }
        },
        characterScan: {
            type: DataTypes.STRING, field: "character_scan", unique: true, allowNull: false,
            set(value) {
                throw new Error("characterScan cannot be set directly. " +
                    "It can be changed by setting the character property.")
            }
        },
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
        findByName: constant(async (name, rejectOnEmpty = true) => {
            return await User.find({where: {characterScan: scanify(name)}, rejectOnEmpty: rejectOnEmpty});
        }),
        banByName: constant(async name => {
            let user = await User.findByName(name);
            user.banned = true;
            return user.save();
        }),
        unbanByName: constant(async name => {
            let user = await User.findByName(name);
            user.banned = false;
            return user.save();
        }),
        exists: constant(async name => {
            return (await User.findByName(name, false)) > 0;
        }),
        initialize: constant(async function (name) {
            let savedUser = await User.create({
                character: name
            });
            await savedUser.reload({where:{characterScan:scanify(name)}});

            let [items, titles] = await Promise.all([
                Item.findAll({where: {id: {[Op.in]: [0, 4]}}})
                , Title.findAll({where: {id: 0}})
            ]);

            await Promise.all([
                savedUser.setOwnedTitles(titles)
                , savedUser.setEquippedTitle(titles)
                , savedUser.setOwnedItems(items)
                , savedUser.setEquippedItems(items)
            ]);
            return await savedUser.save();
        }),
        pagination: constant(async (pageNumber, perPage = 10) => {
            pageNumber = Math.max(Number(pageNumber), 1);
            perPage = Math.max(Number(perPage), 10);

            let totalCount = await User.count();
            let users = await User.scopes('allData').findAll({limit: perPage, offset: (pageNumber - 1) * perPage});
            return {
                totalPages: Math.ceil(totalCount / perPage)
                , page: pageNumber
                , perPage: perPage
                , data: users
            };
        }),
        destroyByName: constant(async name => {
            return User.destroy({where:{characterScan: scanify(name)}});
        }),
    });

    Object.defineProperties(User.prototype, {
        bbcUser: getterSetter(function () {
            return userBBC(this.character);
        }),
        bbcIcon: getterSetter(function () {
            return iconBBC(this.character);
        }),
        copyTo: constant(async function (target) {
            /** @type {User} src */
            let src = this;
            let dest;
            if (!(target instanceof User)) {
                dest = await User.findByName(String(target));
            } else {
                dest = target;
            }

            let [items, equippedItems, titles, equippedTitles] = await Promise.all([
                src.getOwnedItems()
                , src.getEquippedItems()
                , src.getOwnedTitles()
                , src.getEquippedTitle()
            ]);

            dest.exp = src.exp;
            dest.gold = src.gold;
            dest.notices = src.notices;
            dest.banned = src.banned;
            await dest.save();
            await Promise.all([
                dest.setOwnedItems(items)
                , dest.setEquippedItems(equippedItems)
                , dest.setOwnedTitles(titles)
                , dest.setEquippedTitle(equippedTitles)
            ]);
            return await dest.reload();
        }),

    });

    return User;
}
;
