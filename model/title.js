const Op = require('sequelize').Op;

module.exports = function (sequelize, DataTypes) {
    const Title = sequelize.define('Title', {
        id: {type: DataTypes.INTEGER, field: 'title_id', primaryKey: true},
        title: {type: DataTypes.STRING, field: 'title', allowNull: false},
        titleView: {type: DataTypes.STRING, field: 'title_view', allowNull: false},
        exp: {type: DataTypes.INTEGER, field: 'exp', allowNull: false, defaultValue: 0},
        gold: {type: DataTypes.INTEGER, field: 'gold', allowNull: false, defaultValue: 0},
        notForSale: {
            type: DataTypes.BOOLEAN, field: 'not_for_sale', allowNull: false, defaultValue: false,
            // get() {
            //     return Boolean(this.getDataValue("notForSale"));
            // }
        },
        inert: {
            type: DataTypes.BOOLEAN, field: 'inert', allowNull: false, defaultValue: false,
            // get() {
            //     return Boolean(this.getDataValue("inert"));
            // }
        },
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

    return Title;
};
