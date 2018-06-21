const Op = require('sequelize').Op;
const {constant, getterSetter, scanify} = require('./util');

module.exports = function (sequelize, DataTypes) {
    const Item = sequelize.define('Item', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            field: 'item_id',
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        titleView: {
            type: DataTypes.STRING,
            allowNull: false,
            field: 'title_view'
        },
        exp: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        gold: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        notForSale: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            field: 'not_for_sale',
            // get() {
            //     return Boolean(this.getDataValue("notForSale"));
            // }
        },
        itemTypeId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            field: 'item_type_id',
        },
        inert: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            // get() {
            //     return Boolean(this.getDataValue("inert"));
            // }
        },
    }, {
        tableName: 'item',
        timestamps: false,
        scopes: {
            inert: {
                where: {
                    inert: false
                }
            },
            deleted: {
                where: {
                    inert: true
                }
            },
            purchasable: {
                where: {
                    notForSale: false
                }
            }
        }
    });

    Item.associate = (models) => {
        Item.belongsTo(models.ItemType, {foreignKey: {fieldName: 'itemTypeId'}, as: 'type'});
        Item.belongsToMany(models.User, {
            as: "usedBy",
            through: "user_item",
            foreignKey: "item_id",
            otherKey: "user_id",
            timestamps: false
        });
        Item.belongsToMany(models.User, {
            as: "ownedBy",
            through: "user_owned_item",
            foreignKey: "item_id",
            otherKey: "user_id",
            timestamps: false
        });
    };

    function findByItemTypeFn(itemTypeName) {
        return () => {
            return Item.findAll({
                include: [{
                    model: 'ItemType',
                    as: 'type'
                }],
                where: {'type.name': itemTypeName}
            });
        }
    }

    Object.defineProperties(Item, {
        getAllWeapon: constant(findByItemTypeFn('weapon')),
        getAllArmor: constant(findByItemTypeFn('armor')),
        getAllGarment: constant(findByItemTypeFn('garment')),
        getAllDefault: constant(findByItemTypeFn('item')),
        getAllMisc: constant(findByItemTypeFn('unclassified')),
    });

    function forbidSale(state) {
        return () => {
            this.notForSale = state;
            return this.save();
        }
    }

    Object.defineProperties(Item.prototype, {
        permitSale: constant(forbidSale(false)),
        forbidSale: constant(forbidSale(true)),
    });

    return Item;
};
