const Op = require('sequelize').Op;

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
            get() {
                return Boolean(this.getDataValue("notForSale"));
            }
        },
        itemTypeId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            field: 'item_type_id'
        },
        inert: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            get() {
                return Boolean(this.getDataValue("inert"));
            }
        },
    }, {
        tableName: 'item',
        timestamps: false,
        defaultScope: {
            where: {
                inert: false
            }
        },
        scopes: {
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

    return Item;
};

// const store = require('../plugins/etc/items.js');
// class Item {
//   constructor(id) {
//     this.id = Number(id);
//     this.instance = null;
//   }
//   populate() {
//     return new Promise((resolve, reject)=>{
//       const entry = store.find((obj)=>obj.id === this.id);
//       console.log(entry);
//       if (entry) {
//         this.instance = Object.assign({}, entry);
//         resolve(this);
//       } else {
//         reject(null);
//       }
//     });
//   }
//
//   get name () {
//     return this.instance && this.instance.title.replace(/_/g, ' ');
//   }
// }
//
// module.exports = Item;