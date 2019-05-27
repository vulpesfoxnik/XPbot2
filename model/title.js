const Op = require('sequelize').Op;
const {getterSetter, constant, scanify} = require('./util');

module.exports = function (sequelize, DataTypes) {
    const Title = sequelize.define('Title', {
        id: {type: DataTypes.INTEGER, field: 'title_id', primaryKey: true},
        title: {type: DataTypes.STRING, field: 'title', allowNull: false},
        titleView: {
            type: DataTypes.STRING, field: 'title_view', allowNull: false,
            set(value) {
                this.setDataValue("title", slugify(value));
            }
        },
        exp: {type: DataTypes.INTEGER, field: 'exp', allowNull: false, defaultValue: 0},
        gold: {type: DataTypes.INTEGER, field: 'gold', allowNull: false, defaultValue: 0},
        notForSale: {type: DataTypes.BOOLEAN, field: 'not_for_sale', allowNull: false, defaultValue: false},
        inert: {type: DataTypes.BOOLEAN, field: 'inert', allowNull: false, defaultValue: false},
    }, {
        tableName: 'title'
        , timestamps: false
    });

    Title.associate = function associate(models) {
        Title.belongsToMany(models.User, {
            as: "usedBy", through: "user_title", foreignKey: "title_id", otherKey: "user_id",
            timestamps: false
        });
        Title.belongsToMany(models.User, {
            as: "ownedBy", through: "user_owned_title", foreignKey: "title_id", otherKey: "user_id",
            timestamps: false
        });
    };

    Object.defineProperties(Title, {});
    Object.defineProperties(Title.prototype, {});

    return Title;
};
