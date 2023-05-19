import db from "../config/dbConfig.js";
import sequelize from 'sequelize'

export default db.define("buckets", {
    id: {
        primaryKey: true,
        autoIncrement: true,
        type: sequelize.DataTypes.INTEGER,
    },
    name: {
        type: sequelize.DataTypes.STRING,
        allowNull: false,   
    },
    key: {
        type: sequelize.DataTypes.STRING,
        allowNull: false
    },
    size: {
        type: sequelize.DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false
    },
    files_count: {
        type: sequelize.DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false
    }
})