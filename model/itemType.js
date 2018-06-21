const Op = require('sequelize').Op;
const {constant, getterSetter} = require('./util');

module.exports = (sequelize, DataTypes) => {
    const ItemType = sequelize.define('ItemType', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            field: 'item_type_id',
        },
        name: {
            type: DataTypes.STRING,
            unique: true,
            field: 'name',
            allowNull: false
        },
        nameView: {
            type: DataTypes.STRING,
            field: 'name_view',
            allowNull: false
        }
    }, {
        tableName: 'item_type',
        timestamps: false
    });

    return ItemType;
};
