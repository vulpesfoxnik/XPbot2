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
            }).then(/** @param {User} savedUser */savedUser => {
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
        exists: constant(id => {
            return User.count({characterScan: scanify(id)})
                .then(count => count > 0 ? Promise.resolve(true) : Promise.reject(false));
        }),
        findByName: constant(id => {
            return User.find({characterScan: scanify(id)});
        }),
        pagination: constant((pageNumber, perPage = 10) => {
            pageNumber = Number(pageNumber) <= 0 ? 1 : Number(pageNumber);
            perPage = Number(perPage || 5);

            return User.count().then(count => {
                return User.scopes('allData').findAll({limit: perPage, offset: (pageNumber - 1) * perPage})
                    .then(users => {
                        return {
                            totalPages: Math.ceil(count/perPage),
                            page: pageNumber,
                            perPage: perPage,
                            next: () => User.pagination(pageNumber + 1, perPage),
                            previous: () => User.pagination(pageNumber - 1, perPage),
                            data: users
                        };
                    });
            });
        }),
    });

    Object.defineProperties(User.prototype, {
        bbcUser: getterSetter(function () {
            return userBBC(this.character);
        }),
        bbcIcon: getterSetter(function () {
            return iconBBC(this.character);
        }),
        copyTo: constant(function (target) {
            /** @type {User} src */
            let src = this;
            return (
                new Promise((resolve, reject) => ((target instanceof User) ? reject(false) : resolve(true))))
                .then(() => User.findByName(String(target)), () => target)
                .then(/** @param {User} dest */dest => {
                    if (!dest) throw new Error("Invalid destination user.");

                    return Promise.all([
                        src.getOwnedItems(),
                        src.getEquippedItems(),
                        src.getOwnedTitles(),
                        src.getEquippedTitle(),
                    ])
                        .then(srcItems => {
                            dest.exp = src.exp;
                            dest.gold = src.gold;
                            dest.notices = src.notices;
                            dest.banned = src.banned;
                            return dest.save().then(dest => Promise.all([
                                dest.setOwnedItems(srcItems[0]),
                                dest.setEquippedItems(srcItems[1]),
                                dest.setOwnedTitles(srcItems[2]),
                                dest.setEquippedTitle(srcItems[3]),
                            ])).then(() => User.find({where:{id: dest.id}}));
                        });
                });
        }),
    });

    return User;
};
